/**
 * Locations System Module
 * Handles location data and travel logic
 */

import { checkAchievement } from './achievements.js';
import { rollMarketEvent } from './market.js';

// State object reference
let state;

// Dependencies
let addLog, updateUI, playTravelAnimation;
let locations;
import { getMedbayHealAmount, getScannerBonus, triggerSpaceCombatEvent } from './ship.js';

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
    return Object.values(locations).filter(loc => {
        if (loc.unlocked === false) return false;
        
        let req = loc.engineLevelReq || 1;
        if (loc.controllingFaction && state.character?.factions) {
            const rep = state.character.factions[loc.controllingFaction] || 0;
            if (rep < -30) {
                req += 1; // Blockade penalty
            }
        }
        return engineLevel >= req;
    });
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
    let req = location.engineLevelReq || 1;
    let hasBlockade = false;
    if (location.controllingFaction && state.character?.factions) {
        const rep = state.character.factions[location.controllingFaction] || 0;
        if (rep < -30) {
            req += 1;
            hasBlockade = true;
        }
    }

    if (engineLevel < req) {
        if (hasBlockade) {
            addLog(`❌ Cannot travel to ${location.name}. Hostile faction security blockades require Engine Level ${req} to slip past.`);
        } else {
            addLog(`❌ Cannot travel to ${location.name}. Engine Level ${req} required.`);
        }
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
            const ambushFaction = checkForAmbushFaction(location);
            if (ambushFaction) {
                triggerTravelAmbush(ambushFaction, location);
            } else {
                const scannerBonus = getScannerBonus() || 0;
                const roll = Math.random() * 100;
                if (roll < 15 + (scannerBonus / 2)) {
                    import('./derelict.js').then(m => m.startDerelictRun(location));
                } else if (roll < 35 + (scannerBonus / 2)) {
                    triggerSpaceCombatEvent(location, () => {
                        completeTravel(location);
                    });
                } else {
                    completeTravel(location);
                }
            }
        });
    } else {
        const ambushFaction = checkForAmbushFaction(location);
        if (ambushFaction) {
            triggerTravelAmbush(ambushFaction, location);
        } else {
            const scannerBonus = getScannerBonus() || 0;
            const roll = Math.random() * 100;
            if (roll < 15 + (scannerBonus / 2)) {
                import('./derelict.js').then(m => m.startDerelictRun(location));
            } else if (roll < 35 + (scannerBonus / 2)) {
                triggerSpaceCombatEvent(location, () => {
                    completeTravel(location);
                });
            } else {
                completeTravel(location);
            }
        }
    }

    return true;
}

function checkForAmbushFaction(destLocation) {
    if (!state.character || !state.character.factions) return null;
    
    // Check if Apex's loyalty quest is active and emblem not collected yet
    if (state.character.activeQuests && state.character.activeQuests.loyalty_apex && state.character.activeQuests.loyalty_apex.progress === 0) {
        return 'corsair_bounty_hunter';
    }
    
    // 1. Check destination controlling faction: double ambush chance (up to 100%) if hostile
    if (destLocation && destLocation.controllingFaction) {
        const factionId = destLocation.controllingFaction;
        const rep = state.character.factions[factionId] || 0;
        if (rep < -30) {
            const chance = Math.min(100, Math.abs(rep)); // Up to 100% chance at -100 standing
            if (Math.random() * 100 < chance) {
                return factionId;
            }
        }
    }
    
    // 2. Fallback general random ambushes in transit
    // Check Corsairs
    const corsairRep = state.character.factions.corsairs || 0;
    if (corsairRep < -30) {
        const chance = Math.abs(corsairRep) / 2; // up to 50% at -100 rep
        if (Math.random() * 100 < chance) {
            return 'corsairs';
        }
    }
    
    // Check Federation
    const fedRep = state.character.factions.federation || 0;
    if (fedRep < -30) {
        const chance = Math.abs(fedRep) / 2;
        if (Math.random() * 100 < chance) {
            return 'federation';
        }
    }
    
    return null;
}

function triggerTravelAmbush(factionId, location) {
    // 1. Complete the travel first so the player arrives at the location
    completeTravel(location);

    // 2. Define enemy templates
    let enemyTemplate;
    if (factionId === 'corsairs') {
        enemyTemplate = {
            name: "Void Corsair Reaver",
            hp: 60,
            maxHp: 60,
            attack: 14,
            defense: 4,
            xp: 35,
            drops: ["Scrap Metal", "Energy Cell"]
        };
    } else if (factionId === 'federation') {
        enemyTemplate = {
            name: "Federation Patrol Cruiser",
            hp: 80,
            maxHp: 80,
            attack: 12,
            defense: 7,
            xp: 40,
            drops: ["Circuit Board", "Quantum Chip"]
        };
    } else if (factionId === 'corsair_bounty_hunter') {
        enemyTemplate = {
            name: "Void Corsair Bounty Hunter",
            hp: 90,
            maxHp: 90,
            attack: 16,
            defense: 5,
            xp: 50,
            drops: ["Bounty Hunter Emblem"]
        };
    } else {
        return;
    }

    // 3. Scale stats
    const levelScale = 1 + (((state.character.level || 1) - 1) * 0.15);
    const enemy = {
        ...enemyTemplate,
        hp: Math.floor(enemyTemplate.hp * levelScale),
        maxHp: Math.floor(enemyTemplate.hp * levelScale),
        attack: Math.floor(enemyTemplate.attack * levelScale)
    };

    // 4. Start combat
    state.enemy = enemy;
    state.character.ap = state.character.maxAp || 3;
    state.companionCooldown = 0;
    state.playerStatusEffects = [];
    state.enemyStatusEffects = [];
    state.gameState = "combat";

    addLog(`🚨 AMBUSH! Hostile ${factionId === 'corsairs' ? 'Void Corsair' : (factionId === 'corsair_bounty_hunter' ? 'Void Corsair Bounty Hunter' : 'Federation')} forces intercepted your ship in transit!`);

    import('./ui.js').then(ui => {
        ui.showScreen("combat");
        ui.updateUI();
        import('./combat.js').then(combat => {
            if (combat.updateCombatUI) combat.updateCombatUI();
        });
    });
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

    // Trigger dynamic market fluctuation
    rollMarketEvent();

    // Achievement check
    checkAchievement("travel", { locationId: location.id });

    // Trigger crew banter
    if (state.companions) {
        const unlockedCompanions = Object.keys(state.companions).filter(id => state.companions[id].unlocked);
        if (unlockedCompanions.length > 0 && Math.random() < 0.35) {
            import('./companions.js').then(m => m.triggerCrewBanter());
        }
    }

    updateUI();
}
