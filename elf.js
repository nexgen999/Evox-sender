// elf.js
let currentFilteredPayloads = [];

// Chargement des sources ELF
async function loadElfSources() {
    const sourceSelect = document.getElementById('elf-source-select');
    if (!sourceSelect) return; // Ne fait rien si l'élément n'existe pas sur la page

    try {
        const res = await fetch('sources.json');
        const data = await res.json();
        
        sourceSelect.innerHTML = '<option value="">-- Sélectionnez une source --</option>';
        if (data.elf_sources) {
            data.elf_sources.forEach(src => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name;
                sourceSelect.appendChild(opt);
            });
        }
        sourceSelect.innerHTML += '<option value="custom">-- Ajouter une URL personnalisée --</option>';
    } catch (e) { console.error("Erreur chargement sources ELF", e); }
}

// Chargement de la liste des payloads
async function loadElfPayloads(url) {
    const listSelect = document.getElementById('elf-select');
    if (!listSelect) return;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        currentFilteredPayloads = Array.isArray(data) ? data : [];
        
        listSelect.innerHTML = '<option value="">-- Sélectionnez un payload --</option>';
        currentFilteredPayloads.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = p.name || 'Payload';
            listSelect.appendChild(opt);
        });
    } catch (e) { console.error("Erreur chargement payloads", e); }
}

// Envoi type "Netcat" (XHR + Blob pour le WebKit PS5)
async function sendElf() {
    const ip = document.getElementById('ps5-ip')?.value;
    const port = document.getElementById('elf-port')?.value || '9021';
    const idx = document.getElementById('elf-select')?.value;
    
    if (!ip || idx === "") return alert("IP ou Payload manquant");

    const payload = currentFilteredPayloads[idx];
    const buffer = await (await fetch(payload.url)).arrayBuffer();

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${ip}:${port}/`, true);
    xhr.onload = () => alert("Payload envoyé !");
    xhr.onerror = () => alert("Échec de connexion (vérifie l'IP et le port)");
    xhr.send(new Blob([buffer]));
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadElfSources();
    document.getElementById('elf-source-select')?.addEventListener('change', (e) => {
        if(e.target.value === 'custom') {
            const url = prompt("URL du JSON :");
            if(url) loadElfPayloads(url);
        } else if(e.target.value) {
            loadElfPayloads(e.target.value);
        }
    });
    document.getElementById('btn-send-elf')?.addEventListener('click', sendElf);
});
