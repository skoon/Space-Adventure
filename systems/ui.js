/**
 * UI System Module
 * Handles UI updates, notifications, logs, and quest UI
 * Aggregates sub-modules
 */

// Import Sub-modules
import { initLogger, addLog, updateMissionLog, updateCombatLog } from './ui/logger.js';
import { initQuestUI, toggleQuestLog, switchQuestTab, renderQuestList } from './ui/quest-ui.js';
import { initTravelUI, showTravelScreen, travelToLocation } from './ui/travel-ui.js';
import { initShopUI, showShop, switchShopTab, updateShopUI } from './ui/shop-ui.js';
import { initInventoryUI, updateInventory, createInventoryItemButton } from './ui/inventory-ui.js';
import { initCraftingUI, showCraftingUI, updateCraftingUI } from './ui/crafting-ui.js';
import { initSettingsUI, showSettingsModal } from './ui/settings-ui.js';
import { 
    showLevelUpNotification, hideLevelUpNotification, 
    showVictoryMessage, showSaveMessage, 
    showDialog, hideDialog 
} from './ui/notifications.js';

// Re-export for external use
export { 
    addLog, updateMissionLog, updateCombatLog,
    toggleQuestLog, switchQuestTab, renderQuestList,
    showTravelScreen, travelToLocation,
    showShop, switchShopTab, updateShopUI,
    updateInventory, createInventoryItemButton,
    showCraftingUI, updateCraftingUI,
    showSettingsModal,
    showLevelUpNotification, hideLevelUpNotification, 
    showVictoryMessage, showSaveMessage, 
    showDialog, hideDialog
};

// State object reference
let state;
let deps; // Store dependencies globally for the module

// Render Cache
const renderCache = {
    character: {
        name: null,
        level: null,
        race: null,
        role: null,
        avatar: null
    },
    stats: {
        hp: null,
        maxHp: null,
        xp: null,
        xpToNext: null,
        credits: null,
        attack: null,
        defense: null
    },
    equipment: {
        weapon: null,
        armor: null,
        accessory: null
    },
    orders: 0
};

/**
 * Initialize the UI module with required dependencies
 */
export function initUI(dependencies) {
    // Store state object reference
    deps = dependencies;
    console.log("initUI called", deps);
    state = deps.state;

    // Reset render cache
    renderCache.character = { name: null, level: null, race: null, role: null, avatar: null };
    renderCache.stats = { hp: null, maxHp: null, xp: null, xpToNext: null, credits: null, attack: null, defense: null };
    renderCache.equipment = { weapon: null, armor: null, accessory: null };
    renderCache.orders = 0;

    // Initialize Sub-modules
    initLogger(deps, { log: { length: 0, lastEntry: null } });
    initQuestUI(deps);
    initTravelUI(deps, updateUI);
    initShopUI(deps, updateUI);
    initInventoryUI(deps, { inventory: null }, updateUI);
    initCraftingUI(deps);
    initSettingsUI(deps, showDialog);

    // Initialize Difficulty Selector (Start Screen)
    const difficultySelect = document.getElementById("difficultySelect");
    const difficultyDesc = document.getElementById("difficultyDesc");
    
    if (difficultySelect && deps.settings) {
        const currentDiff = deps.settings.getDifficulty();
        difficultySelect.value = currentDiff.id;
        if (difficultyDesc) difficultyDesc.textContent = currentDiff.description;
        
        difficultySelect.addEventListener("change", (e) => {
            const level = e.target.value;
            deps.settings.setDifficulty(level);
            
            const newDiff = deps.settings.getDifficulty();
            if (difficultyDesc) difficultyDesc.textContent = newDiff.description;
        });
    }

    // Apply initial theme
    updateTheme();
}

/**
 * Update the game theme based on current location
 */
function updateTheme() {
    document.body.classList.remove('theme-terra', 'theme-desert', 'theme-space');
    const theme = state.currentLocation && deps.data.locations[state.currentLocation]?.theme;
    if (theme) {
        document.body.classList.add(theme);
    } else {
        document.body.classList.add('theme-terra');
    }
}

/**
 * Show screen based on game state
 */
export function showScreen(screenName) {
    Object.values(deps.dom.screens).forEach(screen => {
        if (screen) screen.classList.remove("active-screen");
    });
    if (deps.dom.screens[screenName]) {
        deps.dom.screens[screenName].classList.add("active-screen");
    }
}

/**
 * Get status effect icon
 */
export function getStatusEffectIcon(type) {
    const icons = {
        blocking: "🛡️",
        dodging: "💨",
        defenseBoost: "🔰",
        attackBoost: "⚔️",
        poison: "☠️",
        burn: "🔥",
        defenseBreak: "⚠️"
    };
    return icons[type] || "✨";
}

