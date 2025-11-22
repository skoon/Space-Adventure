/**
 * Save/Load System Module
 * Handles game persistence, save/load, import/export
 */

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
        enemyStatusEffects: state.enemyStatusEffects
    };
}

/**
 * Save game to localStorage
 */
export function saveGame() {
    if (!state.character) {
        alert("No game to save! Please create a character first.");
        return false;
    }

    try {
        const saveData = getGameState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
        addLog("💾 Game saved successfully!");
        showSaveMessage("Game Saved!");
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
export function loadGame() {
    try {
        const saveDataStr = localStorage.getItem(STORAGE_KEY);
        if (!saveDataStr) {
            alert("No saved game found!");
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

        // Clear notifications
        state.levelUpNotification = null;
        state.victoryMessage = null;

        // Update UI
        showScreen(state.gameState);
        updateUI();
        if (state.gameState === "combat" && state.enemy) {
            updateCombatUI();
        }

        addLog("📂 Game loaded successfully!");
        showSaveMessage("Game Loaded!");
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
                localStorage.setItem(STORAGE_KEY, saveDataStr);
                loadGame();
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
export function hasSaveGame() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Delete save game
 */
export function deleteSaveGame() {
    if (!hasSaveGame()) {
        alert("No saved game to delete!");
        return;
    }

    if (confirm("Are you sure you want to delete your saved game? This cannot be undone.")) {
        localStorage.removeItem(STORAGE_KEY);
        addLog("🗑️ Saved game deleted.");
        showSaveMessage("Save Deleted!");
    }
}

/**
 * Auto-save function (called at key moments)
 */
export function autoSave() {
    if (state.character && state.gameState !== "start" && state.gameState !== "characterCreation" && state.gameState !== "defeat") {
        try {
            const saveData = getGameState();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
            console.log("Auto-saved game");
        } catch (error) {
            console.error("Auto-save failed:", error);
        }
    }
}

/**
 * Initialize save system on page load
 */
export function initializeSaveSystem() {
    // Check if there's a saved game and show option to load
    const loadButton = document.getElementById("loadGameButton");
    if (hasSaveGame()) {
        const saveInfo = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saveInfo && saveInfo.timestamp) {
            const saveDate = new Date(saveInfo.timestamp);
            const saveDateStr = saveDate.toLocaleString();
            console.log(`Save game found from ${saveDateStr}`);
            if (loadButton) {
                loadButton.style.display = "block";
                loadButton.title = `Last saved: ${saveDateStr}`;
            }
        }
    } else {
        if (loadButton) {
            loadButton.style.display = "none";
        }
    }
}
