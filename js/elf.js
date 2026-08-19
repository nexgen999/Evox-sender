/**
 * Module ELF : Envoi réseau avec gestion des restrictions HTTPS/CORS
 */
async function sendElfPayload() {
    const ip = document.getElementById('ps5-ip').value.trim();
    const port = document.getElementById('elf-port-default').value.trim() || '9021';
    const idx = document.getElementById('elf-select').value;

    if (!ip) {
        log("Veuillez renseigner l'IP de la PS5 dans Configuration.", "error");
        return;
    }
    if (idx === "") {
        log("Veuillez sélectionner un payload ELF.", "error");
        return;
    }

    const payload = globalElfItems[idx];
    if (!payload || !payload.url) {
        log("URL du payload invalide.", "error");
        return;
    }

    log(`[1/2] Téléchargement du payload : ${payload.name}...`, "info");

    try {
        // Téléchargement du binaire ELF/BIN
        const res = await fetch(payload.url);
        if (!res.ok) throw new Error(`Impossible de télécharger le fichier (${res.status})`);
        const arrayBuffer = await res.arrayBuffer();

        log(`[2/2] Envoi du binaire vers ${ip}:${port}...`, "warning");

        // Utilisation d'un Blob binaire brut pour le port elfldr
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `http://${ip}:${port}`, true);

        // Timeout de 10 secondes si la console ne répond pas
        xhr.timeout = 10000;

        xhr.onload = function() {
            log(`Payload "${payload.name}" envoyé avec succès !`, "success");
        };

        xhr.onerror = function() {
            log(`Échec d'envoi vers ${ip}:${port}. Si vous êtes sur PC via GitHub Pages (HTTPS), le navigateur bloque les flux HTTP locaux.`, "error");
        };

        xhr.ontimeout = function() {
            log(`Délai dépassé (Timeout) lors de la connexion à ${ip}:${port}.`, "error");
        };

        xhr.send(blob);

    } catch (e) {
        log(`Erreur : ${e.message}`, "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-send-elf').addEventListener('click', sendElfPayload);
});
