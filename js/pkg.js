/**
 * Module PKG : Transmet la demande d'installation au serveur relais Node.js local
 */

async function sendPkgInstall() {
    const ipInput = document.getElementById('ps5-ip');
    const portInput = document.getElementById('pkg-port-default');
    const pkgSelect = document.getElementById('pkg-select');

    if (!ipInput || !pkgSelect) {
        log("Erreur : Les éléments du formulaire PKG sont introuvables.", "error");
        return;
    }

    const ip = ipInput.value.trim();
    const port = portInput ? portInput.value.trim() || '12800' : '12800';
    const idx = pkgSelect.value;

    if (!ip) {
        log("Veuillez renseigner l'adresse IP de la PS5 dans la Configuration.", "error");
        return;
    }

    if (idx === "" || idx === null || idx === undefined) {
        log("Veuillez sélectionner un package PKG dans la liste.", "error");
        return;
    }

    const pkg = (typeof globalPkgItems !== 'undefined') ? globalPkgItems[idx] : null;

    if (!pkg || !pkg.url) {
        log("Erreur : Package introuvable ou URL manquante.", "error");
        return;
    }

    const pkgName = pkg.name || pkg.display_name || "Package";

    try {
        log(`Envoi de l'ordre d'installation pour "${pkgName}"...`, "info");

        // Transmission au relais Node.js
        const sendRes = await fetch(`http://localhost:3000/send-pkg?ip=${encodeURIComponent(ip)}&port=${encodeURIComponent(port)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: pkg.url })
        });

        const statusText = await sendRes.text();

        if (sendRes.ok) {
            log(`Succès : ${statusText}`, "success");
        } else {
            log(`Échec : ${statusText}`, "error");
        }

    } catch (e) {
        log(`Erreur lors de l'envoi du PKG : ${e.message}. Assurez-vous que 'node server.js' tourne bien.`, "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnSendPkg = document.getElementById('btn-send-pkg');
    if (btnSendPkg) {
        btnSendPkg.addEventListener('click', sendPkgInstall);
    } else {
        console.error("Bouton #btn-send-pkg introuvable dans le HTML.");
    }
});