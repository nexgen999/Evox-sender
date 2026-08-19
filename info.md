# Documentation PS5 Manager - Identifiants & Architecture

## Règles d'architecture
1. Ne JAMAIS modifier les ID HTML définis ci-dessous.
2. `index.html` est l'interface unique (gestion des 3 onglets).
3. `sources.js` gère le parsing des JSON, des catégories et des descriptions.
4. `elf.js` et `pkg.js` gèrent uniquement l'envoi réseau des fichiers.
5. `config.js` gère la persistance de l'IP, des ports et la recherche automatique d'IP.
6. `logger.js` fournit la fonction de log globale.

## Dictionnaire des ID HTML (Verrouillés)

### Onglets & Navigation
- `elf-tab-btn` : Bouton onglet ELF Sender
- `pkg-tab-btn` : Bouton onglet PKG Sender
- `config-tab-btn` : Bouton onglet Configuration
- `elf-tab` : Conteneur vue ELF
- `pkg-tab` : Conteneur vue PKG
- `config-tab` : Conteneur vue Configuration

### Configuration (`config.js`)
- `ps5-ip` : Champ de saisie de l'IP PS5
- `elf-port-default` : Port ELF par défaut (9021)
- `pkg-port-default` : Port PKG par défaut (12800)
- `btn-autodetect-ip` : Bouton pour lancer le scan du réseau local

### Onglet ELF (`elf.js` / `sources.js`)
- `elf-source-select` : Menu déroulant des dépôts ELF
- `elf-category-select` : Menu déroulant des catégories ELF
- `elf-select` : Menu déroulant de la liste des fichiers (.elf / .bin)
- `elf-desc` : Zone d'affichage de la description ELF
- `btn-send-elf` : Bouton d'envoi du payload ELF

### Onglet PKG (`pkg.js` / `sources.js`)
- `pkg-source-select` : Menu déroulant des dépôts PKG
- `pkg-category-select` : Menu déroulant des catégories PKG
- `pkg-select` : Menu déroulant de la liste des fichiers PKG
- `pkg-desc` : Zone d'affichage de la description PKG
- `btn-send-pkg` : Bouton d'envoi du package PKG

### Console (`logger.js`)
- `status-console` : Zone d'affichage des logs
- `btn-clear-console` : Bouton pour effacer la console
