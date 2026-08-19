// elf.js - Gestion des Payloads ELF avec sources dynamiques
let allPayloads = []; 
let currentFilteredPayloads = [];

async function initElfSources(sources) {
  const select = document.getElementById('elf-source-select');
  if (!select) return;

  select.innerHTML = '';
  sources.forEach(src => {
    const opt = document.createElement('option');
    opt.value = src.url;
    opt.textContent = src.name;
    select.appendChild(opt);
  });

  const customOpt = document.createElement('option');
  customOpt.value = 'CUSTOM';
  customOpt.textContent = '-- Ajouter une URL personnalisée --';
  select.appendChild(customOpt);

  handleElfSourceChange();
}

function handleElfSourceChange() {
  const select = document.getElementById('elf-source-select');
  const customGroup = document.getElementById('elf-custom-url-group');
  if (!select) return;

  if (select.value === 'CUSTOM') {
    if (customGroup) customGroup.style.display = 'flex';
  } else {
    if (customGroup) customGroup.style.display = 'none';
    if (select.value) loadElfSource(select.value);
  }
}

async function loadElfSource(url) {
  const targetUrl = formatRawUrl(url);
  if (!targetUrl) return log("URL de source ELF invalide.", "error");

  const catSelect = document.getElementById('elf-category');
  const elfSelect = document.getElementById('elf-select');

  try {
    log(`Chargement des ELF depuis : ${targetUrl}...`, "info");
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    
    allPayloads = parsePayloadsData(data);
    populateElfCategories();
    log(`Liste ELF chargée (${allPayloads.length} payload(s)).`, "success");
  } catch (e) {
    log(`Échec du chargement du JSON ELF`, "error", `Détail : ${e.message}`);
    if (catSelect) catSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    if (elfSelect) elfSelect.innerHTML = '<option value="">Aucun payload</option>';
  }
}

function parsePayloadsData(data) {
  let rawItems = [];
  if (Array.isArray(data)) {
    rawItems = data;
  } else if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data.payloads)) {
      rawItems = data.payloads;
    } else {
      Object.keys(data).forEach(catName => {
        const content = data[catName];
        if (Array.isArray(content)) {
          content.forEach(item => rawItems.push({ ...item, category: item.category || catName }));
        }
      });
    }
  }

  return rawItems.map((item, index) => ({
    id: index,
    name: item.name || item.display_name || item.title || item.filename || `Payload #${index + 1}`,
    version: item.version || "",
    category: String(item.category || item.cat || item.group || item.folder || "Non classé").trim(),
    description: String(item.description || item.desc || item.info || "Aucune description disponible.").trim(),
    url: item.url || item.download_url || item.file || item.path || item.direct_url || ""
  }));
}

function populateElfCategories() {
  const catSelect = document.getElementById('elf-category');
  if (!catSelect) return;
  catSelect.innerHTML = '';

  const categories = [...new Set(allPayloads.map(p => p.category))].sort((a, b) => a.localeCompare(b));

  const defaultOpt = document.createElement('option');
  defaultOpt.value = "ALL";
  defaultOpt.textContent = "-- Toutes les catégories --";
  catSelect.appendChild(defaultOpt);

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });

  filterPayloads();
}

function filterPayloads() {
  const catSelect = document.getElementById('elf-category');
  const elfSelect = document.getElementById('elf-select');
  if (!catSelect || !elfSelect) return;

  const selectedCat = catSelect.value;
  elfSelect.innerHTML = '';

  currentFilteredPayloads = (selectedCat === "ALL" || !selectedCat) 
    ? allPayloads 
    : allPayloads.filter(p => p.category === selectedCat);

  currentFilteredPayloads.sort((a, b) => a.name.localeCompare(b.name));

  if (currentFilteredPayloads.length === 0) {
    elfSelect.innerHTML = '<option value="">Aucun payload disponible</option>';
    updateElfDescription();
    return;
  }

  currentFilteredPayloads.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    const verText = item.version ? ` (${item.version})` : '';
    const catText = selectedCat === "ALL" ? ` [${item.category}]` : '';
    opt.textContent = `${item.name}${verText}${catText}`;
    elfSelect.appendChild(opt);
  });

  updateElfDescription();
}

function updateElfDescription() {
  const elfSelect = document.getElementById('elf-select');
  const descBox = document.getElementById('elf-description');
  if (!elfSelect || !descBox) return;

  const payload = currentFilteredPayloads.find(p => p.id == elfSelect.value);

  if (payload && payload.description) {
    descBox.textContent = payload.description;
    descBox.classList.remove('empty');
  } else {
    descBox.textContent = "Aucune description disponible pour ce payload.";
    descBox.classList.add('empty');
  }
}

async function sendElf() {
  const ip = document.getElementById('ps5-ip').value.trim();
  const port = document.getElementById('elf-port').value.trim();
  const elfSelect = document.getElementById('elf-select');
  const payload = currentFilteredPayloads.find(p => p.id == elfSelect.value);

  if (!ip) return log("L'adresse IP n'est pas renseignée.", "error");
  if (!payload || !payload.url) return log("Aucun payload sélectionné.", "error");

  log(`[1/2] Téléchargement de ${payload.name}...`, "info");

  try {
    const response = await fetch(payload.url);
    if (!response.ok) throw new Error(`Code HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    log(`Fichier récupéré (${buffer.byteLength} octets).`, "success");

    log(`[2/2] Envoi au socket TCP (http://${ip}:${port})...`, "warning");
    await fetch(`http://${ip}:${port}`, { method: 'POST', mode: 'no-cors', body: buffer });
    log(`Payload "${payload.name}" transmis !`, "success");
  } catch (err) {
    log(`Échec de l'opération`, "error", `Détails : ${err.message}`);
  }
}

