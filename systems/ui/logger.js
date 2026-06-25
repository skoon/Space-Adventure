/**
 * Logger UI Module
 * Handles adding logs and updating log displays
 */

import { t } from '../theme-engine.js';

let state;
let renderCache;
let missionLogElement;
let combatElements;

export function initLogger(deps, cache) {
    state = deps.state;
    renderCache = cache;
    missionLogElement = deps.dom.missionLogElement;
    combatElements = deps.dom.combatElements;
}

/**
 * Add log entry with timestamp
 */
export function addLog(message) {
    const translatedMessage = t(message);
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const logEntry = `[${timeStr}] ${translatedMessage}`;
    
    if (state && state.log) {
        state.log.push(logEntry);

        // Keep log size manageable
        if (state.log.length > 100) {
            state.log = state.log.slice(-100);
        }
    }
}

/**
 * Update mission log display
 */
export function updateMissionLog() {
    if (!missionLogElement) return;
    
    // Optimization: Check if log has changed
    const currentLength = state.log.length;
    const lastEntry = currentLength > 0 ? state.log[currentLength - 1] : null;
    
    if (renderCache.log.length === currentLength && renderCache.log.lastEntry === lastEntry) {
        return;
    }
    
    renderCache.log.length = currentLength;
    renderCache.log.lastEntry = lastEntry;

    missionLogElement.innerHTML = "";

    state.log.slice(-10).reverse().forEach(entry => {
        const div = document.createElement("div");
        div.className = "log-entry";
        div.textContent = entry;
        missionLogElement.appendChild(div);
    });
}

/**
 * Update combat log display
 */
export function updateCombatLog() {
    if (!combatElements || !combatElements.combatLog) return;
    combatElements.combatLog.innerHTML = "";
    state.log.slice(-8).forEach(entry => {
        const div = document.createElement("div");
        div.className = "log-entry";
        div.textContent = entry;
        combatElements.combatLog.appendChild(div);
    });
}
