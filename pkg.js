async function sendPkgInstall(targetIp, pkgUrl) {
  const endpoint = `http://${targetIp}:12800/api/install`; // Port standard Direct PKG Installer
  
  const payloadData = {
    type: "direct",
    packages: [pkgUrl]
  };

  try {
    log(`Envoi de l'ordre d'installation pour : ${pkgUrl}`, "info");

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadData)
    });

    if (response.ok) {
      log(`Installation lancée sur la console !`, "success");
    } else {
      log(`Le serveur PKG a répondu avec le code : ${response.status}`, "error");
    }
  } catch (err) {
    log(`Erreur lors de l'envoi du PKG : ${err.message}`, "error");
  }
}
