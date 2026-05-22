/**
 * Ship Upgrades & Maintenance Module
 * Handles ship module upgrades and bonuses
 */

let state;
let addLog, updateUI;

export function initShip(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

export const shipModules = {
    engine: {
        id: 'engine',
        name: 'Engine',
        maxLevel: 3,
        descriptions: [
            "Basic thrusters. Limited range.",
            "Upgraded warp drive. Unlocks Outer Planets.",
            "Advanced hyperdrive. Unlocks Deep Space."
        ],
        costs: [
            { credits: 0, materials: {} }, // Level 1 (base)
            { credits: 500, materials: { "Titanium Ingot": 2, "Energy Cell": 1 } }, // Level 1 -> 2
            { credits: 1500, materials: { "Titanium Ingot": 5, "Plasma Core": 1 } } // Level 2 -> 3
        ]
    },
    medbay: {
        id: 'medbay',
        name: 'Medical Bay',
        maxLevel: 3,
        descriptions: [
            "No automated healing.",
            "Basic first aid. Heals 10 HP after combat/travel.",
            "Advanced surgical pod. Heals 25 HP after combat/travel.",
            "Regenerative nanites. Heals 50 HP after combat/travel."
        ],
        costs: [
            { credits: 200, materials: { "Bio-Gel": 2 } }, // Level 0 -> 1
            { credits: 800, materials: { "Bio-Gel": 5, "Energy Cell": 2 } }, // Level 1 -> 2
            { credits: 2000, materials: { "Bio-Gel": 10, "Plasma Core": 1 } } // Level 2 -> 3
        ]
    },
    cargo: {
        id: 'cargo',
        name: 'Cargo Hold',
        maxLevel: 3,
        descriptions: [
            "Standard storage.",
            "Expanded bay. Increases inventory capacity.",
            "Quantum storage. Vastly increases inventory capacity.",
            "Pocket dimension. Near limitless storage."
        ],
        costs: [
            { credits: 300, materials: { "Titanium Ingot": 3 } },
            { credits: 1000, materials: { "Titanium Ingot": 8, "Energy Cell": 2 } },
            { credits: 2500, materials: { "Titanium Ingot": 15, "Plasma Core": 2 } }
        ]
    },
    scanner: {
        id: 'scanner',
        name: 'Scanner Array',
        maxLevel: 3,
        descriptions: [
            "Basic sensors.",
            "Deep space array. +10% chance for positive events.",
            "Tachyon sensors. +25% chance for positive events.",
            "Omniscient eye. +50% chance for positive events."
        ],
        costs: [
            { credits: 400, materials: { "Circuit Board": 3 } },
            { credits: 1200, materials: { "Circuit Board": 6, "Energy Cell": 2 } },
            { credits: 3000, materials: { "Circuit Board": 12, "Plasma Core": 1 } }
        ]
    }
};

export function getUpgradeCost(moduleId, currentLevel) {
    const module = shipModules[moduleId];
    if (!module || currentLevel >= module.maxLevel) return null;
    
    // For engine, index 0 is base cost (0), index 1 is upgrade to level 2
    // For others, index 0 is upgrade to level 1
    const costIndex = moduleId === 'engine' ? currentLevel : currentLevel;
    
    if (costIndex < module.costs.length) {
        return module.costs[costIndex];
    }
    return null;
}

export function canAffordUpgrade(cost) {
    if (!cost) return false;
    
    if (state.character.credits < cost.credits) return false;
    
    // Check materials
    for (const [material, amount] of Object.entries(cost.materials)) {
        const count = state.inventory.filter(i => i === material).length;
        if (count < amount) return false;
    }
    
    return true;
}

export function upgradeModule(moduleId) {
    if (!state.character || !state.character.ship) return false;
    
    const moduleKey = moduleId + 'Level';
    const currentLevel = state.character.ship[moduleKey];
    const moduleInfo = shipModules[moduleId];
    
    if (currentLevel >= moduleInfo.maxLevel) {
        addLog(`❌ ${moduleInfo.name} is already at maximum level.`);
        return false;
    }
    
    const cost = getUpgradeCost(moduleId, currentLevel);
    if (!cost) return false;
    
    if (!canAffordUpgrade(cost)) {
        addLog(`❌ Cannot afford ${moduleInfo.name} upgrade.`);
        return false;
    }
    
    // Deduct credits
    state.character.credits -= cost.credits;
    
    // Deduct materials
    for (const [material, amount] of Object.entries(cost.materials)) {
        for (let i = 0; i < amount; i++) {
            const index = state.inventory.indexOf(material);
            if (index > -1) {
                state.inventory.splice(index, 1);
            }
        }
    }
    
    // Upgrade
    state.character.ship[moduleKey]++;
    
    addLog(`🚀 ${moduleInfo.name} upgraded to level ${state.character.ship[moduleKey]}!`);
    updateUI();
    return true;
}

// Hooks
export function getMedbayHealAmount() {
    if (!state || !state.character || !state.character.ship) return 0;
    const level = state.character.ship.medbayLevel;
    if (level === 1) return 10;
    if (level === 2) return 25;
    if (level === 3) return 50;
    return 0;
}

export function getScannerBonus() {
    if (!state || !state.character || !state.character.ship) return 0;
    const level = state.character.ship.scannerLevel;
    // Return extra weight for good events
    if (level === 1) return 10; // +10% weight
    if (level === 2) return 25;
    if (level === 3) return 50;
    return 0;
}

export function getEngineLevel() {
    if (!state || !state.character || !state.character.ship) return 1;
    return state.character.ship.engineLevel;
}