/**
 * Update UI with current character stats
 * Optimized to only update changed elements
 */
export function updateUI() {
    if (!state.character) return;

    updateTheme();
    updateCharacterInfo();
    updateStats();
    updateBars();
    
    // Sub-module updates
    updateInventory();
    updateShopUI();
    updatePendingOrders();
    updateMissionLog();
    updateEquipment();
    updateLocationDisplay();
    
    const craftingModal = document.getElementById('craftingModal');
    if (craftingModal) {
        updateCraftingUI();
    }
    
    // Update Derelict UI if active
    if (state.gameState === "derelict" && state.derelict) {
        updateDerelictUI();
    }
}

function updateDerelictUI() {
    const oxText = document.getElementById('derelictOxygenText');
    const oxBar = document.getElementById('derelictOxygenBar');
    const roomsText = document.getElementById('derelictRoomsText');
    const lootList = document.getElementById('derelictLootList');

    if (oxText && state.derelict) {
        oxText.textContent = `${state.derelict.oxygen}/${state.derelict.maxOxygen}`;
        const pct = (state.derelict.oxygen / state.derelict.maxOxygen) * 100;
        oxBar.style.width = `${pct}%`;
        
        if (pct <= 25) {
            oxBar.classList.replace('bg-cyan-500', 'bg-red-500');
            oxText.classList.replace('text-cyan-400', 'text-red-500');
            oxText.classList.add('animate-pulse');
        } else {
            oxBar.classList.replace('bg-red-500', 'bg-cyan-500');
            oxText.classList.replace('text-red-500', 'text-cyan-400');
            oxText.classList.remove('animate-pulse');
        }
        
        roomsText.textContent = state.derelict.roomsExplored;
        
        // Render Loot
        if (lootList) {
            lootList.innerHTML = '';
            if (state.derelict.currentLoot.length === 0) {
                lootList.innerHTML = '<span class="text-gray-500 italic">No cargo secured yet.</span>';
            } else {
                state.derelict.currentLoot.forEach(item => {
                    const span = document.createElement('span');
                    span.className = 'bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-600';
                    span.textContent = item;
                    lootList.appendChild(span);
                });
            }
        }
    }
}

function updateLocationDisplay() {
    const display = document.getElementById("currentLocationDisplay");
    if (display && state.currentLocation && deps.data.locations[state.currentLocation]) {
        display.textContent = deps.data.locations[state.currentLocation].name;
    }
}

function updateCharacterInfo() {
    const char = state.character;
    const elements = deps.dom.elements;
    
    if (renderCache.character.name !== char.name) {
        if (elements.characterName) elements.characterName.textContent = char.name;
        renderCache.character.name = char.name;
    }
    
    if (renderCache.character.level !== char.level) {
        if (elements.characterLevel) elements.characterLevel.textContent = char.level;
        renderCache.character.level = char.level;
    }
    
    const getCharacterAvatar = deps.character.getCharacterAvatar;
    const avatar = getCharacterAvatar(char.race, char.role);
    if (renderCache.character.avatar !== avatar) {
        if (elements.characterAvatar) elements.characterAvatar.textContent = avatar;
        renderCache.character.avatar = avatar;
    }
    
    const raceRole = `${char.race} ${char.role}`;
    if (renderCache.character.raceRole !== raceRole) {
        if (elements.characterRaceRole) elements.characterRaceRole.textContent = raceRole;
        renderCache.character.raceRole = raceRole;
    }
    
    // Update SP
    const spEl = document.getElementById("characterSkillPoints");
    if (spEl) {
        spEl.textContent = `SP: ${char.skillPoints || 0}`;
    }
}

