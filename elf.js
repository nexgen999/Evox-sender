let allElfPayloads = [];

async function initElfModule() {
    log("Chargement de sources.json...");
    try {
        const res = await fetch('sources.json');
        const sources = await res.json();
        
        const sourceSelect = document.getElementById('elf-source-select');
        sourceSelect.innerHTML = '';

        if (sources.elf_sources && sources.elf_sources.length > 0) {
            sources.elf_sources.forEach(src => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name;
                sourceSelect.appendChild(opt);
            });
            log("Sources chargées.", "success");
            loadElfPayloads(sources.elf_sources[0].url);
        }
    } catch (e) {
        log(`Erreur chargement sources.json: ${e.message}`, "error");
    }
}

async function loadElfPayloads(url) {
    log(`Chargement des ELF depuis : ${url}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        allElfPayloads = Array.isArray(data) ? data : [];
        
        populateCategories();
        filterAndRenderElf();
        log(`Liste ELF chargée (${allElfPayloads.length} payload(s)).`, "success");
    } catch (e) {
        log(`Erreur chargement payloads: ${e.message}`, "error");
    }
}

function populateCategories() {
    const catSelect = document.getElementById('elf-category-select');
    catSelect.innerHTML = '<option value="all">-- Toutes les catégories --</option>';
    
    const categories = new Set();
    allElfPayloads.forEach(p => { if (p.category) categories.add(p.category); });
    
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
    });
}

function filterAndRenderElf() {
    const selectedCat = document.getElementById('elf-category-select').value;
    const elfSelect = document.getElementById('elf-select');
    elfSelect.innerHTML = '';

    const filtered = selectedCat === 'all' 
        ? allElfPayloads 
        : allElfPayloads.filter(p => p.category === selectedCat);

    filtered.forEach((p, index) => {
        const opt = document.createElement('option');
        opt.value = allElfPayloads.indexOf(p);
        opt.textContent = p.name + (p.version ? ` (${p.version})` : '');
        elfSelect.appendChild(opt);
    });

    updateElfDescription();
}

function updateElfDescription() {
    const idx = document.getElementById('elf-select').value;
    const descBox = document.getElementById('elf-desc');
    if (idx !== "" && allElfPayloads[idx]) {
        descBox.textContent = allElfPayloads[idx].description || "Aucune description.";
    } else {
        descBox.textContent = "Sélectionnez un payload pour voir sa description.";
    }
}

async function sendElfPayload() {
    const ip = document.getElementById('ps5-ip').value.trim() || '127.0.0.1';
    const port = document.getElementById('elf-port').value.trim() || '9021';
    const idx = document.getElementById('elf-select').value;

    if (idx === "") return log("Veuillez sélectionner un payload.", "error");

    const payload = allElfPayloads[idx];
    log(`[1/2] Téléchargement du payload ${payload.name}...`, "info");

    try {
        const response = await fetch(payload.url);
        const buffer = await response.arrayBuffer();

        log(`[2/2] Envoi vers ${ip}:${port}...`, "warning");

        // Utilisation de XHR + Blob (Stream direct compatible WebKit PS5)
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `http://${ip}:${port}/`, true);
        
        xhr.onload = function() {
            log(`Payload ${payload.name} envoyé avec succès !`, "success");
        };

        xhr.onerror = function() {
            log(`Échec d'envoi vers ${ip}:${port}. Assurez-vous que le loader écoute bien.`, "error");
        };

        xhr.send(new Blob([buffer]));

    } catch (e) {
        log(`Erreur : ${e.message}`, "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initElfModule();

    document.getElementById('elf-source-select').addEventListener('change', (e) => loadElfPayloads(e.target.value));
    document.getElementById('elf-category-select').addEventListener('change', filterAndRenderElf);
    document.getElementById('elf-select').addEventListener('change', updateElfDescription);
    document.getElementById('btn-send-elf').addEventListener('click', sendElfPayload);
});
