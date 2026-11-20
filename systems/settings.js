/**
 * Settings System Module
 * Manages game configuration like difficulty, volume, etc.
 */

import { setLocale as setThemeLocale, applyLocaleToDOM } from './theme-engine.js';
import { getAudioManager } from './audio.js';

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

const DEFAULT_SETTINGS = {
    difficulty: 'normal',
    showImages: true,
    locale: 'en',
    volume: 1.0,
    muted: false
};

let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * Initialize settings from local storage
 */
export function initSettings() {
    currentSettings = { ...DEFAULT_SETTINGS };
    const saved = localStorage.getItem('galactic_odyssey_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            currentSettings = { ...currentSettings, ...parsed };
        } catch (e) {
            console.error("Failed to load settings:", e);
        }
    }
    const rawVol = currentSettings.volume;
    const parsedVolume = (rawVol === null || rawVol === '' || typeof rawVol === 'boolean') ? NaN : Number(rawVol);
    currentSettings.volume = Number.isFinite(parsedVolume)
        ? Math.min(1, Math.max(0, parsedVolume))
        : 1.0;
    currentSettings.muted = Boolean(currentSettings.muted);
    currentSettings.locale = setThemeLocale(currentSettings.locale || 'en');
    applyLocaleToDOM();
    const audio = getAudioManager();
    if (audio) {
        audio.setVolume(currentSettings.volume);
        audio.mute(currentSettings.muted);
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
 * Get active locale setting
 */
export function getLocale() {
    return currentSettings.locale || 'en';
}

/**
 * Set active locale setting
 * @param {string} lang
 */
export function setLocale(lang) {
    const active = setThemeLocale(lang);
    currentSettings.locale = active;
    saveSettings();
    applyLocaleToDOM();
    return active;
}

/**
 * Get master audio volume (0..1)
 */
export function getVolume() {
    const vol = Number(currentSettings.volume);
    return Number.isFinite(vol) ? Math.min(1, Math.max(0, vol)) : 1.0;
}

/**
 * Set master audio volume (clamped to 0..1), persist, and sync with AudioManager
 * @param {number} v
 */
export function setVolume(v) {
    const num = Number(v);
    if (Number.isFinite(num)) {
        currentSettings.volume = Math.min(1, Math.max(0, num));
    } else {
        const prev = Number(currentSettings.volume);
        currentSettings.volume = Number.isFinite(prev) ? Math.min(1, Math.max(0, prev)) : 1.0;
    }
    saveSettings();
    getAudioManager()?.setVolume(currentSettings.volume);
    return currentSettings.volume;
}

/**
 * Get whether audio is muted
 */
export function getMuted() {
    return Boolean(currentSettings.muted);
}

/**
 * Set audio mute state, persist, and sync with AudioManager
 * @param {boolean} flag
 */
export function setMuted(flag) {
    currentSettings.muted = Boolean(flag);
    saveSettings();
    getAudioManager()?.mute(currentSettings.muted);
    return currentSettings.muted;
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