function updateStats() {
    const char = state.character;
    const elements = deps.dom.elements;
    const stats = deps.equipment.getEffectiveStats();
    
    // HP
    if (renderCache.stats.hp !== char.hp) {
        if (elements.characterHp) elements.characterHp.textContent = char.hp;
        renderCache.stats.hp = char.hp;
    }
    if (renderCache.stats.maxHp !== char.maxHp) {
        if (elements.characterMaxHp) elements.characterMaxHp.textContent = char.maxHp;
        renderCache.stats.maxHp = char.maxHp;
    }

    // Energy
    if (elements.characterEnergy && renderCache.stats.energy !== char.energy) {
        elements.characterEnergy.textContent = char.energy;
        renderCache.stats.energy = char.energy;
    }
    if (elements.characterMaxEnergy && renderCache.stats.maxEnergy !== char.maxEnergy) {
        elements.characterMaxEnergy.textContent = char.maxEnergy;
        renderCache.stats.maxEnergy = char.maxEnergy;
    }
    
    // XP
    if (renderCache.stats.xp !== char.xp) {
        if (elements.characterXp) elements.characterXp.textContent = char.xp;
        renderCache.stats.xp = char.xp;
    }
    
    const xpToNext = char.level * 100;
    if (renderCache.stats.xpToNext !== xpToNext) {
        if (elements.characterXpToNext) elements.characterXpToNext.textContent = xpToNext;
        renderCache.stats.xpToNext = xpToNext;
    }
    
    // Credits
    if (renderCache.stats.credits !== char.credits) {
        if (elements.characterCredits) elements.characterCredits.textContent = char.credits || 0;
        renderCache.stats.credits = char.credits;
    }
    
    // Effective Stats
    if (renderCache.stats.attack !== stats.attack) {
        if (elements.characterAtk) elements.characterAtk.textContent = stats.attack;
        renderCache.stats.attack = stats.attack;
    }
    if (renderCache.stats.defense !== stats.defense) {
        if (elements.characterDef) elements.characterDef.textContent = stats.defense;
        renderCache.stats.defense = stats.defense;
    }
}

function updateBars() {
    const char = state.character;
    const xpToNext = char.level * 100;
    
    const xpPercentage = (char.xp / xpToNext) * 100;
    const xpBar = document.getElementById("xpBar");
    if (xpBar) xpBar.style.width = `${xpPercentage}%`;

    const hpPercentage = (char.hp / char.maxHp) * 100;
    const hpBar = document.getElementById("hpBar");
    if (hpBar) hpBar.style.width = `${hpPercentage}%`;
}

function updateEquipment() {
    if (!state.character || !state.character.equipment) return;
    
    const equip = state.character.equipment;
    
    if (renderCache.equipment.weapon !== equip.weapon) {
        const weaponEl = document.getElementById("equipWeapon");
        if (weaponEl) weaponEl.textContent = equip.weapon || "Empty";
        renderCache.equipment.weapon = equip.weapon;
    }
    
    if (renderCache.equipment.armor !== equip.armor) {
        const armorEl = document.getElementById("equipArmor");
        if (armorEl) armorEl.textContent = equip.armor || "Empty";
        renderCache.equipment.armor = equip.armor;
    }
    
    if (renderCache.equipment.accessory !== equip.accessory) {
        const accessoryEl = document.getElementById("equipAccessory");
        if (accessoryEl) accessoryEl.textContent = equip.accessory || "Empty";
        renderCache.equipment.accessory = equip.accessory;
    }
}

function updatePendingOrders() {
    if (!state.character) return; // Guard clause
    const pendingCount = state.character.pendingOrders?.length || 0;
    if (renderCache.orders !== pendingCount) {
        const pendingOrdersEl = document.getElementById("characterPendingOrders");
        if (pendingOrdersEl) {
            pendingOrdersEl.textContent = pendingCount;
        }
        renderCache.orders = pendingCount;
    }
}

/**
 * Start the game
 */
export function startGame() {
    if (!state) {
        console.error("State is undefined in startGame!");
        return;
    }
    state.gameState = "characterCreation";
    showScreen("creation");
}

/**
 * Show the Skills Modal
 */
export function showSkillsUI() {
    const modal = document.getElementById('skillsModal');
    if (modal) {
        renderSkillTree();
        modal.classList.remove('hidden');
    }
}

/**
 * Close the Skills Modal
 */
