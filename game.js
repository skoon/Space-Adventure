/**
 * Galactic Odyssey - Main Game File
 * Coordinates all game systems and manages game state
 */

// Import all system modules
import { initCombat, processStatusEffects, encounterEnemy, encounterBoss, updateCombatUI, playerAttack, playerBlock, playerDodge, useSpecialAbility, endPlayerTurn, enemyTurn, winCombat, triggerCompanionAbility, selectStance, dealStaggerDamage, checkPhaseTransition } from './systems/combat.js';
import { initQuests, acceptQuest, checkQuestProgress, applyQuestItem } from './systems/quests.js';
import { initEquipment, getEffectiveStats, equipItem, unequipItem } from './systems/equipment.js';
import { initCharacter, createCharacter, gainXp, getCharacterAvatar, useHealItem, restartGame } from './systems/character.js';
import { initExploration, simulateExploration, travelDeeper } from './systems/exploration.js';
import { initEvents, generateRandomEvent, handleEvent } from './systems/events.js';
import { initSaveLoad, saveGame, loadGame, exportGame, importGame, autoSave, initializeSaveSystem } from './systems/saveload.js';
import { initUI, showScreen, addLog, updateMissionLog, updateCombatLog, updateUI, getStatusEffectIcon, showLevelUpNotification, hideLevelUpNotification, showVictoryMessage, showSaveMessage, toggleQuestLog, switchQuestTab, startGame, showDialog, hideDialog, showTravelScreen, showSettingsModal, showStatsAllocationUI, closeStatsAllocationUI, allocateStat, showAchievementsUI, closeAchievementsUI, switchShipTab, switchOperationsTab, updateQuickCrewPanel, showDerelictScreen } from './systems/ui.js';
import { initInventory, openCombatItemMenu, closeCombatItemMenu, useCombatItem } from './systems/inventory.js';
import { initLocations, travelTo, getLocationDetails, getUnlockedLocations } from './systems/locations.js';
import { initShop, buyItem, sellItem, getItemPrice, getItemSellPrice, orderItem, claimAllOrders } from './systems/shop.js';
import { initCrafting, craftItem, discoverRecipe, getKnownRecipes, canCraft } from './systems/crafting.js';
import { initSettings, getDifficulty, setDifficulty } from './systems/settings.js';
import { initShip, upgradeModule } from './systems/ship.js';
import { initDerelict, startDerelictRun, exploreRoom, escapeShip, failRun } from './systems/derelict.js';
import { initSkills } from './systems/skills.js';
import { initUpgrades } from './systems/upgrades.js';
import { initAchievements } from './systems/achievements.js';
import { initCompanions } from './systems/companions.js';
import { initCybernetics } from './systems/cybernetics.js';
import { handleInstallImplant, handleUninstallImplant } from './systems/ui/cybernetics-ui.js';

import { locations } from './data/locations.js';
import { enemies, bosses } from './data/enemies.js';
import { quests } from './data/quests.js';
import { recipes } from './data/recipes.js';
import { items } from './data/items.js';

// ============================================
// GAME DATA
// ============================================

// Locations Data
// Locations Data (Moved to data/locations.js)

// Enemies data
// Enemies data (Moved to data/enemies.js)

// Quests data
// Quests data (Moved to data/quests.js)

// Crafting Recipes
// Crafting Recipes (Moved to data/recipes.js)

// Items data (Equipment)
// Items data (Equipment)
// Items data (Equipment) (Moved to data/items.js)

// ============================================
// ERROR HANDLING
// ============================================

window.onerror = function(message, source, lineno, colno, error) {
    console.error("Global Error:", message, "at", source, ":", lineno, ":", colno);
    // Try to log to UI if possible
    try {
        const errDiv = document.getElementById("errorDisplay");
        if (errDiv) {
            errDiv.style.display = "block";
            errDiv.textContent = `Error: ${message}`;
            setTimeout(() => { errDiv.style.display = "none"; }, 5000);
        }
    } catch (e) {
        // Ignore errors in error handler
    }
    return false; // Let default handler run
};

// ============================================
// DOM ELEMENTS
// ============================================

const screens = {
  start: document.getElementById("startScreen"),
  creation: document.getElementById("characterCreationScreen"),
  exploring: document.getElementById("exploringScreen"),
  combat: document.getElementById("combatScreen"),
  defeat: document.getElementById("defeatScreen"),
  derelict: document.getElementById("derelictScreen")
};

const elements = {
  characterName: document.getElementById("characterName"),
  characterLevel: document.getElementById("characterLevel"),
  characterHp: document.getElementById("playerHp"),
  characterMaxHp: document.getElementById("playerMaxHp"),
  characterAtk: document.getElementById("characterAtk"),
  characterDef: document.getElementById("characterDef"),
  characterXp: document.getElementById("playerXp"),
  characterXpToNext: document.getElementById("xpToNext"),
  characterAvatar: document.getElementById("playerAvatar"),
  characterRaceRole: document.getElementById("characterRaceRole"),
  characterCredits: document.getElementById("characterCredits") // New UI element
};

