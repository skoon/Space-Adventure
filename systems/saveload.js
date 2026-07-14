/**
 * Save/Load System Module
 * Handles game persistence, save/load, import/export with slot support
 */

import { restoreSavedRarityItems } from './rarity.js';
import { restoreSavedUpgradedItems } from './upgrades.js';

// State object reference
let state;

// Dependencies
let addLog, showSaveMessage, showScreen, updateUI, updateCombatUI;

// Constants
const SAVE_VERSION = "1.0";
const STORAGE_KEY = "galacticOdyssey_save";

/**
 * Initialize the save/load module with required dependencies
 */
export function initSaveLoad(deps) {
    // Store state object reference
    state = deps.state;

    // Functions
    addLog = deps.ui.addLog;
    showSaveMessage = deps.ui.showSaveMessage;
    showScreen = deps.ui.showScreen;
    updateUI = deps.ui.updateUI;
    updateCombatUI = deps.combat.updateCombatUI;
}

/**
 * Get the localStorage key for a specific slot
 */
export function getStorageKey(slot) {
    const s = slot !== undefined ? slot : (state?.activeSaveSlot || 1);
    if (Number(s) === 1) return STORAGE_KEY;
    return `${STORAGE_KEY}_slot_${s}`;
}

/**
 * Get current game state as serializable object
 */
function getGameState() {
    return {
        version: SAVE_VERSION,
        timestamp: new Date().toISOString(),
        gameState: state.gameState,
        character: state.character,
        inventory: state.inventory,
        enemy: state.enemy,
        log: state.log,
        playerStatusEffects: state.playerStatusEffects,
        enemyStatusEffects: state.enemyStatusEffects,
        achievements: state.achievements || [],
        stats: state.stats || {},
        companions: state.companions || {},
        activeCompanion: state.activeCompanion || null,
        companionCooldown: state.companionCooldown || 0,
        currentLocation: state.currentLocation || "terra_prime", // Fix missing location bug
        activeCrewDirective: state.activeCrewDirective || null,
        worldFlags: state.worldFlags || {}
    };
}

/**
 * Save game to localStorage
 */
export function saveGame(slot) {
    if (!state.character) {
        alert("No game to save! Please create a character first.");
        return false;
    }

    if (slot !== undefined) {
        state.activeSaveSlot = slot;
    }
    const targetSlot = state.activeSaveSlot || 1;

    try {
        const saveData = getGameState();
        localStorage.setItem(getStorageKey(targetSlot), JSON.stringify(saveData));
        if (Number(targetSlot) === 1) {
            addLog("💾 Game saved successfully!");
            showSaveMessage("Game Saved!");
        } else {
            addLog(`💾 Game saved successfully to Slot ${targetSlot}!`);
            showSaveMessage(`Game Saved (Slot ${targetSlot})`);
        }
        return true;
    } catch (error) {
        console.error("Error saving game:", error);
        alert("Failed to save game. Please try again.");
        return false;
    }
}

/**
 * Load game from localStorage
 */