export function closeSkillsUI() {
    const modal = document.getElementById('skillsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Render the Skill Tree
 */
export async function renderSkillTree() {
    if (!state.character) return;
    
    // Dynamically import skills module to prevent circular dependencies
    const skillsModule = await import('./skills.js');
    const SKILL_TREES = skillsModule.SKILL_TREES;
    const hasSkill = skillsModule.hasSkill;
    const unlockSkill = skillsModule.unlockSkill;
    
    const role = state.character.role;
    const tree = SKILL_TREES[role];
    
    const container = document.getElementById('skillTreeContainer');
    const spDisplay = document.getElementById('skillsSpDisplay');
    const roleDesc = document.getElementById('skillsRoleDesc');
    
    if (!container || !tree) return;
    
    spDisplay.textContent = state.character.skillPoints || 0;
    if (roleDesc) roleDesc.textContent = `${role} Talents`;
    
    container.innerHTML = '';
    
    tree.forEach(skill => {
        const isUnlocked = hasSkill(skill.id);
        const canUnlock = !isUnlocked && (!skill.requires || hasSkill(skill.requires));
        const lackSp = state.character.skillPoints < skill.cost;
        
        let statusClass = "border-gray-600 bg-gray-800 opacity-50";
        if (isUnlocked) statusClass = "border-green-500 bg-green-900/40";
        else if (canUnlock && !lackSp) statusClass = "border-yellow-500 bg-yellow-900/40 cursor-pointer hover:bg-yellow-800/60";
        else if (canUnlock && lackSp) statusClass = "border-red-500 bg-red-900/20";
        
        const node = document.createElement('div');
        node.className = `p-4 border-2 rounded-lg transition-all flex items-start gap-4 ${statusClass}`;
        
        node.innerHTML = `
            <div class="text-4xl">${skill.icon}</div>
            <div class="flex-grow">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-bold ${isUnlocked ? 'text-green-400' : 'text-blue-300'}">${skill.name}</h3>
                    <span class="text-sm font-bold ${isUnlocked ? 'text-green-400' : 'text-yellow-400'}">${isUnlocked ? 'UNLOCKED' : `Cost: ${skill.cost} SP`}</span>
                </div>
                <p class="text-sm text-gray-300 mt-1">${skill.description}</p>
                ${skill.requires && !hasSkill(skill.requires) ? `<p class="text-xs text-red-400 mt-1">Requires previous tier skill.</p>` : ''}
            </div>
        `;
        
        if (canUnlock && !lackSp) {
            node.onclick = () => {
                const res = unlockSkill(skill.id);
                if (res.success) {
                    renderSkillTree();
                    updateUI();
                } else {
                    addLog(res.message);
                }
            };
        }
        
        container.appendChild(node);
    });
}

/**
 * Show Ship Hub UI
 */
export function showShipUI() {
    const modal = document.getElementById('shipHubModal');
    if (modal) {
        renderShipModules();
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

/**
 * Close Ship Hub UI
 */
export function closeShipUI() {
    const modal = document.getElementById('shipHubModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

/**
 * Render Ship Modules
 */
export async function renderShipModules() {
    if (!state.character || !state.character.ship) return;
    
    const shipModule = await import('./ship.js');
    const modules = shipModule.shipModules;
    const getUpgradeCost = shipModule.getUpgradeCost;
    const canAffordUpgrade = shipModule.canAffordUpgrade;
    
    const container = document.getElementById('shipModulesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(modules).forEach(mod => {
        const currentLevel = state.character.ship[mod.id + 'Level'];
        const isMaxLevel = currentLevel >= mod.maxLevel;
        const cost = getUpgradeCost(mod.id, currentLevel);
        const canAfford = cost ? canAffordUpgrade(cost) : false;
        
        let costHtml = '';
        if (!isMaxLevel && cost) {
            costHtml = `<div class="text-xs mt-2 text-yellow-400">Upgrade Cost: ${cost.credits} Credits`;
            if (Object.keys(cost.materials).length > 0) {
                costHtml += `, ${Object.entries(cost.materials).map(([k, v]) => `${v}x ${k}`).join(', ')}`;
            }
            costHtml += `</div>`;
        }
        
        const node = document.createElement('div');
        node.className = `p-4 border border-cyan-800 rounded bg-slate-900/50 mb-2`;
        
        let buttonHtml = '';
        if (isMaxLevel) {
            buttonHtml = `<button class="px-4 py-1 bg-gray-600 text-gray-300 rounded cursor-not-allowed text-xs font-bold" disabled>MAX LEVEL</button>`;
        } else {
            const btnClass = canAfford 
                ? "bg-cyan-600 hover:bg-cyan-500 text-white" 
                : "bg-gray-600 text-gray-400 cursor-not-allowed";
            buttonHtml = `<button class="px-4 py-1 rounded text-xs font-bold transition-colors ${btnClass}" ${!canAfford ? 'disabled' : ''}>UPGRADE</button>`;
        }
        
        node.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-cyan-300 text-lg">${mod.name} <span class="text-sm text-cyan-600">LVL ${currentLevel}</span></h3>
                    <p class="text-gray-400 mt-1">${mod.descriptions[currentLevel] || mod.descriptions[mod.descriptions.length - 1]}</p>
                    ${costHtml}
                </div>
                <div>
                    ${buttonHtml}
                </div>
            </div>
        `;
        
        if (!isMaxLevel && canAfford) {
            const btn = node.querySelector('button');
            btn.onclick = () => {
                if (shipModule.upgradeModule(mod.id)) {
                    renderShipModules();
                }
            };
        }
        
        container.appendChild(node);
    });
}

/**
 * Play Travel Animation
 */
export function playTravelAnimation(callback) {
    const overlay = document.getElementById('travelAnimationOverlay');
    if (!overlay) {
        if (callback) callback();
        return;
    }
    
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    
    // Play for 2 seconds
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        if (callback) callback();
    }, 2000);
}

/**
 * Show Derelict Screen
 */
export function showDerelictScreen() {
    showScreen("derelict");
    updateDerelictUI();
}
