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
        if (!elfSelect || !elfSelect.value) {
            log("[ELF ERREUR] Veuillez sélectionner un payload ELF dans la liste.");
            alert("Veuillez sélectionner un payload ELF.");
            return;
        }

        let elfUrl = elfSelect.value;

        // Si la valeur est un ID/Index (ex: "22") ou un attribut data-url
        const selectedOption = elfSelect.options[elfSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset && selectedOption.dataset.url) {
            elfUrl = selectedOption.dataset.url;
        } else if (typeof window.elfSourcesData !== 'undefined') {
            // Recherche dans le tableau global des sources si présent
            const foundItem = window.elfSourcesData.find(item => String(item.id) === String(elfUrl));
            if (foundItem && foundItem.url) {
                elfUrl = foundItem.url;
            }
        }

        // Vérification si elfUrl est bien une URL valide
        if (!elfUrl.startsWith('http://') && !elfUrl.startsWith('https://') && !elfUrl.startsWith('./') && !elfUrl.startsWith('/')) {
            log(`[ELF ERREUR] L'élément sélectionné ("${elfUrl}") n'est pas une URL de fichier valide.`);
            return;
        }

        // Récupération IP et Port
        const ipInput = document.getElementById('ps5-ip');
        const portInput = document.getElementById('elf-port-default');
        
        let ps5Ip = ipInput ? ipInput.value.trim() : '';
        const ps5Port = portInput ? portInput.value.trim() : '9021';

        if (!ps5Ip || ps5Ip === 'localhost') {
            ps5Ip = '127.0.0.1';
        }

        log(`[ELF] Chargement du fichier depuis : ${elfUrl}`);

        try {
            // 1. Récupération du fichier binaire .elf
            const fetchRes = await fetch(elfUrl);
            if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status} : Impossible de télécharger l'ELF.`);
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
                log(`[ELF WS] Échec WebSocket direct. Bascule sur le relais local (server.js)...`);
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
