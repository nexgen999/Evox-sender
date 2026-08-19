/**
 * Module ELF : Reçoit la sélection et transmet le fichier .elf / .bin via XHR/Blob à la PS5.
 */
async function sendElfPayload() {
    const ip = document.getElementById('ps5-ip').value.trim();
    const port = document.getElementById('elf-port-default').value.trim() || '9021';
    const idx = document.getElementById('elf-select').value;

    if (!ip) {
        log("Veuillez renseigner l'adresse IP dans l'onglet Configuration.", "error");
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

    log(`[1/2] Téléchargement du fichier : ${payload.name}...`, "info");

    try {
        const res = await fetch(payload.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();

        log(`[2/2] Envoi vers ${ip}:${port}...`, "warning");

        // Utilisation de XMLHttpRequest + Blob (Injections fluides sous WebKit PS5)
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `http://${ip}:${port}/`, true);

        xhr.onload = function() {
            log(`Payload "${payload.name}" injecté avec succès !`, "success");
        };

        xhr.onerror = function() {
            log(`Impossible de se connecter à ${ip}:${port}. Vérifiez que le serveur TCP/elfldr écoute.`, "error");
        };

        xhr.send(new Blob([buffer]));

    } catch (e) {
        log(`Erreur lors de l'envoi de l'ELF : ${e.message}`, "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-send-elf').addEventListener('click', sendElfPayload);
});
