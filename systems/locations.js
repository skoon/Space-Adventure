/**
 * Locations System Module
 * Handles location data and travel logic
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI;
let locations;

/**
 * Initialize the locations module
 */
export function initLocations(deps) {
    state = deps.state;
    locations = deps.data.locations;

    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

/**
 * Get details of a specific location
 */
export function getLocationDetails(locationId) {
    return locations[locationId];
}

/**
 * Get all unlocked locations
 */
export function getUnlockedLocations() {
    return Object.values(locations).filter(loc => loc.unlocked);
}

/**
 * Travel to a new location
 */
export function travelTo(locationId) {
    const location = locations[locationId];
    if (!location) return false;

    if (!location.unlocked) {
        addLog(`❌ Cannot travel to ${location.name}. Functionality locked.`);
        return false;
    }

    state.currentLocation = locationId;
    addLog(`🚀 Traveling to ${location.name}...`);
    addLog(`ARRIVAL: ${location.description}`);

    updateUI();
    return true;
}
