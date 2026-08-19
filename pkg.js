// pkg.js
let currentFilteredPkgs = [];

async function loadPkgSources() {
    const sourceSelect = document.getElementById('pkg-source-select');
    if (!sourceSelect) return;

    try {
        const res = await fetch('sources.json');
        const data = await res.json();
        
        sourceSelect.innerHTML = '<option value="">-- Sélectionnez une source --</option>';
        if (data.pkg_sources) {
            data.pkg_sources.forEach(src => {
                const opt = document.createElement('option');
                opt.value = src.url;
                opt.textContent = src.name;
                sourceSelect.appendChild(opt);
            });
        }
    } catch (e) { console.error("Erreur chargement sources PKG", e); }
}

async function loadPkgs(url) {
    const listSelect = document.getElementById('pkg-select');
    if (!listSelect) return;

    try {
        const res = await fetch(url);
        const data = await res.json();
        currentFilteredPkgs = data.packages || data;
        
        listSelect.innerHTML = '<option value="">-- Sélectionnez un package --</option>';
        currentFilteredPkgs.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = p.name || 'Package';
            listSelect.appendChild(opt);
        });
    } catch (e) { console.error("Erreur chargement PKGs", e); }
}

async function sendPkg() {
    const ip = document.getElementById('ps5-ip')?.value;
    const port = document.getElementById('pkg-port')?.value || '12800';
    const idx = document.getElementById('pkg-select')?.value;
    
    if (!ip || idx === "") return alert("IP ou Package manquant");

    const pkg = currentFilteredPkgs[idx];
    const body = JSON.stringify({ type: "direct", packages: [pkg.url] });

    fetch(`http://${ip}:${port}/api/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
    }).then(res => alert("Ordre d'installation envoyé !"))
      .catch(e => alert("Erreur d'installation"));
}

document.addEventListener('DOMContentLoaded', () => {
    loadPkgSources();
    document.getElementById('pkg-source-select')?.addEventListener('change', (e) => {
        if(e.target.value) loadPkgs(e.target.value);
    });
    document.getElementById('btn-send-pkg')?.addEventListener('click', sendPkg);
});
