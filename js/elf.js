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

        // Récupération de l'objet dans le tableau globalElfItems
        const selectedItem = globalElfItems[selectedIndex];
        const elfUrl = selectedItem.url || selectedItem.direct_link || selectedItem.link;

        if (!elfUrl) {
            log("[ELF ERREUR] Aucune URL valide trouvée pour cet élément.");
            return;
        }

        // Récupération IP et Port
        const ipInput = document.getElementById('ps5-ip');
        const portInput = document.getElementById('elf-port-default');
        
        let ps5Ip = ipInput ? ipInput.value.trim() : '';
        const ps5Port = portInput ? portInput.value.trim() : '9021';

        // Si l'IP est vide ou sur localhost depuis la PS5, on pointe vers 127.0.0.1
        if (!ps5Ip || ps5Ip === 'localhost') {
            ps5Ip = '127.0.0.1';
        }

        log(`[ELF] Telechargement depuis : ${elfUrl}`);

        try {
            // 1. Telechargement du binaire .elf
            const fetchRes = await fetch(elfUrl);
            if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status} : Impossible de télécharger le fichier ELF.`);
            const arrayBuffer = await fetchRes.arrayBuffer();
            log(`[ELF] Binaire chargé (${arrayBuffer.byteLength} octets).`);

            // 2. Tentative #1 : WebSocket Direct (navigateur PS5)
            let directSuccess = false;
            try {
                log(`[ELF WS] Connexion vers ws://${ps5Ip}:${ps5Port}...`);

                await new Promise((resolve, reject) => {
                    const ws = new WebSocket(`ws://${ps5Ip}:${ps5Port}`);
                    ws.binaryType = 'arraybuffer';

                    const timer = setTimeout(() => {
                        ws.close();
                        reject(new Error("Timeout WebSocket (4s)"));
                    }, 4000);

                    ws.onopen = () => {
                        clearTimeout(timer);
                        log('[ELF WS] Connecté au loader ! Injection en cours...');
                        ws.send(arrayBuffer);
                        setTimeout(() => {
                            ws.close();
                            resolve();
                        }, 500);
                    };

                    ws.onerror = (err) => {
                        clearTimeout(timer);
                        reject(err);
                    };
                });

                directSuccess = true;
                log('[ELF SUCCÈS] Payload injecté avec succès via WebSocket direct !');

            } catch (wsErr) {
                log(`[ELF WS] Échec WebSocket direct. Tentative via le serveur relais local...`);
            }

            // 3. Tentative #2 : Relais Node.js (depuis PC)
            if (!directSuccess) {
                const relayUrl = `http://localhost:3000/send-elf?ip=${ps5Ip}&port=${ps5Port}`;
                log(`[ELF RELAIS] Envoi de la requête à ${relayUrl}...`);
                
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

    // Attachement de l'événement
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
