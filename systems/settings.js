/**
 * Settings System Module
 * Manages game configuration like difficulty, volume, etc.
 */

// Difficulty Definitions
export const DIFFICULTIES = {
    EASY: {
        id: 'easy',
        name: 'Easy',
        enemyHpModifier: 0.7,
        enemyDmgModifier: 0.7,
        hazardDmgModifier: 0.5,
        description: "For players who want to focus on the story."
    },
    NORMAL: {
        id: 'normal',
        name: 'Normal',
        enemyHpModifier: 1.0,
        enemyDmgModifier: 1.0,
        hazardDmgModifier: 1.0,
        description: "The standard experience."
    },
    HARD: {
        id: 'hard',
        name: 'Hard',
        enemyHpModifier: 1.3,
        enemyDmgModifier: 1.3,
        hazardDmgModifier: 1.5,
        description: "A challenging experience for veterans."
    }
};

let currentSettings = {
    difficulty: 'normal',
    showImages: true
};

/**
 * Initialize settings from local storage
 */
export function initSettings() {
    const saved = localStorage.getItem('galactic_odyssey_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            currentSettings = { ...currentSettings, ...parsed };
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }
    console.log("Settings initialized:", currentSettings);
}

/**
 * Get the current difficulty configuration object
 */
export function getDifficulty() {
    return DIFFICULTIES[currentSettings.difficulty.toUpperCase()] || DIFFICULTIES.NORMAL;
}

/**
 * Set the game difficulty
 * @param {string} level - 'easy', 'normal', 'hard'
 */
export function setDifficulty(level) {
    if (DIFFICULTIES[level.toUpperCase()]) {
        currentSettings.difficulty = level;
        saveSettings();
        return true;
    }
    return false;
}

/**
 * Whether the viewscreen renders imagery. When false the panel and the portrait
 * chips fall back to emoji — the pre-image experience, intact.
 */
export function getShowImages() {
    return currentSettings.showImages !== false;
}

/**
 * Toggle viewscreen imagery
 * @param {boolean} enabled
 */
export function setShowImages(enabled) {
    currentSettings.showImages = !!enabled;
    saveSettings();
    return currentSettings.showImages;
}

/**
 * Save settings to local storage
 */
function saveSettings() {
    localStorage.setItem('galactic_odyssey_settings', JSON.stringify(currentSettings));
}

/**
 * Get all current settings
 */
export function getSettings() {
    return currentSettings;
}
