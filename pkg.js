// pkg.js - Gestion des Packages PKG avec sources dynamiques

async function initPkgSources(sources) {
  const select = document.getElementById('pkg-source-select');
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

  handlePkgSourceChange();
}

function handlePkgSourceChange() {
  const select = document.getElementById('pkg-source-select');
  const customGroup = document.getElementById('pkg-custom-url-group');
  if (!select) return;

  if (select.value === 'CUSTOM') {
    if (customGroup) customGroup.style.display = 'flex';
  } else {
    if (customGroup) customGroup.style.display = 'none';
    if (select.value) loadPkgSource(select.value);
  }
}

async function loadPkgSource(url) {
  const targetUrl = formatRawUrl(url);
  if (!targetUrl) return log("URL de source PKG invalide.", "error");

  const select = document.getElementById('pkg-select');

  try {
    log(`Chargement des PKG depuis : ${targetUrl}...`, "info");
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    
    if (select) select.innerHTML = '';

    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && Array.isArray(data.packages)) {
      items = data.packages;
    } else if (typeof data === 'object' && data !== null) {
      items = Object.keys(data).map(key => ({ key, ...data[key] }));
    }

    if (items.length === 0) {
      if (select) select.innerHTML = '<option value="">Aucun package trouvé</option>';
      return log("Aucun package trouvé dans le fichier JSON.", "warning");
    }

    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.url || item.download_url || item.file || item.path || "";
      const name = item.display_name || item.name || item.title || item.filename || item.key || item.url;
      const desc = item.description ? ` - ${item.description}` : '';
      opt.textContent = `${name}${desc}`;
      if (opt.value && select) select.appendChild(opt);
    });

    log(`Liste PKG chargée (${select ? select.options.length : 0} package(s)).`, "success");
  } catch (e) {
    log(`Échec du chargement du JSON PKG`, "error", `Détail : ${e.message}`);
    if (select) select.innerHTML = '<option value="">Erreur de chargement</option>';
  }
}

async function sendPkg() {
  const ip = document.getElementById('ps5-ip').value.trim();
  const port = document.getElementById('pkg-port').value.trim();
  const pkgSelect = document.getElementById('pkg-select');
  const pkgUrl = pkgSelect ? pkgSelect.value : "";

  if (!ip) return log("L'adresse IP n'est pas renseignée.", "error");
  if (!pkgUrl) return log("Aucun PKG sélectionné.", "error");

  const endpoint = `http://${ip}:${port}/api/install`;
  log(`Envoi de l'ordre d'installation à http://${ip}:${port}...`, "info");

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: "direct", url: pkgUrl })
    });

    if (response.ok) {
      log("Commande PKG transmise avec succès !", "success");
    } else {
      log(`Réponse PS5 : HTTP ${response.status}`, "warning");
    }
  } catch (err) {
    log(`Échec d'envoi du PKG`, "error", `Détails : ${err.message}`);
  }
}

