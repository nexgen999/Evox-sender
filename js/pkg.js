/**
 * Module PKG : Transmet la demande d'installation au serveur Direct PKG Installer (port 12800).
 */
async function sendPkgInstall() {
    const ip = document.getElementById('ps5-ip').value.trim();
    const port = document.getElementById('pkg-port-default').value.trim() || '12800';
    const idx = document.getElementById('pkg-select').value;

    if (!ip) {
        log("Veuillez renseigner l'adresse IP dans l'onglet Configuration.", "error");
        return;
    }
    if (idx === "") {
        log("Veuillez sélectionner un package PKG.", "error");
        return;
    }

    const pkg = globalPkgItems[idx];
    if (!pkg || !pkg.url) {
        log("URL du PKG invalide.", "error");
        return;
    }

    log(`Envoi de l'ordre d'installation pour : ${pkg.name || 'Package'}...`, "info");

    try {
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
                log(`Commande transmise à Direct PKG Installer avec succès !`, "success");
            } else {
                log(`Réponse PS5 (Code HTTP ${xhr.status})`, "warning");
            }
        };

        xhr.onerror = function() {
            log(`Échec de connexion à Direct PKG Installer sur ${ip}:${port}.`, "error");
        };

        xhr.send(payloadData);

    } catch (e) {
        log(`Erreur lors de l'envoi du PKG : ${e.message}`, "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-send-pkg').addEventListener('click', sendPkgInstall);
});
