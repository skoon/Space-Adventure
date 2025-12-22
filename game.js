/**
 * Galactic Odyssey - Main Game File
 * Coordinates all game systems and manages game state
 */

// Import all system modules
import { initCombat, processStatusEffects, encounterEnemy, updateCombatUI, playerAttack, playerBlock, playerDodge, useSpecialAbility, enemyTurn, winCombat } from './systems/combat.js';
import { initQuests, acceptQuest, checkQuestProgress, applyQuestItem } from './systems/quests.js';
import { initEquipment, getEffectiveStats, equipItem, unequipItem } from './systems/equipment.js';
import { initCharacter, createCharacter, gainXp, getCharacterAvatar, useHealItem, restartGame } from './systems/character.js';
import { initExploration, simulateExploration, travelDeeper } from './systems/exploration.js';
import { initEvents, generateRandomEvent, handleEvent } from './systems/events.js';
import { initSaveLoad, saveGame, loadGame, exportGame, importGame, autoSave, initializeSaveSystem } from './systems/saveload.js';
import { initUI, showScreen, addLog, updateMissionLog, updateCombatLog, updateUI, getStatusEffectIcon, showLevelUpNotification, hideLevelUpNotification, showVictoryMessage, showSaveMessage, toggleQuestLog, switchQuestTab, startGame, showDialog, hideDialog, showTravelScreen } from './systems/ui.js';
import { initInventory, openCombatItemMenu, closeCombatItemMenu, useCombatItem } from './systems/inventory.js';
import { initLocations, travelTo, getLocationDetails, getUnlockedLocations } from './systems/locations.js';
import { initShop, buyItem, sellItem, getItemPrice, getItemSellPrice, orderItem, claimAllOrders } from './systems/shop.js';

// ============================================
// GAME DATA
// ============================================

// Locations Data
const locations = {
  "terra_prime": {
    id: "terra_prime",
    name: "Terra Prime",
    description: "A lush, earth-like planet with basic resources.",
    hazardLevel: 1,
    unlocked: true
  },
  "xylo_delta": {
    id: "xylo_delta",
    name: "Xylo Delta",
    description: "A desert world filled with dangerous scavengers.",
    hazardLevel: 2,
    unlocked: true
  },
  "nebula_outpost": {
    id: "nebula_outpost",
    name: "Nebula Outpost",
    description: "An abandoned space station drifting in the void.",
    hazardLevel: 3,
    unlocked: true
  }
};

// Enemies data
const enemies = [
  { name: "Xenobot", hp: 50, attack: 10, defense: 3, locations: ["terra_prime", "nebula_outpost"] },
  { name: "Plasmavore", hp: 40, attack: 12, defense: 2, locations: ["terra_prime", "xylo_delta"] },
  { name: "Nano Swarm", hp: 30, attack: 8, defense: 1, locations: ["nebula_outpost"] },
  { name: "Sand Worm", hp: 120, attack: 15, defense: 5, locations: ["xylo_delta"] },
  { name: "Void Stalker", hp: 80, attack: 18, defense: 2, locations: ["nebula_outpost"] }
];

// Quests data
const quests = {
  "quest_001": {
    id: "quest_001",
    title: "First Contact",
    description: "Defeat 3 Xenobots to secure the landing zone.",
    type: "kill",
    target: "Xenobot",
    amount: 3,
    rewards: { xp: 50, items: ["Energy Cell"] },
    isMainStory: true
  },
  "quest_002": {
    id: "quest_002",
    title: "Scrap Collector",
    description: "Collect 2 Scrap Metal pieces for repairs.",
    type: "collect",
    target: "Scrap Metal",
    amount: 2,
    rewards: { xp: 30, items: ["Nano Stimpack"] },
    isMainStory: false
  },
  "quest_003": {
    id: "quest_003",
    title: "Alien Threat",
    description: "Defeat 5 Plasmavores to protect the colony.",
    type: "kill",
    target: "Plasmavore",
    amount: 5,
    rewards: { xp: 75, items: ["Plasma Rifle"] },
    isMainStory: true
  },
  "quest_004": {
    id: "quest_004",
    title: "Lost Cargo",
    description: "Recover a lost Data Chip.",
    type: "collect",
    target: "Data Chip",
    amount: 1,
    rewards: { xp: 45, items: ["Energy Cell"] },
    isMainStory: false
  },
  "story_01": {
    id: "story_01",
    title: "The Awakening",
    description: "Investigate the strange signal.",
    type: "kill", // Initial type for display, though steps override
    target: "Xenobot",
    amount: 1,
    rewards: { xp: 100 },
    isMainStory: true,
    steps: [
      {
        type: "kill",
        target: "Xenobot",
        amount: 1,
        rewards: { xp: 20 },
        dialog: {
          title: "Target Eliminated",
          text: "You've defeated the scout. But where did it come from? You notice a strange device on its chassis."
        }
      },
      {
        type: "collect",
        target: "Scrap Metal",
        amount: 1,
        rewards: { items: ["Energy Cell"] },
        dialog: {
          title: "Repairs Needed",
          text: "This scrap will help fix the comms array. Maybe we can decode the signal."
        }
      }
    ]
  }
};

