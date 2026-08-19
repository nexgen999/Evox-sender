/**
 * Module ELF : Envoi de payloads (.elf / .bin) via le serveur relais Node.js local (port 3000)
 */

async function sendElfPayload() {
    const ipInput = document.getElementById('ps5-ip');
    const portInput = document.getElementById('elf-port-default');
    const elfSelect = document.getElementById('elf-select');

    // Vérification de la présence des éléments HTML
    if (!ipInput || !elfSelect) {
        log("Erreur : Les éléments du formulaire sont introuvables dans la page.", "error");
        return;
    }

    const ip = ipInput.value.trim();
    const port = portInput ? portInput.value.trim() || '9021' : '9021';
    const idx = elfSelect.value;

    // Contrôles de saisie
    if (!ip) {
        log("Veuillez renseigner l'adresse IP de la PS5 dans l'onglet Configuration.", "error");
        return;
    }

    if (idx === "" || idx === null || idx === undefined) {
        log("Veuillez sélectionner un payload ELF dans la liste.", "error");
        return;
    }

    // Récupération du payload sélectionné dans le tableau global
    const payload = (typeof globalElfItems !== 'undefined') ? globalElfItems[idx] : null;

    if (!payload || !payload.url) {
        log("Erreur : Payload introuvable ou URL manquante.", "error");
        return;
    }

    try {
        log(`[1/2] Téléchargement du fichier : ${payload.name}...`, "info");
        
        // 1. Récupération du fichier binaire distant (.elf / .bin)
        const res = await fetch(payload.url);
        if (!res.ok) {
            throw new Error(`Échec du téléchargement du payload (Code HTTP ${res.status})`);
        }
        const elfData = await res.arrayBuffer();

        log(`[2/2] Transmission à la PS5 (${ip}:${port}) via le relais local...`, "warning");

        // 2. Envoi du flux binaire au serveur relais local (server.js)
        const sendRes = await fetch(`http://localhost:3000/send-elf?ip=${encodeURIComponent(ip)}&port=${encodeURIComponent(port)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: elfData
        });

        const statusText = await sendRes.text();

        // 3. Traitement du retour du serveur relais
        if (sendRes.ok) {
            log(`Succès : ${statusText}`, "success");
        } else {
            log(`Échec du relais : ${statusText}`, "error");
        }

    } catch (e) {
        log(`Erreur lors de l'envoi : ${e.message}. Assurez-vous que 'node server.js' tourne bien sur votre PC.`, "error");
    }
}

// Attachement de l'événement au bouton lors du chargement complet du DOM
document.addEventListener('DOMContentLoaded', () => {
    const btnSend = document.getElementById('btn-send-elf');
    if (btnSend) {
        btnSend.addEventListener('click', sendElfPayload);
    } else {
        console.error("Bouton #btn-send-elf introuvable dans le document HTML.");
    }
});