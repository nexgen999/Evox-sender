async function sendElfPayload(targetIp, targetPort, payloadUrl) {
  try {
    log(`[1/3] Téléchargement du payload depuis GitHub...`, "info");
    
    // 1. Récupération du fichier ELF sous forme de ArrayBuffer
    const response = await fetch(payloadUrl);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const buffer = await response.arrayBuffer();

    log(`[2/3] Connexion au loader TCP (${targetIp}:${targetPort})...`, "warning");

    // 2. Envoi via un socket brut si supporté par l'environnement WebKit,
    // ou via un relais WebSocket local (127.0.0.1)
    // Pour la plupart des loaders PS5 sur port 9021 :
    const socket = new WebSocket(`ws://${targetIp}:${targetPort}`);
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      log(`[3/3] Socket ouvert. Envoi du fichier binary (${buffer.byteLength} octets)...`, "info");
      socket.send(buffer);
      log(`Payload envoyé avec succès !`, "success");
      socket.close();
    };

    socket.onerror = (err) => {
      // Si la console bloque le WebSocket, fallback sur une requête Blob POST brute
      sendViaRawPost(targetIp, targetPort, buffer);
    };

  } catch (err) {
    log(`Échec d'envoi : ${err.message}`, "error");
  }
}

// Fallback pour les loaders acceptant du Stream brut
function sendViaRawPost(ip, port, buffer) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `http://${ip}:${port}/`, true);
  xhr.setRequestHeader("Content-Type", "application/octet-stream");
  
  xhr.onload = () => {
    if (xhr.status === 200) log("Payload envoyé avec succès via Stream !", "success");
    else log(`Réponse du serveur: ${xhr.status}`, "warning");
  };
  
  xhr.onerror = () => {
    log("Échec de la connexion réseau au loader.", "error");
  };

  xhr.send(new Blob([buffer]));
}
