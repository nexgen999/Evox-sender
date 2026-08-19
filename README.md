<div align="center">
  <img src="logo.png" alt="Evox-sender Logo" width="180" />

  # Evox-sender

  **Evox sender web elf & pkg sender**

  Interface web fluide et légère pour la gestion et l'envoi de payloads ELF et l'installation de packages PKG sur PlayStation 5.
</div>

---

## 📌 Présentation

**Evox-sender** est une interface web qui permet de :
* Transmettre des fichiers **ELF** directement au loader TCP (**elfldr**, port `9021` par défaut).
* Envoyer des requêtes d'installation de fichiers **PKG** à l'application cible (**Direct PKG Installer**, port `12800` par défaut).
* Charger dynamiquement des listes de payloads et de packages hébergées sur des dépôts distants ou en local.
* Consulter la console de statut intégrée pour suivre l'état des transferts en temps réel.

---

## ⚙️ Configuration du fichier `sources.json`

Le fichier `sources.json` situé à la racine regroupe toutes vos sources de Payloads et de PKG. Vous pouvez y ajouter autant de dépôts que vous le souhaitez.

### Structure de `sources.json` :

```json
{
  "elf_sources": [
    {
      "name": "Dépôt Principal (nexgen999)",
      "url": "[https://raw.githubusercontent.com/nexgen999/PS5-Super-PLDMGR-Auto-Updater/main/json/payloads.json](https://raw.githubusercontent.com/nexgen999/PS5-Super-PLDMGR-Auto-Updater/main/json/payloads.json)"
    }
  ],
  "pkg_sources": [
    {
      "name": "Dépôt Principal PKG",
      "url": "[https://raw.githubusercontent.com/nexgen999/PS5-Super-PLDMGR-Auto-Updater/main/json/pkg.json](https://raw.githubusercontent.com/nexgen999/PS5-Super-PLDMGR-Auto-Updater/main/json/pkg.json)"
    }
  ]
}

### elf_sources : Liste des fichiers JSON contenant les objets ELF.
### pkg_sources : Liste des fichiers JSON contenant les liens des packages PKG.

## 📄 Formatage des fichiers JSON
Pour que les listes soient lues correctement par l'interface, vos fichiers distant payloads.json et pkg.json doivent respecter l'une des structures ci-dessous.

## 1. Format pour payloads.json (ELF)
L'interface supporte deux types de structures pour les payloads :

### Option A : Structure sous forme de tableau (Recommandé)

[
  {
    "name": "PS5 Kstuff",
    "version": "1.4",
    "category": "Kernel",
    "description": "Payload d'activation kstuff pour le support fPKG.",
    "url": "[https://dépôt.com/payloads/kstuff.elf](https://dépôt.com/payloads/kstuff.elf)"
  },
  {
    "name": "FTP Server",
    "version": "1.0",
    "category": "Réseau",
    "description": "Serveur FTP pour transférer des fichiers sur le stockage interne.",
    "url": "[https://dépôt.com/payloads/ftpserver.elf](https://dépôt.com/payloads/ftpserver.elf)"
  }
]

### Option B : Structure groupée par clés / catégories

{
  "Kernel": [
    {
      "name": "PS5 Kstuff",
      "version": "1.4",
      "description": "Payload kstuff.",
      "url": "[https://dépôt.com/payloads/kstuff.elf](https://dépôt.com/payloads/kstuff.elf)"
    }
  ],
  "Utilitaires": [
    {
      "name": "FTP Server",
      "description": "Serveur FTP.",
      "url": "[https://dépôt.com/payloads/ftpserver.elf](https://dépôt.com/payloads/ftpserver.elf)"
    }
  ]
}

## 2. Format pour pkg.json (PKG)
Deux structures sont reconnues pour la liste des packages :

### Option A : Format dépôt avec la clé "packages" (Standard)

{
  "repository": "Mon Dépôt PKG",
  "packages": [
    {
      "name": "Application Demo",
      "description": "Exemple d'application fPKG",
      "url": "[http://192.168.1.50/pkgs/app.pkg](http://192.168.1.50/pkgs/app.pkg)"
    }
  ]
}

### Option B : Tableau simple

[
  {
    "display_name": "Application Demo",
    "description": "Exemple d'application fPKG",
    "url": "[http://192.168.1.50/pkgs/app.pkg](http://192.168.1.50/pkgs/app.pkg)"
  }
]


## 🚀 Utilisation
Ouvrez index.html (vue globale) ou index.1.html (vue avec onglets) dans votre navigateur.
Renseignez l'adresse IP de votre console PS5 dans le champ Configuration.
Choisissez une source dans la liste déroulante ou sélectionnez -- Ajouter une URL personnalisée --.
Sélectionnez votre payload ELF ou votre package PKG.
Cliquez sur Injecter l'ELF ou Installer le PKG.
