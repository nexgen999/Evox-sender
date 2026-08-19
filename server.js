// server.js
const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

app.post('/send-elf', (req, res) => {
    const ps5Ip = req.query.ip;
    const ps5Port = parseInt(req.query.port, 10) || 9021;

    if (!ps5Ip) {
        return res.status(400).send('IP PS5 manquante');
    }

    const client = new net.Socket();
    client.setTimeout(5000);

    client.connect(ps5Port, ps5Ip, () => {
        client.write(req.body, () => {
            client.end();
            res.send('Payload transmis à la PS5 avec succès');
        });
    });

    client.on('error', (err) => {
        res.status(500).send(`Erreur de connexion : ${err.message}`);
    });

    client.on('timeout', () => {
        client.destroy();
        res.status(500).send('Timeout lors de la connexion à la PS5');
    });
});

app.listen(PORT, () => {
    console.log(`Serveur relais démarré sur http://localhost:${PORT}`);
});
