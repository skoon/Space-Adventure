/**
 * Locations System Module
 * Handles location data and travel logic
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI, playTravelAnimation;
let locations;
import { getMedbayHealAmount } from './ship.js';

/**
 * Initialize the locations module
 */
export function initLocations(deps) {
    state = deps.state;
    locations = deps.data.locations;

    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    playTravelAnimation = deps.ui.playTravelAnimation;
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
    const engineLevel = state.character?.ship?.engineLevel || 1;
    return Object.values(locations).filter(loc => loc.unlocked !== false && engineLevel >= (loc.engineLevelReq || 1));
}

/**
 * Travel to a new location
 */
export function travelTo(locationId) {
    const location = locations[locationId];
    if (!location) return false;

    if (state.gameState === "combat") {
        addLog("❌ Cannot travel while in combat!");
        return false;
    }

    if (location.unlocked === false) {
        addLog(`❌ Cannot travel to ${location.name}. Functionality locked.`);
        return false;
    }

    const engineLevel = state.character?.ship?.engineLevel || 1;
    if (engineLevel < (location.engineLevelReq || 1)) {
        addLog(`❌ Cannot travel to ${location.name}. Engine Level ${location.engineLevelReq} required.`);
        return false;
    }

    const cost = location.travelCost || 0;
    const currentCredits = state.character.credits || 0;

    if (currentCredits < cost) {
        addLog(`❌ Not enough credits! Travel to ${location.name} costs ${cost} credits.`);
        return false;
    }

    // Deduct cost
    if (cost > 0) {
        state.character.credits = currentCredits - cost;
        addLog(`Paid ${cost} credits for transport.`);
    }

    // Trigger travel animation and logic
    if (playTravelAnimation) {
        playTravelAnimation(() => {
            import('./ship.js').then(ship => {
                const scannerBonus = ship.getScannerBonus() || 0;
                // Base 15% chance + Scanner Bonus / 2 (max 25% extra)
                if (Math.random() * 100 < 15 + (scannerBonus / 2)) {
                    import('./derelict.js').then(m => m.startDerelictRun(location));
                } else {
                    completeTravel(location);
                }
            });
        });
    } else {
        import('./ship.js').then(ship => {
            const scannerBonus = ship.getScannerBonus() || 0;
            if (Math.random() * 100 < 15 + (scannerBonus / 2)) {
                import('./derelict.js').then(m => m.startDerelictRun(location));
            } else {
                completeTravel(location);
            }
        });
    }

    return true;
}

function completeTravel(location) {
    state.currentLocation = location.id;
    addLog(`🚀 Traveling to ${location.name}...`);
    addLog(`ARRIVAL: ${location.description}`);
    
    // Trigger medbay healing
    if (state.character && state.character.ship) {
        const heal = getMedbayHealAmount();
        if (heal > 0 && state.character.hp < state.character.maxHp) {
            const oldHp = state.character.hp;
            state.character.hp = Math.min(state.character.maxHp, state.character.hp + heal);
            addLog(`🩺 Medbay healed you for ${state.character.hp - oldHp} HP during travel.`);
        }
    }

    updateUI();
}
