/**
 * UI System Module
 * Handles UI updates, notifications, logs, and quest UI
 */

// State object reference
let state;

// Dependencies
let getEffectiveStats, getCharacterAvatar;
let items, quests;
let screens, elements, inventoryElement, missionLogElement, combatElements;

// UI state
let currentQuestTab = "active";
let levelUpNotification = null;
let victoryMessage = null;

/**
 * Initialize the UI module with required dependencies
 */
export function initUI(deps) {
    // Store state object reference
    state = deps.state;

    // Data
    items = deps.data.items;
    quests = deps.data.quests;

    // DOM elements
    screens = deps.dom.screens;
    elements = deps.dom.elements;
    inventoryElement = deps.dom.inventoryElement;
    missionLogElement = deps.dom.missionLogElement;
    combatElements = deps.dom.combatElements;

    // Functions
    getEffectiveStats = deps.equipment.getEffectiveStats;
    getCharacterAvatar = deps.character.getCharacterAvatar;
}

/**
 * Show screen based on game state
 */
export function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove("active-screen"));
    if (screens[screenName]) {
        screens[screenName].classList.add("active-screen");
    }
}

/**
 * Add log entry with timestamp
 */
export function addLog(message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const logEntry = `[${timeStr}] ${message}`;
    state.log.push(logEntry);

    // Keep log size manageable
    if (state.log.length > 100) {
        state.log = state.log.slice(-100);
    }
}

/**
 * Update mission log display
 */
export function updateMissionLog() {
    if (!missionLogElement) return;
    missionLogElement.innerHTML = "";

    state.log.slice(-10).reverse().forEach(entry => {
        const div = document.createElement("div");
        div.className = "log-entry";
        div.textContent = entry;
        missionLogElement.appendChild(div);
    });
}

/**
 * Update combat log display
 */
export function updateCombatLog() {
    if (!combatElements.combatLog) return;
    combatElements.combatLog.innerHTML = "";
    state.log.slice(-8).forEach(entry => {
        const div = document.createElement("div");
        div.className = "log-entry";
        div.textContent = entry;
        combatElements.combatLog.appendChild(div);
    });
}

/**
 * Get status effect icon
 */
export function getStatusEffectIcon(type) {
    const icons = {
        blocking: "🛡️",
        dodging: "💨",
        defenseBoost: "🔰",
        attackBoost: "⚔️"
    };
    return icons[type] || "✨";
}

/**
 * Update UI with current character stats
 */
export function updateUI() {
    if (!state.character) return;

    // Character info
    if (elements.characterName) elements.characterName.textContent = state.character.name;
    if (elements.characterLevel) elements.characterLevel.textContent = state.character.level;
    if (elements.characterHp) elements.characterHp.textContent = state.character.hp;
    if (elements.characterMaxHp) elements.characterMaxHp.textContent = state.character.maxHp;
    if (elements.characterEnergy) elements.characterEnergy.textContent = state.character.energy;
    if (elements.characterMaxEnergy) elements.characterMaxEnergy.textContent = state.character.maxEnergy;

    const stats = getEffectiveStats();
    if (elements.characterAtk) elements.characterAtk.textContent = stats.attack;
    if (elements.characterDef) elements.characterDef.textContent = stats.defense;

    if (elements.characterXp) elements.characterXp.textContent = state.character.xp;
    const xpToNext = state.character.level * 100;
    if (elements.characterXpToNext) elements.characterXpToNext.textContent = xpToNext;

    // XP Bar
    const xpPercentage = (state.character.xp / xpToNext) * 100;
    const xpBar = document.getElementById("xpBar");
    if (xpBar) xpBar.style.width = `${xpPercentage}%`;

    // HP Bar
    const hpPercentage = (state.character.hp / state.character.maxHp) * 100;
    const hpBar = document.getElementById("hpBar");
    if (hpBar) hpBar.style.width = `${hpPercentage}%`;

    // Character Avatar
    if (elements.characterAvatar) {
        elements.characterAvatar.textContent = getCharacterAvatar(state.character.race, state.character.role);
    }

    // Race and Role
    if (elements.characterRaceRole) {
        elements.characterRaceRole.textContent = `${state.character.race} ${state.character.role}`;
    }

    // Inventory
    if (inventoryElement) {
        inventoryElement.innerHTML = "";
        const itemCounts = {};
        state.inventory.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });

        Object.entries(itemCounts).forEach(([itemName, count]) => {
            const button = document.createElement("button");
            button.className = "inventory-item";
            button.textContent = `${itemName} x${count}`;
            button.onclick = () => {
                const item = items[itemName];
                if (item && ["weapon", "armor", "accessory"].includes(item.type)) {
                    // Import equipItem dynamically
                    import('./equipment.js').then(equipModule => {
                        equipModule.equipItem(itemName);
                    });
                }
            };
            inventoryElement.appendChild(button);
        });
    }

    // Heal button state
    const healButton = document.getElementById("healButton");
    if (healButton) {
        const hasHeal = state.inventory.includes("Energy Cell") && state.character?.hp < state.character?.maxHp;
        healButton.disabled = !hasHeal;
        healButton.className = `heal-button ${hasHeal ? "" : "disabled-button"}`;
    }

    // Equipment Slots
    if (state.character.equipment) {
        const weaponEl = document.getElementById("equipWeapon");
        const armorEl = document.getElementById("equipArmor");
        const accessoryEl = document.getElementById("equipAccessory");

        if (weaponEl) weaponEl.textContent = state.character.equipment.weapon || "Empty";
        if (armorEl) armorEl.textContent = state.character.equipment.armor || "Empty";
        if (accessoryEl) accessoryEl.textContent = state.character.equipment.accessory || "Empty";
    }

    // Update logs
    updateMissionLog();
}

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
 * Toggle quest log modal
 */
