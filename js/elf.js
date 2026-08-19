document.addEventListener('DOMContentLoaded', () => {
    const btnSendElf = document.getElementById('btn-send-elf');

    if (btnSendElf) {
        btnSendElf.addEventListener('click', async () => {
            const elfSelect = document.getElementById('elf-select');
            const elfUrl = elfSelect ? elfSelect.value : null;

            if (!elfUrl) {
                if (typeof logStatus === 'function') logStatus('[ELF] Veuillez sélectionner un payload ELF.');
                return;
            }

            // Récupération de l'IP et du port
            const ipInput = document.getElementById('ps5-ip');
            const portInput = document.getElementById('elf-port-default');
            
            let ps5Ip = ipInput ? ipInput.value.trim() : '';
            const ps5Port = portInput ? portInput.value.trim() : '9021';

            // Si le champ IP est vide ou mis sur localhost depuis la PS5, on cible l'hôte local (127.0.0.1)
            if (!ps5Ip || ps5Ip === 'localhost') {
                ps5Ip = '127.0.0.1';
            }

            if (typeof logStatus === 'function') {
                logStatus(`[ELF] Téléchargement du binaire : ${elfUrl}...`);
            }

            try {
                // 1. Récupération du fichier ELF sous forme de buffer
                const fetchRes = await fetch(elfUrl);
                if (!fetchRes.ok) throw new Error(`Impossible de télécharger l'ELF (HTTP ${fetchRes.status})`);
                const arrayBuffer = await fetchRes.arrayBuffer();

                // 2. Tentative #1 : Envoi WebSocket Direct (pour navigateur PS5 / GitHub Pages)
                let directSuccess = false;
                try {
                    if (typeof logStatus === 'function') {
                        logStatus(`[ELF WS] Connexion directe vers ws://${ps5Ip}:${ps5Port}...`);
                    }

                    await new Promise((resolve, reject) => {
                        const ws = new WebSocket(`ws://${ps5Ip}:${ps5Port}`);
                        ws.binaryType = 'arraybuffer';

                        const timeout = setTimeout(() => {
                            ws.close();
                            reject(new Error("Timeout de connexion WebSocket"));
                        }, 4000);

                        ws.onopen = () => {
                            clearTimeout(timeout);
                            if (typeof logStatus === 'function') logStatus('[ELF WS] Connecté ! Envoi du payload...');
                            ws.send(arrayBuffer);
                            setTimeout(() => {
                                ws.close();
                                resolve();
                            }, 500);
                        };

                        ws.onerror = (err) => {
                            clearTimeout(timeout);
                            reject(err);
                        };
                    });

                    directSuccess = true;
                    if (typeof logStatus === 'function') {
                        logStatus('[ELF SUCCESS] Payload injecté avec succès en WebSocket direct !');
                    }

                } catch (wsErr) {
                    if (typeof logStatus === 'function') {
                        logStatus(`[ELF WS] Échec WebSocket direct. Bascule sur le relais local (server.js)...`);
                    }
                }

                // 3. Tentative #2 : Fallback sur le serveur relais Node.js si le WS direct a échoué
                if (!directSuccess) {
                    const relayUrl = `http://localhost:3000/send-elf?ip=${ps5Ip}&port=${ps5Port}`;
                    
                    const relayRes = await fetch(relayUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/octet-stream' },
                        body: arrayBuffer
                    });

                    const responseText = await relayRes.text();
                    if (relayRes.ok) {
                        if (typeof logStatus === 'function') {
                            logStatus(`[ELF RELAIS SUCCESS] ${responseText}`);
                        }
                    } else {
                        throw new Error(`Erreur du serveur relais : ${responseText}`);
                    }
                }

            } catch (err) {
                if (typeof logStatus === 'function') {
                    logStatus(`[ELF ERREUR] ${err.message}`);
                }
            }
        });
    }
});
