// --- VARIABLES GLOBALES ---
let currentFilteredPayloads = [];

// --- FONCTIONS DE CHARGEMENT DES SOURCES ---

// Charge la liste des sources ELF depuis sources.json
async function loadElfSources() {
  const sourceSelect = document.getElementById('elf-source-select');
  if (!sourceSelect) return;

  try {
    const res = await fetch('sources.json');
    if (!res.ok) throw new Error(`Impossible de charger sources.json (${res.status})`);
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
    log(`Erreur chargement sources ELF : ${err.message}`, 'error');
  }
}

// Charge les payloads ELF depuis la source sélectionnée
async function loadElfPayloadsFromUrl(url) {
  const payloadSelect = document.getElementById('elf-select');
  if (!payloadSelect) return;

  payloadSelect.innerHTML = '<option value="">Chargement...</option>';
  currentFilteredPayloads = [];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const data = await res.json();

    let payloadsList = [];

    // Support du format Tableau [] ou Objet {} avec catégories
    if (Array.isArray(data)) {
      payloadsList = data;
    } else if (typeof data === 'object') {
      Object.keys(data).forEach(cat => {
        if (Array.isArray(data[cat])) {
          data[cat].forEach(item => {
            payloadsList.push({ ...item, category: item.category || cat });
          });
        }
      });
    }

    currentFilteredPayloads = payloadsList;
    renderElfDropdown(payloadsList);
    log(`${payloadsList.length} payload(s) chargé(s).`, 'success');

  } catch (err) {
    payloadSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    log(`Erreur lors de la lecture des payloads : ${err.message}`, 'error');
  }
}

// Remplissage du menu déroulant des payloads
function renderElfDropdown(list) {
  const payloadSelect = document.getElementById('elf-select');
  if (!payloadSelect) return;

  payloadSelect.innerHTML = '<option value="">-- Sélectionnez un payload --</option>';

  list.forEach((item, index) => {
    const opt = document.createElement('option');
    opt.value = index; // On stocke l'index
    const name = item.name || item.display_name || 'Payload sans nom';
    const ver = item.version ? ` (v${item.version})` : '';
    const cat = item.category ? ` [${item.category}]` : '';
    opt.textContent = `${name}${ver}${cat}`;
    payloadSelect.appendChild(opt);
  });
}

// --- FONCTION D'ENVOI ELF (COMPATIBLE WEBKIT PS5 / TCP 9021) ---

async function sendElfPayload() {
  const ipInput = document.getElementById('ps5-ip');
  const portInput = document.getElementById('elf-port');
  const payloadSelect = document.getElementById('elf-select');

  const ip = ipInput ? ipInput.value.trim() : '127.0.0.1';
  const port = portInput ? portInput.value.trim() : '9021';
  const selectedIndex = payloadSelect ? payloadSelect.value : '';

  if (!ip) return log('Veuillez saisir l\'adresse IP de la console.', 'error');
  if (selectedIndex === '') return log('Veuillez sélectionner un payload.', 'error');

  const payload = currentFilteredPayloads[selectedIndex];
  if (!payload || !payload.url) return log('URL du payload introuvable.', 'error');

  log(`[1/2] Téléchargement du fichier ELF (${payload.name || 'payload'})...`, 'info');

  try {
    const response = await fetch(payload.url);
    if (!response.ok) throw new Error(`Erreur lors de la récupération du fichier (${response.status})`);
    const buffer = await response.arrayBuffer();

    log(`[2/2] Envoi du payload vers ${ip}:${port}...`, 'warning');

    // Utilisation de XHR avec ArrayBuffer/Blob pour contourner les restrictions fetch WebKit
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `http://${ip}:${port}/`, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function() {
      log(`Payload transmis avec succès à ${ip}:${port} !`, 'success');
    };

    xhr.onerror = function() {
      // Fallback WebSocket si XHR TCP direct échoue
      log('Envoi via Stream HTTP échoué. Tentative par Socket...', 'warning');
      sendViaWebSocket(ip, port, buffer);
    };

    xhr.send(new Blob([buffer]));

  } catch (err) {
    log(`Échec : ${err.message}`, 'error');
  }
}

function sendViaWebSocket(ip, port, buffer) {
  try {
    const ws = new WebSocket(`ws://${ip}:${port}`);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      ws.send(buffer);
      log('Payload injecté via Socket avec succès !', 'success');
      ws.close();
    };

    ws.onerror = () => {
      log(`Impossible de se connecter au loader sur ${ip}:${port}. Vérifie que le serveur TCP/elfldr est bien lancé.`, 'error');
    };
  } catch (e) {
    log(`Erreur Socket : ${e.message}`, 'error');
  }
}

// --- EVENEMENTS ---
document.addEventListener('DOMContentLoaded', () => {
  loadElfSources();

  const sourceSelect = document.getElementById('elf-source-select');
  if (sourceSelect) {
    sourceSelect.addEventListener('change', (e) => {
      const url = e.target.value;
      if (url === 'custom') {
        const customUrl = prompt('Entrez l\'URL du fichier JSON :');
        if (customUrl) loadElfPayloadsFromUrl(customUrl);
      } else if (url) {
        loadElfPayloadsFromUrl(url);
      }
    });
  }

  const btnSend = document.getElementById('btn-send-elf');
  if (btnSend) {
    btnSend.addEventListener('click', sendElfPayload);
  }
});
