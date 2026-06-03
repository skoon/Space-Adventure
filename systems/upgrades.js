/**
 * Equipment Upgrades System Module
 * Handles upgrading weapons, armor, and accessories
 */

import { checkAchievement } from './achievements.js';

// State object reference
let state;
let addLog, updateUI;
let items;

/**
 * Initialize the upgrades module with dependencies
 */
export function initUpgrades(deps) {
    state = deps.state;
    items = deps.data.items;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

/**
 * Parse an item name to extract its base name and upgrade level
 * @param {string} itemName
 * @returns {{baseName: string, upgradeLevel: number}|null}
 */
export function parseItemUpgrade(itemName) {
    if (!itemName) return null;
    const match = itemName.match(/^(.*) \+(\d+)$/);
    if (match) {
        return { baseName: match[1].trim(), upgradeLevel: parseInt(match[2], 10) };
    }
    return null;
}

/**
 * Dynamically register an upgraded variant of an item
 * @param {string} baseName
 * @param {number} upgradeLevel
 * @returns {string} - registered item name
 */
export function registerUpgradedItem(baseName, upgradeLevel) {
    const parsed = parseItemUpgrade(baseName);
    const cleanBaseName = parsed ? parsed.baseName : baseName;
    const currentLevel = parsed ? parsed.upgradeLevel : 0;
    const finalLevel = currentLevel + upgradeLevel;

    if (finalLevel === 0) return cleanBaseName;

    const baseItem = items[cleanBaseName];
    if (!baseItem) return baseName;

    const finalName = `${cleanBaseName} +${finalLevel}`;
    if (items[finalName]) return finalName;

    // Scale stats
    const newStats = { ...baseItem.stats };
    if (baseItem.type === "weapon") {
        newStats.attack = (newStats.attack || 0) + 2 * finalLevel;
    } else if (baseItem.type === "armor") {
        newStats.defense = (newStats.defense || 0) + 2 * finalLevel;
    } else if (baseItem.type === "accessory") {
        if (newStats.attack) newStats.attack += 1 * finalLevel;
        if (newStats.defense) newStats.defense += 1 * finalLevel;
    }

    // Scale value (30% price boost per level)
    const newPrice = Math.round(baseItem.price * (1 + 0.3 * finalLevel));

    items[finalName] = {
        ...baseItem,
        stats: newStats,
        price: newPrice,
        upgradeLevel: finalLevel,
        description: `${baseItem.description} (+${finalLevel})`
    };

    return finalName;
}

/**
 * Restore saved upgraded items on load
 */
export function restoreSavedUpgradedItems(inventory, equipment) {
    if (inventory) {
        inventory.forEach(itemName => {
            if (typeof itemName === 'string') {
                const parsed = parseItemUpgrade(itemName);
                if (parsed) {
                    registerUpgradedItem(parsed.baseName, parsed.upgradeLevel);
                }
            }
        });
    }

    if (equipment) {
        Object.values(equipment).forEach(itemName => {
            if (itemName && typeof itemName === 'string') {
                const parsed = parseItemUpgrade(itemName);
                if (parsed) {
                    registerUpgradedItem(parsed.baseName, parsed.upgradeLevel);
                }
            }
        });
    }
}

/**
 * Get requirements and costs for upgrading an item
 * @param {string} itemName
 * @returns {object|null} Cost details or null if not eligible
 */
export function getUpgradeRequirements(itemName) {
    const parsed = parseItemUpgrade(itemName);
    const cleanBaseName = parsed ? parsed.baseName : itemName;
    const currentLevel = parsed ? parsed.upgradeLevel : 0;

    const baseItem = items[cleanBaseName];
    if (!baseItem || !["weapon", "armor", "accessory"].includes(baseItem.type)) {
        return null; // Not upgradable
    }

    if (currentLevel >= 5) {
        return null; // Max level reached
    }

    const nextLevel = currentLevel + 1;
    const creditsCost = 150 * nextLevel;

    // Define material costs based on upgrade tier
    let materials = {};
    if (nextLevel === 1) {
        materials = { "Scrap Metal": 2, "Rusty Pipe": 1 };
    } else if (nextLevel === 2) {
        materials = { "Scrap Metal": 4, "Rusty Pipe": 2 };
    } else if (nextLevel === 3) {
        materials = { "Scrap Metal": 6, "Circuit Board": 1 };
    } else if (nextLevel === 4) {
        materials = { "Scrap Metal": 8, "Circuit Board": 2, "Titanium Ingot": 1 };
    } else if (nextLevel === 5) {
        materials = { "Scrap Metal": 10, "Circuit Board": 3, "Titanium Ingot": 2, "Plasma Core": 1 };
    }

    return {
        cleanBaseName,
        currentLevel,
        nextLevel,
        credits: creditsCost,
        materials
    };
}

/**
 * Upgrade an item in inventory or equipment
 * @param {string} container - 'inventory' or 'equipment'
 * @param {string|number} key - index for inventory, slot for equipment
 * @returns {boolean} Success state
 */
export function upgradeItem(container, key) {
    let itemName = "";
    if (container === "inventory") {
        itemName = state.inventory[key];
    } else if (container === "equipment") {
        itemName = state.character.equipment[key];
    }

    const reqs = getUpgradeRequirements(itemName);
    if (!reqs) {
        addLog("❌ Item cannot be upgraded further.");
        return false;
    }

    // Verify credits
    if (state.character.credits < reqs.credits) {
        addLog("❌ Insufficient credits for upgrade.");
        return false;
    }

    // Verify materials
    for (const [mat, amt] of Object.entries(reqs.materials)) {
        const count = state.inventory.filter(i => i === mat).length;
        if (count < amt) {
            addLog(`❌ Missing materials: ${mat} (need ${amt}, have ${count})`);
            return false;
        }
    }

    // Deduct credits
    state.character.credits -= reqs.credits;

    // Deduct materials
    for (const [mat, amt] of Object.entries(reqs.materials)) {
        for (let i = 0; i < amt; i++) {
            const idx = state.inventory.indexOf(mat);
            if (idx > -1) {
                state.inventory.splice(idx, 1);
            }
        }
    }

    // Register upgraded item variant
    const upgradedName = registerUpgradedItem(itemName, 1);

    // Swap item in container
    if (container === "inventory") {
        // Find current item's index again, as materials removal may have shifted indices
        const itemIndex = state.inventory.indexOf(itemName);
        if (itemIndex > -1) {
            state.inventory[itemIndex] = upgradedName;
        } else {
            // fallback, push to inventory if lost
            state.inventory.push(upgradedName);
        }
    } else if (container === "equipment") {
        state.character.equipment[key] = upgradedName;
    }

    checkAchievement("upgrade", { level: reqs.nextLevel });

    addLog(`⚡ Upgraded ${itemName} to ${upgradedName}!`);
    updateUI();
    return true;
}