const inventoryElement = document.getElementById("inventory");
const missionLogElement = document.getElementById("missionLog");

// Combat DOM elements
const combatElements = {
  playerName: document.getElementById("combatPlayerName"),
  playerHp: document.getElementById("combatPlayerHp"),
  playerMaxHp: document.getElementById("combatPlayerMaxHp"),
  playerAtk: document.getElementById("combatPlayerAtk"),
  playerDef: document.getElementById("combatPlayerDef"),
  playerHpBar: document.getElementById("combatHpBar"),
  playerEnergy: document.getElementById("combatPlayerEnergy"),
  playerMaxEnergy: document.getElementById("combatPlayerMaxEnergy"),
  playerEnergyBar: document.getElementById("combatEnergyBar"),
  playerStatusEffects: document.getElementById("playerStatusEffects"),
  playerAvatar: document.getElementById("combatPlayerAvatar"),
  enemyName: document.getElementById("enemyName"),
  enemyHp: document.getElementById("enemyHp"),
  enemyMaxHp: document.getElementById("enemyMaxHp"),
  enemyAtk: document.getElementById("enemyAtk"),
  enemyDef: document.getElementById("enemyDef"),
  enemyHpBar: document.getElementById("enemyHpBar"),
  enemyBreakCurrent: document.getElementById("enemyBreakCurrent"),
  enemyBreakMax: document.getElementById("enemyBreakMax"),
  enemyBreakBar: document.getElementById("enemyBreakBar"),
  enemyStatusEffects: document.getElementById("enemyStatusEffects"),
  combatLog: document.getElementById("combatLog")
};

// Year in footer
document.getElementById("currentYear").textContent = new Date().getFullYear();

// ============================================
// INITIALIZE GAME
// ============================================

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);