export function toggleQuestLog() {
    const modal = document.getElementById("questLogModal");
    if (!modal) return;

    if (modal.classList.contains("hidden")) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
        renderQuestList();
    } else {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
}

/**
 * Switch quest tab
 */
export function switchQuestTab(tab) {
    currentQuestTab = tab;

    // Update tab styles
    const activeBtn = document.getElementById("activeQuestsTab");
    const completedBtn = document.getElementById("completedQuestsTab");

    if (tab === "active") {
        activeBtn.className = "flex-1 py-2 px-4 bg-yellow-600 text-white rounded font-bold";
        completedBtn.className = "flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded font-bold hover:bg-gray-600";
    } else {
        activeBtn.className = "flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded font-bold hover:bg-gray-600";
        completedBtn.className = "flex-1 py-2 px-4 bg-yellow-600 text-white rounded font-bold";
    }

    renderQuestList();
}

/**
 * Render quest list
 */
export function renderQuestList() {
    const list = document.getElementById("questList");
    if (!list || !state.character) return;

    list.innerHTML = "";

    const questIds = currentQuestTab === "active"
        ? Object.keys(state.character.activeQuests)
        : state.character.completedQuests;

    if (questIds.length === 0) {
        list.innerHTML = `<div class="text-gray-400 text-center italic p-4">No ${currentQuestTab} quests.</div>`;
        return;
    }

    questIds.forEach(questId => {
        const quest = quests[questId];
        if (!quest) return;

        const div = document.createElement("div");
        div.className = "bg-gray-700 p-4 rounded border border-gray-600";

        let description = quest.description;
        let targetAmount = quest.amount;
        let targetTarget = quest.target;
        let progress = 0;
        let progressText = "";

        if (currentQuestTab === "active") {
            const activeQuest = state.character.activeQuests[questId];
            progress = activeQuest.progress;

            // Handle multi-step quests
            if (quest.steps && quest.steps.length > 0) {
                const currentStepIndex = activeQuest.currentStep || 0;
                if (currentStepIndex < quest.steps.length) {
                    const step = quest.steps[currentStepIndex];
                    if (step.description) description = step.description; // Use step description if available
                    // If step doesn't have description, maybe construct one? "Step X: [Target] [Amount]"
                    // For now, let's assume main description is generic enough or step has one.

                    targetAmount = step.amount;
                    targetTarget = step.target;
                }
            }

            const percentage = Math.min(100, (progress / targetAmount) * 100);
            progressText = `
                <div class="mt-2">
                    <div class="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Progress: ${progress}/${targetAmount} ${targetTarget}s</span>
                        <span>${Math.round(percentage)}%</span>
                    </div>
                    <div class="w-full bg-gray-800 rounded-full h-2">
                        <div class="bg-yellow-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        } else {
            progressText = `<div class="mt-2 text-green-400 text-sm font-bold">✅ Completed</div>`;
        }

        div.innerHTML = `
            <h3 class="text-lg font-bold text-yellow-400">${quest.title}</h3>
            <p class="text-gray-300 text-sm mt-1">${description}</p>
            <div class="mt-2 text-xs text-gray-400">
                Rewards: ${quest.rewards.xp ? `${quest.rewards.xp} XP` : ""} ${quest.rewards.items ? `+ ${quest.rewards.items.join(", ")}` : ""}
            </div>
            ${progressText}
        `;

        list.appendChild(div);
    });
}

/**
 * Show dialog modal
 */
export function showDialog(title, text, options = []) {
    const modal = document.getElementById("dialogModal");
    if (!modal) return;

    document.getElementById("dialogTitle").textContent = title;
    document.getElementById("dialogText").textContent = text;

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
            // If the action didn't close the dialog (and it's not the default hideDialog), we might want to close it?
            // For now, let the action decide, but usually buttons close the dialog.
            // If the action is just a function, we should probably close the dialog after.
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

/**
 * Start the game
 */
export function startGame() {
    state.gameState = "characterCreation";
    showScreen("creation");
}
