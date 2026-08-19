/**
 * Module Logger : Gère l'affichage centralisé des logs dans la console HTML.
 */
function log(msg, type = 'info') {
    const consoleBox = document.getElementById('status-console');
    if (!consoleBox) return;

    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${msg}</span>`;
    
    consoleBox.appendChild(line);
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

function clearConsole() {
    const consoleBox = document.getElementById('status-console');
    if (consoleBox) consoleBox.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const btnClear = document.getElementById('btn-clear-console');
    if (btnClear) btnClear.addEventListener('click', clearConsole);
});