function initializeGame() {
  console.log("initializeGame called");
  // Game State Variables
  let gameState = "start";
  let character = null;
  let enemy = null;
  let inventory = [];
  let playerStatusEffects = [];
  let enemyStatusEffects = [];
  let log = [];
  let currentLocation = "terra_prime";

  // Create state object with getters/setters
  const state = {
    get gameState() { return gameState; },
    set gameState(val) { gameState = val; },
    get character() { return character; },
    set character(val) { character = val; },
    get enemy() { return enemy; },
    set enemy(val) { enemy = val; },
    get inventory() { return inventory; },
    set inventory(val) { inventory = val; },
    get playerStatusEffects() { return playerStatusEffects; },
    set playerStatusEffects(val) { playerStatusEffects = val; },
    get enemyStatusEffects() { return enemyStatusEffects; },
    set enemyStatusEffects(val) { enemyStatusEffects = val; },
    get log() { return log; },
    set log(val) { log = val; },
    get currentLocation() { return currentLocation; },
    set currentLocation(val) { currentLocation = val; }
  };

  // Initialize all modules
  const deps = {
    state,
    data: { enemies, bosses, quests, items, locations, recipes },
    dom: { screens, elements, inventoryElement, missionLogElement, combatElements },
    locations: { getUnlockedLocations, travelTo },
    settings: { getDifficulty, setDifficulty }
  };

  // Initialize UI first (needed by other modules)
  initUI({
    ...deps,
    equipment: { getEffectiveStats: () => ({ attack: 0, defense: 0 }), equipItem }, // Placeholder stats, real function
    character: { getCharacterAvatar: () => "👤", useHealItem }, // Placeholder avatar, real function
    shop: { getItemPrice, getItemSellPrice, buyItem, sellItem, orderItem }
  });

  // Initialize Equipment
  initEquipment({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Character
  initCharacter({
    ...deps,
    ui: { addLog, updateUI, showScreen, showLevelUpNotification, hideLevelUpNotification },
    exploration: { simulateExploration: () => { } } // Placeholder
  });

  // Initialize Quests
  initQuests({
    ...deps,
    ui: { addLog, updateUI, showVictoryMessage, showSaveMessage, showDialog }
  });

  // Initialize Combat
  initCombat({
    ...deps,
    ui: { addLog, updateCombatLog, showScreen, updateUI, getStatusEffectIcon, showVictoryMessage },
    equipment: { getEffectiveStats },
    character: { getCharacterAvatar, gainXp },
    quests: { checkQuestProgress },
    exploration: { simulateExploration: () => { } } // Placeholder
  });

  // Initialize Events
  initEvents({
    ...deps,
    ui: { addLog, updateUI, showDialog, showTravelScreen },
    combat: { encounterEnemy },
    character: { gainXp },
    quests: { checkQuestProgress }
  });

  // Initialize Locations
  initLocations({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Shop
  initShop({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Exploration
  initExploration({
    ...deps,
    ui: { addLog, updateUI },
    events: { generateRandomEvent, handleEvent }
  });

  // Re-initialize Character with real simulateExploration
  initCharacter({
    ...deps,
    ui: { addLog, updateUI, showScreen, showLevelUpNotification, hideLevelUpNotification },
    exploration: { simulateExploration }
  });

  // Re-initialize Combat with real simulateExploration
  initCombat({
    ...deps,
    ui: { addLog, updateCombatLog, showScreen, updateUI, getStatusEffectIcon, showVictoryMessage },
    equipment: { getEffectiveStats },
    character: { getCharacterAvatar, gainXp },
    quests: { checkQuestProgress },
    exploration: { simulateExploration }
  });

  // Initialize Save/Load
  initSaveLoad({
    ...deps,
    ui: { addLog, showSaveMessage, showScreen, updateUI },
    combat: { updateCombatUI }
  });

  // Initialize Inventory
  initInventory({
    ...deps,
    ui: { addLog, updateCombatLog, updateUI },
    combat: { updateCombatUI, enemyTurn, dealStaggerDamage, checkPhaseTransition, winCombat }
  });

  // Re-initialize UI with all dependencies
  initUI({
    ...deps,
    equipment: { getEffectiveStats, equipItem, unequipItem },
    character: { getCharacterAvatar, useHealItem },
    quests: { applyQuestItem },
    shop: { getItemPrice, getItemSellPrice, buyItem, sellItem, orderItem }
  });

  // Initialize Crafting
  initCrafting({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Ship
  initShip({
    ...deps,
    ui: { addLog, updateUI, showDialog },
    character: { gainXp }
  });

  // Initialize Derelict
  initDerelict({
    ...deps,
    ui: { addLog, updateUI, showScreen, showDerelictScreen },
    character: { gainXp },
    quests: { checkQuestProgress },
    combat: { encounterEnemy }
  });

  // Initialize Skills
  initSkills({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Upgrades
  initUpgrades({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Achievements
  initAchievements({
    ...deps,
    ui: { addLog, updateUI, showDialog }
  });

  // Initialize Companions
  initCompanions({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Cybernetics
  initCybernetics({
    ...deps,
    ui: { addLog, updateUI }
  });

  // Initialize Settings
  initSettings();
}

// ============================================
// AUTO-SAVE HOOKS
// ============================================

// Auto-save after level up
const originalShowLevelUpNotification = showLevelUpNotification;
const wrappedShowLevelUpNotification = function (level, statIncreases) {
  originalShowLevelUpNotification(level, statIncreases);
  setTimeout(autoSave, 500);
};

// Auto-save when character is created
const originalCreateCharacter = createCharacter;
const wrappedCreateCharacter = function (event) {
  originalCreateCharacter(event);
  setTimeout(autoSave, 500);
};

// Initialize save system on page load
window.addEventListener("DOMContentLoaded", initializeSaveSystem);

// ============================================
// EXPOSE FUNCTIONS TO WINDOW FOR HTML ONCLICK HANDLERS
// ============================================

window.startGame = startGame;
window.createCharacter = wrappedCreateCharacter;
window.travelDeeper = travelDeeper;
window.useHealItem = useHealItem;
window.restartGame = restartGame;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.exportGame = exportGame;
window.importGame = importGame;
window.toggleQuestLog = toggleQuestLog;
window.acceptQuest = acceptQuest;
window.applyQuestItem = applyQuestItem;
window.unequipItem = unequipItem;
window.switchQuestTab = switchQuestTab;


// Combat functions
window.encounterBoss = encounterBoss;
window.playerAttack = playerAttack;
window.playerBlock = playerBlock;
window.playerDodge = playerDodge;
window.useSpecialAbility = useSpecialAbility;
window.endPlayerTurn = endPlayerTurn;
window.selectStance = selectStance;
window.openCombatItemMenu = openCombatItemMenu;
window.closeCombatItemMenu = closeCombatItemMenu;
window.useCombatItem = useCombatItem;
window.closeCombatItemMenu = closeCombatItemMenu;
window.useCombatItem = useCombatItem;
window.hideLevelUpNotification = hideLevelUpNotification;
window.setDifficulty = setDifficulty;
window.getDifficulty = getDifficulty;
window.showSettingsModal = showSettingsModal;
window.upgradeModule = upgradeModule;

// Derelict functions
window.exploreRoom = exploreRoom;
window.escapeShip = escapeShip;

// Stat allocation functions
window.showStatsAllocationUI = showStatsAllocationUI;
window.closeStatsAllocationUI = closeStatsAllocationUI;
window.allocateStat = allocateStat;
window.showAchievementsUI = showAchievementsUI;
window.closeAchievementsUI = closeAchievementsUI;

// Companion functions
window.triggerCompanionAbility = triggerCompanionAbility;
window.switchShipTab = switchShipTab;
window.switchOperationsTab = switchOperationsTab;
window.updateQuickCrewPanel = updateQuickCrewPanel;

// Cybernetics functions
window.installCyberneticImplant = handleInstallImplant;
window.uninstallCyberneticImplant = handleUninstallImplant;
