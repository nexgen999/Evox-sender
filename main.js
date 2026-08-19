const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1150,
        height: 750,
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index-lite.html');
}

app.whenReady().then(() => {
    // Lancement du serveur Express interne directement dans Electron
    try {
        require('./server.js');
        console.log("Serveur relais intégré démarré avec succès.");
    } catch (err) {
        console.error("Erreur lors du démarrage du serveur relais :", err);
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
