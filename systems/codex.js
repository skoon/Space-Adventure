/**
 * Codex System Module
 * Manages lore entries, unlock tracking, read states, and progress calculations.
 */

import { codexEntries } from '../data/codex.js';
import { eventEmitter } from './eventEmitter.js';

let state = null;
let savedDeps = null;

/**
 * Ensures state.codex is properly structured for older saves or fresh profiles.
 */
export function ensureCodexState() {
    if (!state) return null;

    if (!state.codex) {
        state.codex = {
            unlocked: [],
            unread: []
        };
    } else {
        if (!Array.isArray(state.codex.unlocked)) {
            state.codex.unlocked = [];
        }
        if (!Array.isArray(state.codex.unread)) {
            state.codex.unread = [];
        }
    }

    return state.codex;
}

/**
 * Initialize the Codex system with injected dependencies.
 * @param {Object} deps - Dependency object containing { state, ui, ... }
 */
export function initCodex(deps = {}) {
    savedDeps = deps;
    state = deps.state || null;
    ensureCodexState();
}

/**
 * Unlock a codex entry by ID.
 * @param {string} id - Codex entry identifier
 * @returns {boolean} - true if newly unlocked, false if invalid or already unlocked
 */
export function unlockCodexEntry(id) {
    if (!id) return false;

    const entry = codexEntries.find(e => e.id === id);
    if (!entry) return false;

    ensureCodexState();
    if (!state || !state.codex) return false;

    if (state.codex.unlocked.includes(id)) {
        return false; // Already unlocked (idempotent)
    }

    state.codex.unlocked.push(id);
    if (!state.codex.unread.includes(id)) {
        state.codex.unread.push(id);
    }

    // Optional notification and logging
    const ui = savedDeps?.ui || {};
    const addLog = ui.addLog || (typeof savedDeps?.addLog === 'function' ? savedDeps.addLog : null);
    const showNotification = ui.showNotification || (typeof savedDeps?.showNotification === 'function' ? savedDeps.showNotification : null);

    if (addLog) {
        addLog(`📖 CODEX ENTRY UNLOCKED: ${entry.title}`);
    }
    if (showNotification) {
        showNotification(`Codex Entry Unlocked: ${entry.title}`);
    }

    eventEmitter.emit('codexUnlocked', entry);
    return true;
}

/**
 * Mark a codex entry as read, removing it from the unread list.
 * @param {string} id - Codex entry identifier
 * @returns {boolean} - true if entry was unread and marked as read, false otherwise
 */
export function markCodexRead(id) {
    ensureCodexState();
    if (!state || !state.codex || !Array.isArray(state.codex.unread)) return false;

    const index = state.codex.unread.indexOf(id);
    if (index !== -1) {
        state.codex.unread.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Check if a specific codex entry is unlocked.
 * @param {string} id - Codex entry identifier
 * @returns {boolean}
 */
export function isCodexUnlocked(id) {
    ensureCodexState();
    if (!state || !state.codex || !Array.isArray(state.codex.unlocked)) return false;
    return state.codex.unlocked.includes(id);
}

/**
 * Get all codex entries for a category, enriched with unlocked and unread flags.
 * Locked entries have their body hidden and title masked.
 * @param {string} category - Category filter, or 'all'
 * @returns {Array} - Array of enriched entry objects
 */
export function getCodexEntries(category = 'all') {
    ensureCodexState();
    const unlocked = (state?.codex?.unlocked && Array.isArray(state.codex.unlocked)) ? state.codex.unlocked : [];
    const unread = (state?.codex?.unread && Array.isArray(state.codex.unread)) ? state.codex.unread : [];

    const filtered = (category === 'all' || !category)
        ? codexEntries
        : codexEntries.filter(e => e.category === category);

    return filtered.map(entry => {
        const isUnlocked = unlocked.includes(entry.id);
        const isUnread = isUnlocked && unread.includes(entry.id);

        if (isUnlocked) {
            return {
                ...entry,
                locked: false,
                unlocked: true,
                unread: isUnread
            };
        } else {
            return {
                id: entry.id,
                category: entry.category,
                title: '???',
                summary: 'Encrypted or undiscovered data entry.',
                unlockHint: entry.unlockHint,
                locked: true,
                unlocked: false,
                unread: false
            };
        }
    });
}

/**
 * Get overall codex completion progress and statistics.
 * @returns {Object} - { unlockedCount, totalCount, unreadCount, percentage }
 */
export function getCodexProgress() {
    ensureCodexState();
    const unlockedList = (state?.codex?.unlocked && Array.isArray(state.codex.unlocked)) ? state.codex.unlocked : [];
    const unreadList = (state?.codex?.unread && Array.isArray(state.codex.unread)) ? state.codex.unread : [];

    const totalCount = codexEntries.length;
    const unlockedCount = unlockedList.filter(id => codexEntries.some(e => e.id === id)).length;
    const unreadCount = unreadList.filter(id => codexEntries.some(e => e.id === id)).length;
    const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    return {
        unlockedCount,
        totalCount,
        unreadCount,
        percentage
    };
}
