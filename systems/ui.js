/**
 * UI System Module
 * Handles UI updates, notifications, logs, and quest UI
 */

// State object reference
let state;

// Dependencies
let getEffectiveStats, getCharacterAvatar, applyQuestItem;
let getUnlockedLocations, travelTo;
let buyItem, sellItem, getItemPrice, getItemSellPrice, orderItem;
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
    console.log("initUI called", deps);
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
    if (deps.quests && deps.quests.applyQuestItem) {
        applyQuestItem = deps.quests.applyQuestItem;
    }

    // Location functions (optional check if not available yet)
    if (deps.locations) {
        getUnlockedLocations = deps.locations.getUnlockedLocations;
        travelTo = deps.locations.travelTo;
    }

    // Shop functions
    if (deps.shop) {
        buyItem = deps.shop.buyItem;
        sellItem = deps.shop.sellItem;
        getItemPrice = deps.shop.getItemPrice;
        getItemSellPrice = deps.shop.getItemSellPrice;
        orderItem = deps.shop.orderItem;
    }
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

    if (elements.characterCredits) {
        elements.characterCredits.textContent = state.character.credits || 0;
    }

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
        
        // Count items
        const itemCounts = {};
        state.inventory.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
        
        // Group by category
        const categorized = {
            equipment: [],
            consumable: [],
            material: [],
            other: []
        };
        
        Object.entries(itemCounts).forEach(([itemName, count]) => {
            const item = items[itemName];
            const category = item?.category || 'other';
            if (categorized[category]) {
                categorized[category].push({ name: itemName, count, item });
            } else {
                categorized['other'].push({ name: itemName, count, item });
            }
        });
        
        // Render by category
        ['equipment', 'consumable', 'material', 'other'].forEach(cat => {
            if (categorized[cat].length > 0) {
                const header = document.createElement('div');
                header.className = 'text-xs font-bold text-gray-400 mt-2 mb-1 uppercase tracking-wider';
                header.textContent = cat;
                inventoryElement.appendChild(header);
                
                categorized[cat].forEach(({ name, count, item }) => {
                    const button = createInventoryItemButton(name, count, item);
                    inventoryElement.appendChild(button);
                });
            }
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

    // Update pending orders count
    const pendingOrdersEl = document.getElementById("characterPendingOrders");
    if (pendingOrdersEl && state.character) {
        pendingOrdersEl.textContent = state.character.pendingOrders?.length || 0;
    }
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

    if (modal.style.display === "none" || modal.classList.contains("hidden")) {
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
 * Show travel screen with available destinations
 */
export function showTravelScreen() {
    const modal = document.getElementById("travelScreen");
    const container = document.getElementById("travelDestinations");

    if (!modal || !container || !getUnlockedLocations) return;

    container.innerHTML = "";
    const locations = getUnlockedLocations();

    locations.forEach(loc => {
        const isCurrent = state.currentLocation === loc.id;
        const card = document.createElement("div");
        card.className = `p-4 rounded border transition-all ${isCurrent ? 'bg-blue-900 border-blue-400' : 'bg-gray-700 border-gray-600 hover:border-white cursor-pointer'}`;

        card.innerHTML = `
            <div class="text-xl font-bold mb-2 ${isCurrent ? 'text-blue-300' : 'text-gray-200'}">${loc.name}</div>
            <div class="text-sm text-gray-400 mb-3 h-12">${loc.description}</div>
            <div class="flex justify-between items-center text-xs">
                <span class="text-yellow-500">Hazard Lv.${loc.hazardLevel}</span>
                ${isCurrent ? '<span class="text-blue-400 font-bold">CURRENT</span>' : ''}
            </div>
        `;

        if (!isCurrent) {
            card.onclick = () => {
                if (travelTo(loc.id)) {
                    modal.classList.add("hidden");
                }
            };
        }

        container.appendChild(card);
    });

    modal.classList.remove("hidden");
}

let currentShopTab = 'buy';

/**
 * Show Shop Modal
 */
export function showShop() {
    const modal = document.getElementById("shopScreen");
    if (modal) {
        modal.classList.remove("hidden");
        updateShopUI();
    }
}

/**
 * Switch Shop Tab
 */
window.switchShopTab = function (tab) {
    currentShopTab = tab;
    const buyTab = document.getElementById("shopTabBuy");
    const sellTab = document.getElementById("shopTabSell");
    const buyContainer = document.getElementById("shopBuyContainer");
    const sellContainer = document.getElementById("shopSellContainer");

    if (tab === 'buy') {
        buyTab.className = "px-6 py-2 text-yellow-500 border-b-2 border-yellow-500 font-bold bg-gray-700 rounded-t";
        sellTab.className = "px-6 py-2 text-gray-400 font-bold hover:text-white";
        buyContainer.classList.remove("hidden");
        sellContainer.classList.add("hidden");
    } else {
        sellTab.className = "px-6 py-2 text-yellow-500 border-b-2 border-yellow-500 font-bold bg-gray-700 rounded-t";
        buyTab.className = "px-6 py-2 text-gray-400 font-bold hover:text-white";
        sellContainer.classList.remove("hidden");
        buyContainer.classList.add("hidden");
    }
    updateShopUI();
};

/**
 * Update Shop UI content
 */
function updateShopUI() {
    // Update Credits Display
    const creditsDisplay = document.getElementById("shopCreditsDisplay");
    if (creditsDisplay && state.character) {
        creditsDisplay.textContent = state.character.credits;
    }

    // Buy Container
    const buyContainer = document.getElementById("shopBuyContainer");
    if (buyContainer) {
        buyContainer.innerHTML = "";
        // List specific items for sale
        const itemsForSale = [
            "Energy Cell", "Nano Stimpack",
            "Kevlar Vest", "Titanium Plating",
            "Plasma Rifle", "Laser Blade", "Shield Generator", "Targeting HUD"
        ];

        itemsForSale.forEach(itemName => {
            const item = items[itemName];
            if (!item) return;

            const price = getItemPrice(itemName);
            const canAfford = state.character.credits >= price;

            const card = document.createElement("div");
            card.className = "bg-gray-700 p-3 rounded flex justify-between items-center";
            card.innerHTML = `
                <div>
                    <div class="font-bold text-gray-200">${itemName}</div>
                    <div class="text-xs text-gray-400">${item.description}</div>
                    <div class="text-yellow-500 font-mono mt-1">${price} cr</div>
                </div>
                <button class="px-3 py-1 rounded text-sm font-bold ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
                    onclick="orderItemFromShop('${itemName}')" ${!canAfford ? 'disabled' : ''}>Order Now</button>
            `;
            buyContainer.appendChild(card);
        });
    }

    // Sell Container
    const sellContainer = document.getElementById("shopSellContainer");
    if (sellContainer && state.inventory) {
        sellContainer.innerHTML = "";

        if (state.inventory.length === 0) {
            sellContainer.innerHTML = "<div class='text-gray-500 italic col-span-2 text-center p-4'>Your inventory is empty.</div>";
        } else {
            // Count items
            const counts = {};
            state.inventory.forEach(i => counts[i] = (counts[i] || 0) + 1);

            Object.keys(counts).forEach(itemName => {
                const item = items[itemName];
                const count = counts[itemName];
                const price = getItemSellPrice(itemName);

                const card = document.createElement("div");
                card.className = "bg-gray-700 p-3 rounded flex justify-between items-center";
                card.innerHTML = `
                    <div>
                        <div class="font-bold text-gray-200">${itemName} x${count}</div>
                        <div class="text-xs text-gray-400">${item ? item.description : ''}</div>
                        <div class="text-green-500 font-mono mt-1">Sell: ${price} cr</div>
                    </div>
                    <button class="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm font-bold"
                        onclick="sellItemToShop('${itemName}')">Sell</button>
                `;
                sellContainer.appendChild(card);
            });
        }
    }
}

// Global scope helpers for HTML onclick events
window.buyItemFromShop = function (itemName) {
    if (buyItem(itemName)) {
        updateShopUI();
        updateUI(); // Update main UI
    }
};

window.orderItemFromShop = function (itemName) {
    if (orderItem(itemName)) {
        updateShopUI();
        updateUI(); // Update main UI
    }
};

/**
 * Create inventory item button with tooltip
 */
export function createInventoryItemButton(itemName, count, item) {
    const button = document.createElement("button");
    button.className = "inventory-item relative group w-full text-left bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded p-2 mb-1 flex justify-between items-center";
    
    // Display name with count
    const nameSpan = document.createElement('span');
    nameSpan.className = "text-sm text-gray-200";
    nameSpan.textContent = itemName;
    button.appendChild(nameSpan);
    
    if (count > 1) {
        const countBadge = document.createElement('span');
        countBadge.className = 'text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full';
        countBadge.textContent = `×${count}`;
        button.appendChild(countBadge);
    }
    
    // Tooltip Container (Hidden by default)
    const tooltip = document.createElement('div');
    tooltip.className = 'hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-500 rounded shadow-xl z-50 w-48 text-left pointer-events-none';
    
    // Desktop Hover
    button.addEventListener('mouseenter', () => {
        // Only show if not on touch device (can't easily detect here without complex checks, so we rely on CSS/hybrid)
        // For hybrid Option C logic:
        if (window.matchMedia('(hover: hover)').matches) {
            tooltip.classList.remove('hidden');
        }
    });
    button.addEventListener('mouseleave', () => {
        if (window.matchMedia('(hover: hover)').matches) {
            tooltip.classList.add('hidden');
        }
    });

    // Mobile Toggle
    button.addEventListener('click', (e) => {
        // Prevent action if just toggling tooltip on touch?
        // Actually the requirement: "Tap to toggle on mobile/touch"
        // But clicking also Uses/Equips the item.
        // Let's assume a long press or separate info icon for mobile would be better but "Tap to toggle" implies click.
        // If we tap, we toggle tooltip. If we tap again, we verify? Or maybe a separate "Use" button in tooltip?
        // Implementation Plan said: "Tap to toggle".
        // Let's implement: Click toggles tooltip on Touch. Double click uses?
        // Or simpler: Click always uses. Tooltip is informational via hover on desktop. 
        // On mobile, maybe we can't easily see stats without a dedicated inspect.
        // Let's stick to: Click = Action. Tooltip = Hover (Desktop). 
        // For Mobile, we might need a "details" view later. 
        // But for now, I'll follow the "Hover on desktop" part. 
        // The approved option was hybrid: "Tap to toggle on mobile".
        // To implement that without blocking usage, maybe tapping shows tooltip for 2 seconds?
        // Conflict: Tap is also "Use".
        // I will implement: Click executes native action (Use/Equip). 
        // Tooltip is purely decorative/informative on hover for now to avoid breaking gameplay flow.
    });
    
    let tooltipHtml = `<div class="font-bold text-yellow-400 text-sm border-b border-gray-700 pb-1 mb-1">${itemName}</div>`;
    tooltipHtml += `<div class="text-xs text-gray-400 mb-1 italic">${item?.type || 'Item'}</div>`;
    tooltipHtml += `<div class="text-xs text-gray-300">${item?.description || 'No description'}</div>`;
    
    if (item?.stats) {
        tooltipHtml += '<div class="text-xs text-green-400 mt-1 flex flex-col gap-0.5">';
        if (item.stats.attack) tooltipHtml += `<span>⚔️ ATK +${item.stats.attack}</span>`;
        if (item.stats.defense) tooltipHtml += `<span>🛡️ DEF +${item.stats.defense}</span>`;
        tooltipHtml += '</div>';
    }
    
    if (item?.effect && item?.value) {
        tooltipHtml += `<div class="text-xs text-blue-400 mt-1">❤️ Restores ${item.value} HP</div>`;
    }
    
    if (item?.price) {
        tooltipHtml += `<div class="text-xs text-yellow-600 mt-2 text-right">Value: ${Math.floor(item.price/2)} cr</div>`;
    }
    
    tooltip.innerHTML = tooltipHtml;
    button.appendChild(tooltip);
    
    // Click handler for using items
    button.onclick = (e) => {
        // If mobile (touch), toggle tooltip instead of using?
        // Let's check for touch capability sort of
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        // If touch and tooltip hidden, show it and return (don't use yet)
        if (isTouch && tooltip.classList.contains('hidden')) {
            // Hide all other tooltips first
            document.querySelectorAll('.inventory-item > div:not(.hidden)').forEach(el => el.classList.add('hidden'));
            tooltip.classList.remove('hidden');
            e.stopPropagation();
            return;
        }
        
        // If already shown or not touch, proceed to action
        if (isTouch) tooltip.classList.add('hidden');

        if (item && ["weapon", "armor", "accessory"].includes(item.type)) {
            import('./equipment.js').then(equipModule => {
                equipModule.equipItem(itemName);
            });
        } else if (applyQuestItem) {
            const applied = applyQuestItem(itemName);
            if (!applied) {
                // If consumable, maybe just use it?
                // `applyQuestItem` checks quests. If it returns false, it wasn't a quest item use.
                // But we also have generic `useCombatItem` (via inventory.js) or `useHealItem` (via character.js)
                // The original code only checked generic item type or applyQuestItem.
                // Revert to original behavior:
                if (item?.effect === 'heal') {
                     import('./character.js').then(charModule => {
                        charModule.useHealItem(itemName);
                     });
                } else {
                    addLog(`Cannot use ${itemName} right now.`);
                }
            } else {
                updateUI();
            }
        }
    };
    
    return button;
}

/**
 * Show crafting screen
 */
export function showCraftingUI() {
    // Remove existing if any
    const existing = document.getElementById('craftingModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'craftingModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-purple-500 rounded-lg max-w-4xl w-full p-6 relative shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <button onclick="document.getElementById('craftingModal').remove()" 
                    class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold">&times;</button>
            
            <h2 class="text-3xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                <span>🔨</span> Crafting Station
            </h2>
            <div id="recipeList" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    updateCraftingUI();
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function updateCraftingUI() {
    const list = document.getElementById('recipeList');
    if (!list) return;
    
    list.innerHTML = '';
    
    const knownRecipes = state.character.knownRecipes || {};
    
    if (Object.keys(knownRecipes).length === 0) {
        list.innerHTML = '<div class="col-span-2 text-center text-gray-500 italic p-8">No recipes known yet. Explore the galaxy to discover crafting schematics!</div>';
        return;
    }
    
    // We need to check craftability. Since we are in UI, we can read inventory directly.
    Object.entries(knownRecipes).forEach(([id, recipe]) => {
        // Check materials
        let canCraft = true;
        const currentMaterials = {};
        state.inventory.forEach(i => currentMaterials[i] = (currentMaterials[i] || 0) + 1);
        
        let reqHtml = '';
        Object.entries(recipe.requires).forEach(([mat, amt]) => {
            const have = currentMaterials[mat] || 0;
            if (have < amt) canCraft = false;
            
            reqHtml += `<div class="flex justify-between text-xs mb-1">
                <span class="text-gray-300">${mat}</span>
                <span class="${have >= amt ? 'text-green-400' : 'text-red-400'} font-mono">${have}/${amt}</span>
            </div>`;
        });
        
        const card = document.createElement('div');
        card.className = `bg-gray-700 p-4 rounded border-l-4 ${canCraft ? 'border-green-500' : 'border-gray-600 opacity-75'}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="font-bold text-yellow-400 text-lg">${recipe.name}</div>
                ${canCraft ? '<span class="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Ready</span>' : ''}
            </div>
            <div class="text-sm text-gray-400 mb-3 italic">${recipe.description}</div>
            
            <div class="bg-gray-800 p-3 rounded mb-3">
                <div class="text-xs font-bold text-gray-500 uppercase mb-2">Required Materials</div>
                ${reqHtml}
            </div>
            
            <button onclick="craftItemFromUI('${id}')" 
                    class="w-full py-2 px-4 rounded font-bold transition-colors ${canCraft ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
                    ${!canCraft ? 'disabled' : ''}>
                ${canCraft ? 'Combine Materials' : 'Missing Materials'}
            </button>
        `;
        list.appendChild(card);
    });
}

window.craftItemFromUI = function(recipeId) {
    import('./crafting.js').then(m => {
        if (m.craftItem(recipeId)) {
            updateCraftingUI(); // Refresh list to update material counts
        }
    });
};

/**
 * Start the game
 */
export function startGame() {
    console.log("startGame called");
    if (!state) {
        console.error("State is undefined in startGame!");
        return;
    }
    state.gameState = "characterCreation";
    showScreen("creation");
}
