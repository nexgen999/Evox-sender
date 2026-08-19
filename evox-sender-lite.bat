@echo off
title Démarrage PS5 Sender (Automatique)
chcp 65001 > nul

echo =========================================
echo   Lancement du serveur relais PS5 ELF
echo =========================================
echo.

:: 0. Vérification de la présence de Node.js et NPM
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR CRITIQUE] Node.js n'est pas installé sur cet ordinateur.
    echo Télécharge et installe Node.js depuis https://nodejs.org
    echo.
    pause
    exit /b
)

:: Répertoire de travail dédié dans %TEMP%
set "WORK_DIR=%TEMP%\PS5_Sender_Server"
set "RAW_URL=https://raw.githubusercontent.com/nexgen999/Evox-sender/main/server.js"

if not exist "%WORK_DIR%" mkdir "%WORK_DIR%"
cd /d "%WORK_DIR%"

:: 1. Téléchargement de server.js
echo [1/4] Téléchargement de server.js depuis GitHub...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%RAW_URL%', 'server.js')"

if not exist "server.js" (
    echo [ERREUR] Impossible de télécharger server.js depuis GitHub.
    pause
    exit /b
)

:: 2. Installation automatique des dépendances
if not exist "node_modules" (
    echo [2/4] Première installation : téléchargement d'express et cors...
    call npm init -y
    call npm install express cors
    if %errorlevel% neq 0 (
        echo [ERREUR] L'installation des paquets npm a échoué.
        pause
        exit /b
    )
    echo [OK] Dépendances installées.
) else (
    echo [2/4] Dépendances déjà présentes.
)

:: 3. Démarrage du serveur Node.js
echo [3/4] Démarrage du serveur relais Node.js...
start "Serveur Relais PS5" node server.js

timeout /t 2 /nobreak > nul

:: 4. Ouverture de la page GitHub Pages
echo [4/4] Ouverture de l'interface web...
start https://nexgen999.github.io/Evox-sender/index-lite.html

echo.
echo =========================================
echo   Prêt ! Le serveur tourne en arrière-plan.
echo =========================================