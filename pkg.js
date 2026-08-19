let allPkgPackages = [];

async function initPkgModule() {
    try {
        const res = await fetch('sources.json');
        const sources = await res.json();
        
        const sourceSelect = document.getElementById('pkg-source-select');
        sourceSelect.innerHTML = '';

        if (sources.pkg_sources && sources.pkg_sources.length > 0) {
            sources.pkg_sources.forEach(src => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name;
                sourceSelect.appendChild(opt);
            });
            loadPkgPackages(sources.pkg_sources[0].url);
        }
    } catch (e) {
        log(`Erreur PKG sources.json: ${e.message}`, "error");
    }
}

async function loadPkgPackages(url) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        allPkgPackages = Array.isArray(data) ? data : (data.packages || []);
        
        const pkgSelect = document.getElementById('pkg-select');
        pkgSelect.innerHTML = '';

        allPkgPackages.forEach((p, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.textContent = p.name || p.display_name || "Package";
            pkgSelect.appendChild(opt);
        });

        log(`Liste PKG chargée (${allPkgPackages.length} package(s)).`, "success");
        updatePkgDescription();
    } catch (e) {
        log(`Erreur chargement PKG: ${e.message}`, "error");
    }
}

function updatePkgDescription() {
    const idx = document.getElementById('pkg-select').value;
    const descBox = document.getElementById('pkg-desc');
    if (idx !== "" && allPkgPackages[idx]) {
        descBox.textContent = allPkgPackages[idx].description || "Aucune description.";
    } else {
        descBox.textContent = "Sélectionnez un package pour voir sa description.";
    }
}

async function sendPkgInstall() {
    const ip = document.getElementById('ps5-ip').value.trim() || '127.0.0.1';
    const port = document.getElementById('pkg-port').value.trim() || '12800';
    const idx = document.getElementById('pkg-select').value;

    if (idx === "") return log("Veuillez sélectionner un PKG.", "error");

    const pkg = allPkgPackages[idx];
    log(`Envoi de la commande d'installation pour ${pkg.name}...`, "info");

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${ip}:${port}/api/install`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
        log(`Demande d'installation transmise avec succès !`, "success");
    };

    xhr.onerror = function() {
        log(`Échec de connexion à Direct PKG Installer (${ip}:${port}).`, "error");
    };

    xhr.send(JSON.stringify({ type: 'direct', packages: [pkg.url] }));
}

document.addEventListener('DOMContentLoaded', () => {
    initPkgModule();

    document.getElementById('pkg-source-select').addEventListener('change', (e) => loadPkgPackages(e.target.value));
    document.getElementById('pkg-select').addEventListener('change', updatePkgDescription);
    document.getElementById('btn-send-pkg').addEventListener('click', sendPkgInstall);
});
