// elf.js
let currentFilteredPayloads = [];

// Fonction utilitaire de log (si non définie dans la page HTML)
function writeLog(msg, type = 'info') {
    if (typeof log === 'function') {
        log(msg, type);
    } else {
        const consoleEl = document.getElementById('status-console') || document.getElementById('log');
        if (consoleEl) {
            const time = new Date().toLocaleTimeString();
            consoleEl.innerHTML += `<div class="log-${type}">[${time}] ${msg}</div>`;
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }
}

// 1. Chargement des sources depuis sources.json
async function loadElfSources() {
    const sourceSelect = document.getElementById('elf-source-select');
    if (!sourceSelect) return;

    try {
        const res = await fetch('sources.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        sourceSelect.innerHTML = '<option value="">-- Sélectionnez une source --</option>';
        if (data.elf_sources && Array.isArray(data.elf_sources)) {
            data.elf_sources.forEach((src, idx) => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name || `Source ${idx + 1}`;
                sourceSelect.appendChild(opt);
            });
        }
        
        const customOpt = document.createElement('option');
        customOpt.value = 'custom';
        customOpt.textContent = '-- Ajouter une URL personnalisée --';
        sourceSelect.appendChild(customOpt);

    } catch (err) {
        writeLog(`Erreur chargement sources ELF : ${err.message}`, 'error');
    }
}

// 2. Chargement et parsing des payloads (gestion des catégories)
async function loadElfPayloads(url) {
    const payloadSelect = document.getElementById('elf-select');
    if (!payloadSelect) return;

    payloadSelect.innerHTML = '<option value="">Chargement des payloads...</option>';
    currentFilteredPayloads = [];

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Réinitialisation de la liste
        payloadSelect.innerHTML = '<option value="">-- Sélectionnez un payload --</option>';

        // Cas 1 : Tableau simple [{name, url, category}, ...]
        if (Array.isArray(data)) {
            currentFilteredPayloads = data;
            
            // Regroupement par catégories
            const categories = {};
            data.forEach((item, index) => {
                const cat = item.category || 'Autres';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({ ...item, _index: index });
            });

            Object.keys(categories).forEach(catName => {
                const group = document.createElement('optgroup');
                group.label = catName;
                categories[catName].forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item._index;
                    opt.textContent = item.name + (item.version ? ` (v${item.version})` : '');
                    group.appendChild(opt);
                });
                payloadSelect.appendChild(group);
            });

        } 
        // Cas 2 : Objet avec clés de catégories {"Kernel": [...], "Réseau": [...]}
        else if (typeof data === 'object') {
            let globalIndex = 0;
            Object.keys(data).forEach(catName => {
                if (Array.isArray(data[catName])) {
                    const group = document.createElement('optgroup');
                    group.label = catName;
                    
                    data[catName].forEach(item => {
                        const indexedItem = { ...item, category: item.category || catName, _index: globalIndex };
                        currentFilteredPayloads.push(indexedItem);
                        
                        const opt = document.createElement('option');
                        opt.value = globalIndex;
                        opt.textContent = item.name + (item.version ? ` (v${item.version})` : '');
                        group.appendChild(opt);
                        
                        globalIndex++;
                    });
                    payloadSelect.appendChild(group);
                }
            });
        }

        writeLog(`${currentFilteredPayloads.length} payload(s) ELF chargé(s).`, 'success');

    } catch (err) {
        payloadSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        writeLog(`Impossible de lire la liste des payloads : ${err.message}`, 'error');
    }
}

// 3. Affichage des détails au survol/sélection
function updateElfDetails() {
    const payloadSelect = document.getElementById('elf-select');
    const detailsContainer = document.getElementById('elf-details') || document.getElementById('payload-desc');
    if (!payloadSelect || !detailsContainer) return;

    const idx = payloadSelect.value;
    if (idx === "" || !currentFilteredPayloads[idx]) {
        detailsContainer.textContent = "Sélectionnez un payload pour voir sa description.";
        return;
    }

    const payload = currentFilteredPayloads[idx];
    const desc = payload.description || "Aucune description disponible.";
    const version = payload.version ? ` | Version: ${payload.version}` : '';
    const category = payload.category ? ` | Catégorie: ${payload.category}` : '';
    
    detailsContainer.innerHTML = `<strong>${payload.name}</strong>${version}${category}<br>${desc}`;
}

// 4. Envoi du fichier ELF (Netcat / XHR Stream pour PS5)
async function sendElf() {
    const ipInput = document.getElementById('ps5-ip');
    const portInput = document.getElementById('elf-port');
    const payloadSelect = document.getElementById('elf-select');

    const ip = ipInput ? ipInput.value.trim() : '';
    const port = portInput ? portInput.value.trim() : '9021';
    const idx = payloadSelect ? payloadSelect.value : '';

    if (!ip) return writeLog('Veuillez renseigner l\'adresse IP de la PS5.', 'error');
    if (idx === '') return writeLog('Veuillez sélectionner un payload.', 'error');

    const payload = currentFilteredPayloads[idx];
    if (!payload || !payload.url) return writeLog('URL du payload invalide.', 'error');

    writeLog(`[1/2] Téléchargement du payload "${payload.name}"...`, 'info');

    try {
        const res = await fetch(payload.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();

        writeLog(`[2/2] Envoi en cours vers ${ip}:${port}...`, 'warning');

        // Utilisation de XMLHttpRequest + Blob pour la compatibilité WebKit
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `http://${ip}:${port}/`, true);
        
        xhr.onload = function() {
            writeLog(`Payload "${payload.name}" injecté avec succès !`, 'success');
        };

        xhr.onerror = function() {
            writeLog(`Échec de connexion à ${ip}:${port}. Vérifiez que le loader TCP est actif.`, 'error');
        };

        xhr.send(new Blob([buffer]));

    } catch (err) {
        writeLog(`Erreur lors du traitement du payload : ${err.message}`, 'error');
    }
}

// 5. Attachement des événements DOM
document.addEventListener('DOMContentLoaded', () => {
    loadElfSources();

    const sourceSelect = document.getElementById('elf-source-select');
    if (sourceSelect) {
        sourceSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'custom') {
                const url = prompt('URL du fichier JSON de payloads :');
                if (url) loadElfPayloads(url);
            } else if (val) {
                loadElfPayloads(val);
            }
        });
    }

    const payloadSelect = document.getElementById('elf-select');
    if (payloadSelect) {
        payloadSelect.addEventListener('change', updateElfDetails);
    }

    const btnSend = document.getElementById('btn-send-elf');
    if (btnSend) {
        btnSend.addEventListener('click', sendElf);
    }
});