export function loadGame(slot) {
    if (slot !== undefined) {
        state.activeSaveSlot = slot;
    }
    const targetSlot = state.activeSaveSlot || 1;

    try {
        const saveDataStr = localStorage.getItem(getStorageKey(targetSlot));
        if (!saveDataStr) {
            alert(`No saved game found in Slot ${targetSlot}!`);
            return false;
        }

        const saveData = JSON.parse(saveDataStr);

        // Validate save data
        if (!saveData.character) {
            alert("Invalid save file!");
            return false;
        }

        // Restore game state
        state.gameState = saveData.gameState || "exploring";
        state.character = saveData.character;
        state.inventory = saveData.inventory || [];
        state.enemy = saveData.enemy || null;
        state.log = saveData.log || [];
        state.playerStatusEffects = saveData.playerStatusEffects || [];
        state.enemyStatusEffects = saveData.enemyStatusEffects || [];
        state.achievements = saveData.achievements || [];
        state.stats = saveData.stats || {};
        state.companions = saveData.companions || {
            vance: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false },
            lyra: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false },
            apex: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false }
        };
        // Ensure all three companions exist even if loading a save with fewer
        if (state.companions) {
            if (!state.companions.vance) state.companions.vance = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
            if (!state.companions.lyra) state.companions.lyra = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
            if (!state.companions.apex) state.companions.apex = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
        }
        state.activeCompanion = saveData.activeCompanion || null;
        state.companionCooldown = saveData.companionCooldown || 0;
        state.activeCrewDirective = saveData.activeCrewDirective || null;
        
        // Restore currentLocation
        state.currentLocation = saveData.currentLocation || "terra_prime";

        // Restore worldFlags
        state.worldFlags = saveData.worldFlags || {};

        // Restore dynamic rarity items in catalog
        restoreSavedRarityItems(state.inventory, state.character?.equipment);
        
        // Restore dynamic upgraded items in catalog
        restoreSavedUpgradedItems(state.inventory, state.character?.equipment);
        
        // Retroactive skill points setup
        state.character.unlockedSkills = state.character.unlockedSkills || [];
        if (state.character.skillPoints === undefined) {
            // Retroactively grant 1 point per level above 1
            const expectedPoints = Math.max(0, state.character.level - 1);
            state.character.skillPoints = expectedPoints;
        }
        
        // Retroactive stat points setup
        if (state.character.statPoints === undefined) {
            state.character.statPoints = 0;
        }
        
        // Retroactive ship setup
        if (!state.character.ship) {
            state.character.ship = {
                engineLevel: 1,
                medbayLevel: 0,
                cargoLevel: 0,
                scannerLevel: 0,
                shieldLevel: 0,
                weaponsLevel: 0,
                shields: 0,
                maxShields: 0
            };
        } else {
            if (state.character.ship.shieldLevel === undefined) state.character.ship.shieldLevel = 0;
            if (state.character.ship.weaponsLevel === undefined) state.character.ship.weaponsLevel = 0;
            if (state.character.ship.shields === undefined) state.character.ship.shields = 0;
            if (state.character.ship.maxShields === undefined) state.character.ship.maxShields = 0;
        }

        // Retroactive cybernetics setup
        if (state.character && !state.character.cybernetics) {
            state.character.cybernetics = {
                head: null,
                arms: null,
                torso: null,
                nervous: null
            };
        }
        if (state.character && !state.character.cyberneticsMods) {
            state.character.cyberneticsMods = {
                head: [null, null],
                arms: [null, null],
                torso: [null, null],
                nervous: [null, null]
            };
        }

        // Retroactive specialization tree setup
        if (state.character) {
            if (state.character.specializationPoints === undefined) {
                state.character.specializationPoints = 0;
            }
            if (!state.character.unlockedSpecializations) {
                state.character.unlockedSpecializations = [];
            }
        }

        // Retroactive factions setup
        if (state.character && !state.character.factions) {
            state.character.factions = {
                federation: 0,
                corsairs: 0,
                syndicate: 0
            };
        }

        // Retroactive npcs setup
        if (state.character && !state.character.npcs) {
            state.character.npcs = {
                vance: { disposition: 0, memoryFlags: [] },
                mercer: { disposition: 0, memoryFlags: [] },
                thorne: { disposition: 0, memoryFlags: [] },
                nesta: { disposition: 0, memoryFlags: [] }
            };
        }

        // Retroactive narrative attributes setup
        if (state.character) {
            if (state.character.strength === undefined) {
                const role = state.character.role || "Warrior";
                if (role === "Warrior") {
                    state.character.strength = 12;
                    state.character.agility = 8;
                    state.character.intelligence = 6;
                    state.character.charisma = 8;
                } else if (role === "Rogue") {
                    state.character.strength = 8;
                    state.character.agility = 12;
                    state.character.intelligence = 8;
                    state.character.charisma = 8;
                } else { // Scientist
                    state.character.strength = 6;
                    state.character.agility = 8;
                    state.character.intelligence = 12;
                    state.character.charisma = 10;
                }
            }
            if (state.character.narrativePoints === undefined) {
                state.character.narrativePoints = 0;
            }
            if (!state.character.storyline) {
                state.character.storyline = {
                    act: 1,
                    alignment: "neutral",
                    variables: {}
                };
            }
        }

        // Clear notifications
        state.levelUpNotification = null;
        state.victoryMessage = null;

        // Update UI
        showScreen(state.gameState);
        updateUI();
        if (state.gameState === "combat" && state.enemy) {
            updateCombatUI();
        }

        if (Number(targetSlot) === 1) {
            addLog("📂 Game loaded successfully!");
            showSaveMessage("Game Loaded!");
        } else {
            addLog(`📂 Game loaded successfully from Slot ${targetSlot}!`);
            showSaveMessage(`Game Loaded (Slot ${targetSlot})`);
        }
        return true;
    } catch (error) {
        console.error("Error loading game:", error);
        alert("Failed to load game. The save file may be corrupted.");
        return false;
    }
}

/**
 * Export game state as JSON file
 */
