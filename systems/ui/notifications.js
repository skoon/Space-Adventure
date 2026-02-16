/**
 * Notifications UI Module
 * Handles dialogs, alerts, and notifications
 */

let levelUpNotification = null;
let victoryMessage = null;

/**
 * Show level up notification
 */
export function showLevelUpNotification(level, statIncreases) {
    levelUpNotification = { level, statIncreases };
    const notification = document.getElementById("levelUpNotification");
    if (notification) {
        notification.style.display = "flex";
        document.getElementById("levelUpLevel").textContent = level;
        document.getElementById("levelUpHp").textContent = `+${statIncreases.maxHp} Max HP`;
        document.getElementById("levelUpAttack").textContent = `+${statIncreases.attack} Attack`;
        document.getElementById("levelUpDefense").textContent = `+${statIncreases.defense} Defense`;

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            hideLevelUpNotification();
        }, 5000);
    }
}

/**
 * Hide level up notification
 */
export function hideLevelUpNotification() {
    const notification = document.getElementById("levelUpNotification");
    if (notification) {
        notification.style.display = "none";
    }
    levelUpNotification = null;
}

/**
 * Show victory message
 */
export function showVictoryMessage(message) {
    victoryMessage = message;
    const victoryEl = document.getElementById("victoryMessage");
    if (victoryEl) {
        victoryEl.innerHTML = `<span class="text-2xl">✨</span> <span>${message}</span>`;
        victoryEl.style.display = "flex";
        victoryEl.style.alignItems = "center";
        victoryEl.style.gap = "0.5rem";
        setTimeout(() => {
            victoryEl.style.display = "none";
            victoryMessage = null;
        }, 2000);
    }
}

/**
 * Show save message notification
 */
export function showSaveMessage(message) {
    const saveMsg = document.getElementById("saveMessage");
    if (saveMsg) {
        saveMsg.textContent = message;
        saveMsg.style.display = "block";
        setTimeout(() => {
            saveMsg.style.display = "none";
        }, 2000);
    }
}

/**
 * Show dialog modal
 */
export function showDialog(title, text, options = []) {
    const modal = document.getElementById("dialogModal");
    if (!modal) return;

    document.getElementById("dialogTitle").textContent = title;
    document.getElementById("dialogText").innerHTML = text;

    const optionsContainer = document.getElementById("dialogOptions");
    optionsContainer.innerHTML = "";

    if (options.length === 0) {
        // Default "Continue" option
        options = [{ text: "Continue", action: hideDialog }];
    }

    options.forEach(option => {
        const button = document.createElement("button");
        button.className = "px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold text-white transition-colors";
        button.textContent = option.text;
        button.onclick = () => {
            if (option.action) option.action();
            if (option.action !== hideDialog) hideDialog();
        };
        optionsContainer.appendChild(button);
    });

    modal.style.display = "flex";
}

/**
 * Hide dialog modal
 */
export function hideDialog() {
    const modal = document.getElementById("dialogModal");
    if (modal) {
        modal.style.display = "none";
    }
}
