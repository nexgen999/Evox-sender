/**
 * Module Sources : Gère le téléchargement des JSON, l'isolation des catégories et l'affichage des descriptions.
 */
let globalElfItems = [];
let globalPkgItems = [];

async function initSources() {
    log("Chargement de sources.json...");
    try {
        const res = await fetch('sources.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sources = await res.json();

        // 1. Sources ELF
        const elfSourceSelect = document.getElementById('elf-source-select');
        elfSourceSelect.innerHTML = '';
        if (sources.elf_sources && sources.elf_sources.length > 0) {
            sources.elf_sources.forEach(src => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name;
                elfSourceSelect.appendChild(opt);
            });
            fetchElfData(sources.elf_sources[0].url);
        }

        // 2. Sources PKG
        const pkgSourceSelect = document.getElementById('pkg-source-select');
        pkgSourceSelect.innerHTML = '';
        if (sources.pkg_sources && sources.pkg_sources.length > 0) {
            sources.pkg_sources.forEach(src => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name;
                pkgSourceSelect.appendChild(opt);
            });
            fetchPkgData(sources.pkg_sources[0].url);
        }

        log("Sources initiales chargées.", "success");

    } catch (e) {
        log(`Erreur chargement sources.json : ${e.message}`, "error");
    }
}

// Helper : Extrait un tableau plat d'éléments peu importe le format JSON reçu
function parseFlexibleJsonData(data) {
    if (Array.isArray(data)) {
        return data;
    } 
    
    if (typeof data === 'object' && data !== null) {
        // Cas 1 : La liste est encapsulée dans une clé sous-jacente (ex: {"aio store": [...]})
        const keys = Object.keys(data);
        for (const key of keys) {
            if (Array.isArray(data[key])) {
                return data[key];
            }
        }

        // Cas 2 : L'objet a des clés servant directement de catégories (ex: {"Kernel": [...], "Tools": [...]})
        let aggregated = [];
        for (const catName of keys) {
            if (Array.isArray(data[catName])) {
                const itemsWithCat = data[catName].map(item => ({
                    ...item,
                    category: item.category || catName
                }));
                aggregated = aggregated.concat(itemsWithCat);
            }
        }
        if (aggregated.length > 0) return aggregated;
    }

    return [];
}

// --- GESTION ELF ---
async function fetchElfData(url) {
    log(`Chargement des ELF : ${url}`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawData = await res.json();
        
        // Extraction flexible pour géreritsPLK et nexgen999
        globalElfItems = parseFlexibleJsonData(rawData);

        // Remplir le menu des catégories
        const catSelect = document.getElementById('elf-category-select');
        catSelect.innerHTML = '<option value="all">-- Toutes les catégories --</option>';
        
        const categories = [...new Set(globalElfItems.map(item => item.category).filter(Boolean))];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });

        renderElfList();
        log(`Liste ELF mise à jour (${globalElfItems.length} éléments).`, "success");
    } catch (e) {
        log(`Erreur chargement ELF : ${e.message}`, "error");
    }
}

function renderElfList() {
    const selectedCat = document.getElementById('elf-category-select').value;
    const elfSelect = document.getElementById('elf-select');
    elfSelect.innerHTML = '';

    const filtered = selectedCat === 'all' 
        ? globalElfItems 
        : globalElfItems.filter(item => item.category === selectedCat);

    filtered.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = globalElfItems.indexOf(item);
        opt.textContent = item.name + (item.version ? ` (${item.version})` : '');
        elfSelect.appendChild(opt);
    });

    updateElfDesc();
}

function updateElfDesc() {
    const idx = document.getElementById('elf-select').value;
    const descBox = document.getElementById('elf-desc');
    if (idx !== "" && globalElfItems[idx]) {
        descBox.textContent = globalElfItems[idx].description || "Aucune description fournie.";
    } else {
        descBox.textContent = "Sélectionnez un payload pour voir sa description.";
    }
}

// --- GESTION PKG ---
async function fetchPkgData(url) {
    log(`Chargement des PKG : ${url}`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawData = await res.json();
        
        globalPkgItems = parseFlexibleJsonData(rawData);

        // Remplir le menu des catégories
        const catSelect = document.getElementById('pkg-category-select');
        catSelect.innerHTML = '<option value="all">-- Toutes les catégories --</option>';
        
        const categories = [...new Set(globalPkgItems.map(item => item.category).filter(Boolean))];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });

        renderPkgList();
        log(`Liste PKG mise à jour (${globalPkgItems.length} éléments).`, "success");
    } catch (e) {
        log(`Erreur chargement PKG : ${e.message}`, "error");
    }
}

function renderPkgList() {
    const selectedCat = document.getElementById('pkg-category-select').value;
    const pkgSelect = document.getElementById('pkg-select');
    pkgSelect.innerHTML = '';

    const filtered = selectedCat === 'all' 
        ? globalPkgItems 
        : globalPkgItems.filter(item => item.category === selectedCat);

    filtered.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = globalPkgItems.indexOf(item);
        opt.textContent = item.name || item.display_name || "Package";
        pkgSelect.appendChild(opt);
    });

    updatePkgDesc();
}

function updatePkgDesc() {
    const idx = document.getElementById('pkg-select').value;
    const descBox = document.getElementById('pkg-desc');
    if (idx !== "" && globalPkgItems[idx]) {
        descBox.textContent = globalPkgItems[idx].description || "Aucune description fournie.";
    } else {
        descBox.textContent = "Sélectionnez un package pour voir sa description.";
    }
}

// Événements DOM
document.addEventListener('DOMContentLoaded', () => {
    initSources();

    document.getElementById('elf-source-select').addEventListener('change', (e) => fetchElfData(e.target.value));
    document.getElementById('elf-category-select').addEventListener('change', renderElfList);
    document.getElementById('elf-select').addEventListener('change', updateElfDesc);

    document.getElementById('pkg-source-select').addEventListener('change', (e) => fetchPkgData(e.target.value));
    document.getElementById('pkg-category-select').addEventListener('change', renderPkgList);
    document.getElementById('pkg-select').addEventListener('change', updatePkgDesc);
});
