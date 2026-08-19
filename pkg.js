// pkg.js
let currentFilteredPkgs = [];

function writePkgLog(msg, type = 'info') {
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

async function loadPkgSources() {
    const sourceSelect = document.getElementById('pkg-source-select');
    if (!sourceSelect) return;

    try {
        const res = await fetch('sources.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        sourceSelect.innerHTML = '<option value="">-- Sélectionnez une source --</option>';
        if (data.pkg_sources && Array.isArray(data.pkg_sources)) {
            data.pkg_sources.forEach((src, idx) => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name || `Source PKG ${idx + 1}`;
                sourceSelect.appendChild(opt);
            });
        }

        const customOpt = document.createElement('option');
        customOpt.value = 'custom';
        customOpt.textContent = '-- Ajouter une URL personnalisée --';
        sourceSelect.appendChild(customOpt);

    } catch (err) {
        writePkgLog(`Erreur chargement sources PKG : ${err.message}`, 'error');
    }
}

async function loadPkgs(url) {
    const pkgSelect = document.getElementById('pkg-select');
    if (!pkgSelect) return;

    pkgSelect.innerHTML = '<option value="">Chargement des packages...</option>';
    currentFilteredPkgs = [];

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        let list = [];
        if (Array.isArray(data)) {
            list = data;
        } else if (data && Array.isArray(data.packages)) {
            list = data.packages;
        }

        currentFilteredPkgs = list;
        pkgSelect.innerHTML = '<option value="">-- Sélectionnez un package --</option>';

        list.forEach((item, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.textContent = item.name || item.display_name || `Package ${index + 1}`;
            pkgSelect.appendChild(opt);
        });

        writePkgLog(`${list.length} package(s) PKG chargé(s).`, 'success');

    } catch (err) {
        pkgSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        writePkgLog(`Impossible de lire la liste des PKG : ${err.message}`, 'error');
    }
}

function updatePkgDetails() {
    const pkgSelect = document.getElementById('pkg-select');
    const detailsContainer = document.getElementById('pkg-details') || document.getElementById('pkg-desc');
    if (!pkgSelect || !detailsContainer) return;

    const idx = pkgSelect.value;
    if (idx === "" || !currentFilteredPkgs[idx]) {
        detailsContainer.textContent = "Sélectionnez un package pour voir ses informations.";
        return;
    }

    const pkg = currentFilteredPkgs[idx];
    const desc = pkg.description || "Aucune description.";
    detailsContainer.innerHTML = `<strong>${pkg.name || 'Package'}</strong><br>${desc}<br><small>URL: ${pkg.url}</small>`;
}

async function sendPkg() {
    const ipInput = document.getElementById('ps5-ip');
    const portInput = document.getElementById('pkg-port');
    const pkgSelect = document.getElementById('pkg-select');

    const ip = ipInput ? ipInput.value.trim() : '';
    const port = portInput ? portInput.value.trim() : '12800';
    const idx = pkgSelect ? pkgSelect.value : '';

    if (!ip) return writePkgLog('Veuillez renseigner l\'adresse IP de la PS5.', 'error');
    if (idx === '') return writePkgLog('Veuillez sélectionner un PKG.', 'error');

    const pkg = currentFilteredPkgs[idx];
    if (!pkg || !pkg.url) return writePkgLog('URL du PKG introuvable.', 'error');

    writePkgLog(`Envoi de la demande d'installation pour "${pkg.name || 'Package'}"...`, 'info');

    const endpoint = `http://${ip}:${port}/api/install`;
    const payloadData = JSON.stringify({
        type: 'direct',
        packages: [pkg.url]
    });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            writePkgLog(`Ordre d'installation envoyé à Direct PKG Installer !`, 'success');
        } else {
            writePkgLog(`Erreur de réponse du serveur PKG (Code ${xhr.status})`, 'warning');
        }
    };

    xhr.onerror = function() {
        writePkgLog(`Échec de connexion à Direct PKG Installer sur ${ip}:${port}.`, 'error');
    };

    xhr.send(payloadData);
}

document.addEventListener('DOMContentLoaded', () => {
    loadPkgSources();

    const sourceSelect = document.getElementById('pkg-source-select');
    if (sourceSelect) {
        sourceSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'custom') {
                const url = prompt('URL du fichier JSON de PKGs :');
                if (url) loadPkgs(url);
            } else if (val) {
                loadPkgs(val);
            }
        });
    }

    const pkgSelect = document.getElementById('pkg-select');
    if (pkgSelect) {
        pkgSelect.addEventListener('change', updatePkgDetails);
    }

    const btnSend = document.getElementById('btn-send-pkg');
    if (btnSend) {
        btnSend.addEventListener('click', sendPkg);
    }
});
