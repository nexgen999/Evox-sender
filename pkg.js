// --- VARIABLES GLOBALES ---
let currentFilteredPkgs = [];

// --- FONCTIONS DE CHARGEMENT DES SOURCES ---

async function loadPkgSources() {
  const sourceSelect = document.getElementById('pkg-source-select');
  if (!sourceSelect) return;

  try {
    const res = await fetch('sources.json');
    if (!res.ok) throw new Error(`Impossible de charger sources.json (${res.status})`);
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
    log(`Erreur chargement sources PKG : ${err.message}`, 'error');
  }
}

async function loadPkgsFromUrl(url) {
  const pkgSelect = document.getElementById('pkg-select');
  if (!pkgSelect) return;

  pkgSelect.innerHTML = '<option value="">Chargement...</option>';
  currentFilteredPkgs = [];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const data = await res.json();

    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && Array.isArray(data.packages)) {
      list = data.packages;
    }

    currentFilteredPkgs = list;
    renderPkgDropdown(list);
    log(`${list.length} package(s) PKG chargé(s).`, 'success');

  } catch (err) {
    pkgSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    log(`Erreur lors de la lecture des PKG : ${err.message}`, 'error');
  }
}

function renderPkgDropdown(list) {
  const pkgSelect = document.getElementById('pkg-select');
  if (!pkgSelect) return;

  pkgSelect.innerHTML = '<option value="">-- Sélectionnez un package --</option>';

  list.forEach((item, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    const name = item.name || item.display_name || 'Package sans nom';
    opt.textContent = name;
    pkgSelect.appendChild(opt);
  });
}

// --- FONCTION D'INSTALLATION PKG ---

async function sendPkgInstall() {
  const ipInput = document.getElementById('ps5-ip');
  const portInput = document.getElementById('pkg-port');
  const pkgSelect = document.getElementById('pkg-select');

  const ip = ipInput ? ipInput.value.trim() : '127.0.0.1';
  const port = portInput ? portInput.value.trim() : '12800';
  const selectedIndex = pkgSelect ? pkgSelect.value : '';

  if (!ip) return log('Veuillez saisir l\'adresse IP de la console.', 'error');
  if (selectedIndex === '') return log('Veuillez sélectionner un PKG.', 'error');

  const pkg = currentFilteredPkgs[selectedIndex];
  if (!pkg || !pkg.url) return log('URL du fichier PKG introuvable.', 'error');

  log(`Envoi de l'ordre d'installation pour : ${pkg.name || 'Package'}...`, 'info');

  const endpoint = `http://${ip}:${port}/api/install`;
  const bodyData = JSON.stringify({
    type: 'direct',
    packages: [pkg.url]
  });

  // Utilisation de XMLHttpRequest pour compatibilité WebKit PS5
  const xhr = new XMLHttpRequest();
  xhr.open('POST', endpoint, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      log('Ordre d\'installation reçu par Direct PKG Installer !', 'success');
    } else {
      log(`Le serveur PKG a répondu avec le code HTTP : ${xhr.status}`, 'warning');
    }
  };

  xhr.onerror = function() {
    log(`Erreur de connexion avec Direct PKG Installer sur ${ip}:${port}. Vérifie que l'application est ouverte sur la console.`, 'error');
  };

  xhr.send(bodyData);
}

// --- EVENEMENTS ---
document.addEventListener('DOMContentLoaded', () => {
  loadPkgSources();

  const sourceSelect = document.getElementById('pkg-source-select');
  if (sourceSelect) {
    sourceSelect.addEventListener('change', (e) => {
      const url = e.target.value;
      if (url === 'custom') {
        const customUrl = prompt('Entrez l\'URL du fichier JSON PKG :');
        if (customUrl) loadPkgsFromUrl(customUrl);
      } else if (url) {
        loadPkgsFromUrl(url);
      }
    });
  }

  const btnSend = document.getElementById('btn-send-pkg');
  if (btnSend) {
    btnSend.addEventListener('click', sendPkgInstall);
  }
});
