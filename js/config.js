/**
 * Module Configuration : Sauvegarde de l'IP, des ports et détection automatique d'IP PS5.
 */
function saveConfig() {
    const ip = document.getElementById('ps5-ip').value.trim();
    const elfPort = document.getElementById('elf-port-default').value.trim();
    const pkgPort = document.getElementById('pkg-port-default').value.trim();

    localStorage.setItem('ps5_ip', ip);
    localStorage.setItem('ps5_elf_port', elfPort);
    localStorage.setItem('ps5_pkg_port', pkgPort);
}

function loadConfig() {
    const ip = localStorage.getItem('ps5_ip') || '';
    const elfPort = localStorage.getItem('ps5_elf_port') || '9021';
    const pkgPort = localStorage.getItem('ps5_pkg_port') || '12800';

    document.getElementById('ps5-ip').value = ip;
    document.getElementById('elf-port-default').value = elfPort;
    document.getElementById('pkg-port-default').value = pkgPort;
}

/**
 * Scan du réseau local pour détecter le port 12800 (Direct PKG Installer) ou 9021 (elfldr).
 */
async function autoDetectPS5IP() {
    log("Recherche automatique de l'IP PS5 sur le réseau local...", "info");

    // Tentative d'extraire la base sous-réseau (ex: 192.168.1)
    let baseSubnet = "192.168.1";
    const currentIp = document.getElementById('ps5-ip').value.trim();
    if (currentIp && currentIp.split('.').length === 4) {
        baseSubnet = currentIp.split('.').slice(0, 3).join('.');
    }

    const pkgPort = document.getElementById('pkg-port-default').value.trim() || '12800';
    let found = false;

    for (let i = 2; i < 255; i++) {
        if (found) break;
        const testIp = `${baseSubnet}.${i}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 150);

        try {
            // Test de ping HTTP rapide sur le port Direct PKG Installer
            await fetch(`http://${testIp}:${pkgPort}/`, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
            clearTimeout(timeoutId);
            
            document.getElementById('ps5-ip').value = testIp;
            saveConfig();
            log(`PS5 détectée à l'adresse IP : ${testIp}`, "success");
            found = true;
        } catch (e) {
            clearTimeout(timeoutId);
        }
    }

    if (!found) {
        log("Aucune PS5 répondante trouvée sur la plage " + baseSubnet + ".X", "warning");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadConfig();

    document.getElementById('ps5-ip').addEventListener('change', saveConfig);
    document.getElementById('elf-port-default').addEventListener('change', saveConfig);
    document.getElementById('pkg-port-default').addEventListener('change', saveConfig);
    document.getElementById('btn-autodetect-ip').addEventListener('click', autoDetectPS5IP);
});
