/**
 * Exploration System Module
 * Handles random events, NPC encounters, and exploration mechanics
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI;
let events;

/**
 * Initialize the exploration module with required dependencies
 */
export function initExploration(deps) {
    // Store state object reference
    state = deps.state;

    // Functions
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;

    // New Events Module
    events = deps.events;
}

/**
 * Simulate exploration events
 */
export function simulateExploration() {
    if (state.gameState !== "exploring") return;

    setTimeout(() => {
        // Use the new events system
        const event = events.generateRandomEvent();
        events.handleEvent(event);

        updateUI();
    }, 2000);
}

/**
 * Travel deeper into the world
 */
export function travelDeeper() {
    addLog("Venturing deeper into the unknown...");
    simulateExploration();
}

// Export closeEventModal for backward compatibility if needed,
// but it seems it was used by the old HTML.
// The new system uses showDialog from ui.js which has its own modal.
// We should check if index.html still has the old eventModal.
// If so, we might want to keep it or remove it.
// For now, let's keep it if it's exported, but it's not used by the new system.