// Items data (Equipment)
const items = {
  "Energy Cell": { type: "consumable", effect: "heal", value: 30, description: "Restores 30 HP", price: 50 },
  "Nano Stimpack": { type: "consumable", effect: "heal", value: 50, description: "Restores 50 HP", price: 100 },
  "Alien Crystal": { type: "material", description: "A mysterious glowing crystal.", price: 200 },
  "Data Chip": { type: "material", description: "Contains encrypted data.", price: 150 },
  "Scrap Metal": { type: "material", description: "Useful for crafting.", price: 20 },
  "Rusty Pipe": { type: "material", description: "An old metal pipe.", price: 10 },

  // Weapons
  "Plasma Rifle": { type: "weapon", stats: { attack: 5 }, description: "A powerful energy weapon.", price: 500 },
  "Laser Blade": { type: "weapon", stats: { attack: 7 }, description: "A high-tech melee weapon.", price: 750 },
  "Photon Cannon": { type: "weapon", stats: { attack: 10 }, description: "Devastating ranged weapon.", price: 1200 },

  // Armor
  "Kevlar Vest": { type: "armor", stats: { defense: 4 }, description: "Basic protective armor.", price: 400 },
  "Titanium Plating": { type: "armor", stats: { defense: 6 }, description: "Heavy-duty armor plating.", price: 800 },
  "Exoskeleton": { type: "armor", stats: { defense: 8 }, description: "Powered armor that enhances strength.", price: 1500 },

  // Accessories
  "Shield Generator": { type: "accessory", stats: { defense: 3 }, description: "Generates a personal forcefield.", price: 600 },
  "Targeting HUD": { type: "accessory", stats: { attack: 3 }, description: "Improves accuracy and damage.", price: 600 }
};

// ============================================
// DOM ELEMENTS
// ============================================

const screens = {
  start: document.getElementById("startScreen"),
  creation: document.getElementById("characterCreationScreen"),
  exploring: document.getElementById("exploringScreen"),
  combat: document.getElementById("combatScreen"),
  defeat: document.getElementById("defeatScreen")
};

const elements = {
  characterName: document.getElementById("characterName_display"),
  characterLevel: document.getElementById("characterLevel"),
  characterHp: document.getElementById("characterHp"),
  characterMaxHp: document.getElementById("characterMaxHp"),
  characterAtk: document.getElementById("characterAtk"),
  characterDef: document.getElementById("characterDef"),
  characterXp: document.getElementById("characterXp"),
  characterXpToNext: document.getElementById("characterXpToNext"),
  characterAvatar: document.getElementById("characterAvatar"),
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
    data: { enemies, quests, items, locations },
    dom: { screens, elements, inventoryElement, missionLogElement, combatElements },
    locations: { getUnlockedLocations, travelTo }
  };

  // Initialize UI first (needed by other modules)
  initUI({
    ...deps,
    equipment: { getEffectiveStats: () => ({ attack: 0, defense: 0 }) }, // Placeholder
    character: { getCharacterAvatar: () => "👤" }, // Placeholder
    shop: { getItemPrice, getItemSellPrice, buyItem, sellItem }
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
    combat: { updateCombatUI, enemyTurn }
  });

  // Re-initialize UI with all dependencies
  initUI({
    ...deps,
    equipment: { getEffectiveStats },
    character: { getCharacterAvatar },
    quests: { applyQuestItem }
  });
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
window.playerAttack = playerAttack;
window.playerBlock = playerBlock;
window.playerDodge = playerDodge;
window.useSpecialAbility = useSpecialAbility;
window.openCombatItemMenu = openCombatItemMenu;
window.closeCombatItemMenu = closeCombatItemMenu;
window.useCombatItem = useCombatItem;
window.hideLevelUpNotification = hideLevelUpNotification;
