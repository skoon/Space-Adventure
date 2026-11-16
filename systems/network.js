/**
 * Network & Local Leaderboard Module
 * Handles local leaderboard persistence and score calculations
 */

const STORAGE_KEY = 'galactic_odyssey_leaderboard';
let memoryFallback = [];

/**
 * Safe retrieval from localStorage with in-memory fallback
 */
function loadStoredLeaderboard() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    memoryFallback = [...parsed];
                    return memoryFallback;
                }
            }
        }
    } catch (e) {
        // Fallback to memory
    }
    return memoryFallback;
}

/**
 * Safe persistence to localStorage with in-memory fallback
 */
function saveStoredLeaderboard(list) {
    memoryFallback = [...list];
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
    } catch (e) {
        // Fallback to memory
    }
}

/**
 * Computes a numeric run score based on character progression,
 * credits, combat stats, and unlocked achievements.
 */
export function calculateRunScore(state) {
    if (!state) return 0;
    const char = state.character || {};
    const stats = state.stats || {};
    const achievements = Array.isArray(state.achievements) ? state.achievements : [];

    const level = Number(char.level) || 1;
    const credits = Math.max(0, Number(char.credits) || 0);
    const enemiesDefeated = Number(stats.enemiesDefeated) || 0;
    const bossesDefeated = Number(stats.bossesDefeated) || 0;
    const itemsCrafted = Number(stats.itemsCrafted) || 0;
    const derelictsCompleted = Number(stats.derelictsCompleted) || 0;
    const achievementsCount = achievements.length;

    const score = (level * 1000)
        + credits
        + (enemiesDefeated * 50)
        + (bossesDefeated * 250)
        + (itemsCrafted * 30)
        + (derelictsCompleted * 100)
        + (achievementsCount * 200);

    return Math.max(0, Math.floor(score));
}

/**
 * Normalizes an entry, inserts it into the leaderboard, sorts descending by score,
 * caps at top 50, persists, and returns the updated leaderboard.
 */
export function submitScore(entry = {}) {
    const current = loadStoredLeaderboard();
    const normalized = {
        name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : 'Commander',
        role: typeof entry.role === 'string' && entry.role.trim() ? entry.role.trim() : 'Explorer',
        level: Number(entry.level) || 1,
        score: Number(entry.score) || 0,
        kills: Number(entry.kills ?? entry.enemiesDefeated) || 0,
        date: entry.date ? String(entry.date) : new Date().toISOString()
    };

    current.push(normalized);
    current.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    const capped = current.slice(0, 50);
    saveStoredLeaderboard(capped);
    return capped;
}

/**
 * Retrieves the top entries sorted descending by score.
 */
export function getLeaderboard(limit = 10) {
    const list = loadStoredLeaderboard();
    const sorted = [...list].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    return sorted.slice(0, limit);
}

/**
 * Clears stored leaderboard entries.
 */
export function clearLeaderboard() {
    memoryFallback = [];
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch (e) {
        // Safe fallback
    }
    return [];
}
