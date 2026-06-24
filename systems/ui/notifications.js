/**
 * Notifications UI Module
 * Handles dialogs, alerts, and notifications
 */

import { showDialogue, hideDialogue } from './dialogue-ui.js';

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
        document.getElementById("levelUpHp").textContent = `+${statIncreases.maxHp || 5} Max HP & Energy`;
        document.getElementById("levelUpAttack").textContent = `+${statIncreases.statPoints || 5} Attribute Points`;
        document.getElementById("levelUpDefense").textContent = `+1 Skill Point`;

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

let dialogQueue = [];
let isDialogOpen = false;

/**
 * Helper to process the next dialog in queue
 */
function processDialogQueue() {
    if (isDialogOpen || dialogQueue.length === 0) return;

    // Grab the first queued item
    const { title, text, options } = dialogQueue.shift();
    isDialogOpen = true;

    const modal = document.getElementById("dialogModal");
    if (!modal) {
        isDialogOpen = false;
        return;
    }

    document.getElementById("dialogTitle").textContent = title;
    document.getElementById("dialogText").innerHTML = text;

    const optionsContainer = document.getElementById("dialogOptions");
    optionsContainer.innerHTML = "";

    let currentOptions = options;
    if (!currentOptions || currentOptions.length === 0) {
        // Default "Continue" option
        currentOptions = [{ text: "Continue", action: hideDialog }];
    }

    currentOptions.forEach(option => {
        const button = document.createElement("button");
        button.textContent = option.text;
        
        if (option.disabled) {
            button.className = "px-6 py-2 bg-gray-800 border border-gray-700 rounded font-bold text-gray-500 cursor-not-allowed opacity-50";
            button.disabled = true;
        } else {
            button.className = "px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold text-white transition-colors";
            button.onclick = () => {
                if (option.action) option.action();
                if (option.action !== hideDialog) hideDialog();
            };
        }
        optionsContainer.appendChild(button);
    });

    modal.style.display = "flex";
}

/**
 * Show dialog modal (Queues the request)
 */
export function showDialog(title, text, options = []) {
    const combined = `${title} ${text}`.toLowerCase();
    const isNarrative = options.length > 0 || 
                       combined.includes("vance") || 
                       combined.includes("nesta") || 
                       combined.includes("thorne") || 
                       combined.includes("elyse") || 
                       combined.includes("mainframe") || 
                       combined.includes("terminal") || 
                       combined.includes("signal") || 
                       combined.includes("s.a.m.") || 
                       combined.includes("ai");

    if (isNarrative) {
        const finalOptions = options.map(opt => {
            return {
                ...opt,
                action: () => {
                    if (opt.action) opt.action();
                    // If the action is hideDialog, map it to hideDialogue
                    if (opt.action === hideDialog) {
                        hideDialogue();
                    } else {
                        hideDialogue();
                    }
                }
            };
        });
        
        const finalOpts = finalOptions.length > 0 ? finalOptions : [{ text: "Continue", action: hideDialogue }];
        showDialogue(title, text, finalOpts);
        return;
    }

    dialogQueue.push({ title, text, options });
    processDialogQueue();
}

/**
 * Hide dialog modal and queue next
 */
export function hideDialog() {
    const modal = document.getElementById("dialogModal");
    if (modal) {
        modal.style.display = "none";
    }
    isDialogOpen = false;

    // Process next item in queue, slight delay for visual transition
    setTimeout(processDialogQueue, 100);
}