export function exportGame() {
    if (!state.character) {
        alert("No game to export! Please create a character first.");
        return;
    }

    try {
        const saveData = getGameState();
        const jsonStr = JSON.stringify(saveData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `galactic-odyssey-save-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addLog("📤 Game exported successfully!");
        showSaveMessage("Game Exported!");
    } catch (error) {
        console.error("Error exporting game:", error);
        alert("Failed to export game. Please try again.");
    }
}

/**
 * Import game state from JSON file
 */
export function importGame() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const saveDataStr = event.target.result;
                localStorage.setItem(getStorageKey(1), saveDataStr);
                loadGame(1);
                addLog("📥 Game imported successfully!");
            } catch (error) {
                console.error("Error importing game:", error);
                alert("Failed to import game. Invalid file.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * Check if save exists
 */
export function hasSaveGame(slot) {
    return localStorage.getItem(getStorageKey(slot)) !== null;
}

/**
 * Delete save game
 */
export function deleteSaveGame(slot) {
    const targetSlot = slot !== undefined ? slot : (state.activeSaveSlot || 1);
    const key = getStorageKey(targetSlot);
    if (localStorage.getItem(key) === null) {
        alert("No saved game to delete!");
        return false;
    }

    if (confirm(`Are you sure you want to delete Save Slot ${targetSlot}? This cannot be undone.`)) {
        localStorage.removeItem(key);
        addLog(`🗑️ Save Slot ${targetSlot} deleted.`);
        showSaveMessage(`Slot ${targetSlot} Deleted!`);
        return true;
    }
    return false;
}

/**
 * Auto-save function (called at key moments)
 */
export function autoSave() {
    if (state.character && state.gameState !== "start" && state.gameState !== "characterCreation" && state.gameState !== "defeat") {
        try {
            const saveData = getGameState();
            const targetSlot = state.activeSaveSlot || 1;
            localStorage.setItem(getStorageKey(targetSlot), JSON.stringify(saveData));
            console.log(`Auto-saved game to Slot ${targetSlot}`);
        } catch (error) {
            console.error("Auto-save failed:", error);
        }
    }
}

/**
 * Initialize save system on page load
 */
export function initializeSaveSystem() {
    // Check if there's any saved game and show option to load
    const loadButton = document.getElementById("loadGameButton");
    let hasAnySave = false;
    let lastSavedTime = null;
    
    for (let i = 1; i <= 3; i++) {
        const key = getStorageKey(i);
        const saveDataStr = localStorage.getItem(key);
        if (saveDataStr) {
            hasAnySave = true;
            try {
                const saveData = JSON.parse(saveDataStr);
                if (saveData && saveData.timestamp) {
                    const time = new Date(saveData.timestamp);
                    if (!lastSavedTime || time > lastSavedTime) {
                        lastSavedTime = time;
                    }
                }
            } catch(e) {}
        }
    }
    
    if (hasAnySave) {
        if (loadButton) {
            loadButton.style.display = "block";
            if (lastSavedTime) {
                loadButton.title = `Last saved: ${lastSavedTime.toLocaleString()}`;
            }
        }
    } else {
        if (loadButton) {
            loadButton.style.display = "none";
        }
    }
}

/**
 * Get slot metadata/info for rendering in the Save/Load modal
 */
export function getSlotInfo(slot) {
    const key = getStorageKey(slot);
    const saveDataStr = localStorage.getItem(key);
    if (!saveDataStr) return { exists: false };
    
    try {
        const saveData = JSON.parse(saveDataStr);
        if (!saveData || !saveData.character) return { exists: false };
        
        const locationNames = {
            terra_prime: "Terra Prime",
            xylo_delta: "Xylo Delta",
            nebula_outpost: "Nebula Outpost",
            norkon_outpost: "Norkon Outpost"
        };
        const locId = saveData.currentLocation || "terra_prime";
        const locName = locationNames[locId] || locId;

        return {
            exists: true,
            name: saveData.character.name,
            level: saveData.character.level || 1,
            role: saveData.character.role || "Unknown",
            locationName: locName,
            timestamp: saveData.timestamp
        };
    } catch(e) {
        console.error("Error reading slot metadata:", e);
        return { exists: false };
    }
}

/**
 * Exit the active game and return to the main menu (start screen)
 */
export function exitToMainMenu() {
    if (!state) return;
    
    state.character = null;
    state.enemy = null;
    state.inventory = [];
    state.playerStatusEffects = [];
    state.enemyStatusEffects = [];
    state.gameState = "start";
    state.currentLocation = "terra_prime";
    
    // Reset DOM screens
    showScreen("start");
    
    // Clear log and inputs
    const missionLog = document.getElementById("missionLog");
    if (missionLog) missionLog.innerHTML = "";
    
    const nameInput = document.getElementById("nameInput");
    if (nameInput) nameInput.value = "";
    
    // Toggle Exit button in header
    const exitBtn = document.getElementById("exitHeaderBtn");
    if (exitBtn) exitBtn.style.display = "none";
    
    // Update continue button
    initializeSaveSystem();
    
    // Trigger general UI update
    updateUI();
    
    addLog("🚪 Exited to Main Menu.");
}

/**
 * Start a new game in a specific slot
 */
export function startNewGame(slot) {
    if (!state) return;
    
    state.activeSaveSlot = slot;
    state.character = null;
    state.enemy = null;
    state.inventory = [];
    state.log = [];
    state.playerStatusEffects = [];
    state.enemyStatusEffects = [];
    state.gameState = "characterCreation";
    state.currentLocation = "terra_prime";
    state.achievements = [];
    state.stats = {};
    state.companions = {
        vance: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false },
        lyra: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false },
        apex: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false }
    };
    state.activeCompanion = null;
    state.companionCooldown = 0;
    
    // Clear DOM inputs
    const nameInput = document.getElementById("nameInput");
    if (nameInput) nameInput.value = "";
    
    const missionLog = document.getElementById("missionLog");
    if (missionLog) missionLog.innerHTML = "";
    
    // Reset DOM screens
    showScreen("creation");
}

