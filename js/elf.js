(function initElfSender() {
    function log(msg) {
        if (typeof logStatus === 'function') {
            logStatus(msg);
        } else {
            console.log(msg);
            const consoleBox = document.getElementById('status-console');
            if (consoleBox) {
                consoleBox.innerHTML += `<div>${msg}</div>`;
                consoleBox.scrollTop = consoleBox.scrollHeight;
            }
        }
    }

    async function handleElfSend() {
        log("[ELF] Bouton 'Injecter l'ELF' cliqué.");

        const elfSelect = document.getElementById('elf-select');
        const selectedIndex = elfSelect ? elfSelect.value : null;

        if (selectedIndex === null || selectedIndex === "" || typeof globalElfItems === 'undefined' || !globalElfItems[selectedIndex]) {
            log("[ELF ERREUR] Veuillez sélectionner un payload ELF valide dans la liste.");
            alert("Veuillez sélectionner un payload ELF.");
            return;
        }

        const selectedItem = globalElfItems[selectedIndex];
        const elfUrl = selectedItem.url || selectedItem.direct_link || selectedItem.link;

        if (!elfUrl) {
            log("[ELF ERREUR] Aucune URL valide trouvée pour cet élément.");
            return;
        }

        const ipInput = document.getElementById('ps5-ip');
        const portInput = document.getElementById('elf-port-default');
        
        let ps5Ip = ipInput ? ipInput.value.trim() : '';
        const ps5Port = portInput ? portInput.value.trim() : '9021';

        if (!ps5Ip || ps5Ip === 'localhost') {
            ps5Ip = '127.0.0.1';
        }

        log(`[ELF] Téléchargement du binaire : ${elfUrl}`);

        try {
            // 1. Récupération du fichier .elf
            const fetchRes = await fetch(elfUrl);
            if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status} : Téléchargement du binaire impossible.`);
            const arrayBuffer = await fetchRes.arrayBuffer();
            log(`[ELF] Binaire chargé (${arrayBuffer.byteLength} octets).`);

            // 2. Tentative #1 : Direct Fetch TCP (Navigateur PS5)
            let directSuccess = false;
            try {
                log(`[ELF DIRECT] Envoi brut vers http://${ps5Ip}:${ps5Port}...`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);

                await fetch(`http://${ps5Ip}:${ps5Port}`, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: arrayBuffer,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                directSuccess = true;
                log('[ELF SUCCÈS] Payload transmis directement au loader PS5 !');

            } catch (directErr) {
                log(`[ELF DIRECT] Échec de l'envoi direct (${directErr.message}). Bascule sur server.js...`);
            }

            // 3. Tentative #2 : Serveur relais local (PC)
            if (!directSuccess) {
                const relayUrl = `http://localhost:3000/send-elf?ip=${ps5Ip}&port=${ps5Port}`;
                log(`[ELF RELAIS] Envoi au serveur local ${relayUrl}...`);
                
                const relayRes = await fetch(relayUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: arrayBuffer
                });

                const responseText = await relayRes.text();
                if (relayRes.ok) {
                    log(`[ELF RELAIS SUCCÈS] ${responseText}`);
                } else {
                    throw new Error(`Erreur du serveur relais : ${responseText}`);
                }
            }

        } catch (err) {
            log(`[ELF ERREUR CRITIQUE] ${err.message}`);
        }
    }

    function attachEvent() {
        const btnSendElf = document.getElementById('btn-send-elf');
        if (btnSendElf) {
            btnSendElf.removeEventListener('click', handleElfSend);
            btnSendElf.addEventListener('click', handleElfSend);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachEvent);
    } else {
        attachEvent();
    }
})();
