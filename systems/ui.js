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
    Object.values(deps.dom.screens).forEach(screen => screen.classList.remove("active-screen"));
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
        attackBoost: "⚔️"
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
