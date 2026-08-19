const express = require('express');
const net = require('net');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/octet-stream', limit: '100mb' }));
app.use(express.static(__dirname));

// ==========================================
// FONCTION UTILITAIRE : SOCKET TCP BRUT
// ==========================================
function sendTcpData(ip, port, dataString) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = '';

        client.setTimeout(6000);

        client.connect(port, ip, () => {
            console.log(`[TCP] Connecté à ${ip}:${port}, transmission des données...`);
            client.write(dataString, 'utf8', (err) => {
                if (err) return reject(err);
            });
        });

        client.on('data', (chunk) => {
            responseData += chunk.toString();
        });

        client.on('close', () => {
            resolve(responseData);
        });

        client.on('error', (err) => {
            reject(err);
        });

        client.on('timeout', () => {
            client.destroy();
            reject(new Error(`Timeout TCP sur le port ${port}`));
        });
    });
}

// ==========================================
// ROUTE 1 : RELAIS ELF (TCP Socket - Port 9021)
// ==========================================
app.post('/send-elf', (req, res) => {
    const ps5Ip = req.query.ip;
    const ps5Port = parseInt(req.query.port, 10) || 9021;

    if (!ps5Ip) return res.status(400).send("Adresse IP de la PS5 manquante.");
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).send("Erreur : Le fichier ELF est vide ou invalide.");
    }

    console.log(`[ELF] Envoi de ${req.body.length} octets vers ${ps5Ip}:${ps5Port}...`);

    const client = new net.Socket();
    client.setTimeout(10000);

    client.connect(ps5Port, ps5Ip, () => {
        client.write(req.body, (err) => {
            if (err) {
                console.error(`[ELF] Erreur d'écriture : ${err.message}`);
                res.status(500).send(`Erreur lors de l'envoi du binaire : ${err.message}`);
                client.destroy();
            } else {
                console.log(`[ELF] Payload transmis avec succès !`);
                client.end();
                res.send("Payload ELF envoyé avec succès !");
            }
        });
    });

    client.on('error', (err) => {
        console.error(`[ELF] Erreur TCP : ${err.message}`);
        if (!res.headersSent) {
            res.status(500).send(`Impossible de se connecter à la PS5 sur ${ps5Ip}:${ps5Port} (${err.message})`);
        }
    });

    client.on('timeout', () => {
        client.destroy();
        if (!res.headersSent) {
            res.status(504).send(`Connexion expirée (Timeout) vers ${ps5Ip}:${ps5Port}.`);
        }
    });
});

// ==========================================
// ROUTE 2 : RELAIS PKG (DPI v1 Port 9090 & DPI v2 Port 12800)
// ==========================================
app.post('/send-pkg', async (req, res) => {
    const ps5Ip = req.query.ip || '192.168.1.24';
    const pkgUrl = req.body.url;
    let targetPort = parseInt(req.query.port, 10);

    if (!pkgUrl) return res.status(400).send("URL du PKG manquante.");

    console.log(`[PKG] Demande d'installation reçue pour : ${pkgUrl}`);

    // Liste des combinaisons à tester selon le port demandé ou par défaut
    let testConfigs = [];

    if (targetPort === 9090) {
        // Mode DPI v1 / etaHEN Web API explicite (Port 9090)
        testConfigs = [
            { port: 9090, payload: JSON.stringify({ op: "install", url: pkgUrl }) + "\n", label: "DPI v1 (op: install)" },
            { port: 9090, payload: JSON.stringify({ action: "install", url: pkgUrl }) + "\n", label: "DPI v1 (action: install)" },
            { port: 9090, payload: JSON.stringify({ url: pkgUrl }) + "\n", label: "DPI v1 (raw url)" }
        ];
    } else if (targetPort === 12800) {
        // Mode DPI v2 explicite (Port 12800)
        testConfigs = [
            { port: 12800, payload: JSON.stringify({ type: 'direct', packages: [pkgUrl] }) + "\n", label: "DPI v2 (type: direct)" },
            { port: 12800, payload: JSON.stringify({ url: pkgUrl }) + "\n", label: "DPI v2 (raw url)" },
            { port: 12800, payload: pkgUrl + "\n", label: "DPI v2 (string text)" }
        ];
    } else {
        // Mode Automatique : Test DPI v1 (9090) puis DPI v2 (12800)
        testConfigs = [
            { port: 9090, payload: JSON.stringify({ op: "install", url: pkgUrl }) + "\n", label: "DPI v1 (op: install)" },
            { port: 9090, payload: JSON.stringify({ url: pkgUrl }) + "\n", label: "DPI v1 (raw url)" },
            { port: 12800, payload: JSON.stringify({ type: 'direct', packages: [pkgUrl] }) + "\n", label: "DPI v2 (type: direct)" },
            { port: 12800, payload: JSON.stringify({ url: pkgUrl }) + "\n", label: "DPI v2 (raw url)" }
        ];
    }

    for (const config of testConfigs) {
        try {
            console.log(`[PKG] Essai via ${config.label} sur ${ps5Ip}:${config.port}...`);
            const reply = await sendTcpData(ps5Ip, config.port, config.payload);
            console.log(`[PKG] Réponse PS5 (${config.label}) :`, reply || '(connexion close)');

            // Analyse de la réponse d'etaHEN / DPI
            if (reply && reply.includes('"res":"0"')) {
                return res.send(`Succès : Ordre accepté par la PS5 via ${config.label} !`);
            } else if (reply && reply.includes('-')) {
                console.log(`[PKG] Avertissement : Code d'erreur PS5 détecté (${reply.trim()})`);
            } else {
                return res.send(`Ordre d'installation transmis avec succès via ${config.label} !`);
            }
        } catch (err) {
            console.log(`[PKG] Échec ${config.label} : ${err.message}`);
        }
    }

    res.status(500).send(`Impossible de transmettre le PKG à ${ps5Ip}. Vérifiez que l'URL est accessible et que le service PKG est bien actif sur la console.`);
});

// Démarrage du serveur relais local
app.listen(3000, () => {
    console.log("==================================================");
    console.log(" Serveur Relais actif sur : http://localhost:3000");
    console.log("==================================================");
});