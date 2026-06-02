import { items } from '../data/items.js';

/**
 * Roll rarity for an equippable item
 * @param {string} baseItemName - Base name of the item
 * @param {number} bonusChance - shifts weight towards higher rarities (e.g. from boss, derelict)
 * @returns {string} - final item name (either base or rarity variant)
 */
export function rollRarity(baseItemName, bonusChance = 0) {
    const item = items[baseItemName];
    if (!item || !["weapon", "armor", "accessory"].includes(item.type)) {
        return baseItemName;
    }

    // Adjust roll value with bonus chance
    const rand = Math.random() - bonusChance;
    
    // Rarity tiers:
    // Common: ~70% (rand > 0.3)
    // Rare: ~18% (0.12 < rand <= 0.3)
    // Epic: ~9% (0.03 < rand <= 0.12)
    // Legendary: ~3% (rand <= 0.03)
    if (rand <= 0.03) {
        return registerRarityItem(baseItemName, "Legendary");
    } else if (rand <= 0.12) {
        return registerRarityItem(baseItemName, "Epic");
    } else if (rand <= 0.30) {
        return registerRarityItem(baseItemName, "Rare");
    }
    
    return baseItemName; // Common (base)
}

/**
 * Register a rarity variant of an item in the global items list
 * @param {string} baseName - Base name of the item
 * @param {string} rarity - Rarity tier (Rare, Epic, Legendary)
 * @returns {string} - final registered item name
 */
export function registerRarityItem(baseName, rarity) {
    const baseItem = items[baseName];
    if (!baseItem || !baseItem.stats) return baseName;
    
    if (rarity === "Common") return baseName;
    
    const newName = `${baseName} [${rarity}]`;
    if (items[newName]) return newName;
    
    // Copy and enhance stats
    const newStats = {};
    for (const [stat, val] of Object.entries(baseItem.stats)) {
        let bonus = 0;
        if (rarity === "Rare") {
            bonus = Math.max(1, Math.round(val * 0.3));
        } else if (rarity === "Epic") {
            bonus = Math.max(2, Math.round(val * 0.6));
        } else if (rarity === "Legendary") {
            bonus = Math.max(3, Math.round(val * 1.0));
        }
        newStats[stat] = val + bonus;
    }
    
    // Calculate new price
    let priceMultiplier = 1;
    if (rarity === "Rare") priceMultiplier = 1.5;
    else if (rarity === "Epic") priceMultiplier = 2.2;
    else if (rarity === "Legendary") priceMultiplier = 4.0;
    
    const newPrice = Math.round(baseItem.price * priceMultiplier);
    
    items[newName] = {
        ...baseItem,
        stats: newStats,
        price: newPrice,
        rarity: rarity,
        description: `[${rarity}] ${baseItem.description}`
    };
    
    return newName;
}

/**
 * Parse an item name to extract its base name and rarity
 * @param {string} itemName
 * @returns {{baseName: string, rarity: string}|null}
 */
export function parseItemRarity(itemName) {
    const match = itemName.match(/^(.*) \[(Rare|Epic|Legendary)\]$/);
    if (match) {
        return { baseName: match[1].trim(), rarity: match[2] };
    }
    return null;
}

/**
 * Re-register all rarity items in state.inventory and equipment slots
 * @param {Array<string>} inventory
 * @param {object} equipment
 */
export function restoreSavedRarityItems(inventory, equipment) {
    if (inventory) {
        inventory.forEach(itemName => {
            if (typeof itemName === 'string') {
                const parsed = parseItemRarity(itemName);
                if (parsed) {
                    registerRarityItem(parsed.baseName, parsed.rarity);
                }
            }
        });
    }
    
    if (equipment) {
        Object.values(equipment).forEach(itemName => {
            if (itemName && typeof itemName === 'string') {
                const parsed = parseItemRarity(itemName);
                if (parsed) {
                    registerRarityItem(parsed.baseName, parsed.rarity);
                }
            }
        });
    }
}

/**
 * Return CSS color class (or Tailwind text-class) based on rarity
 * @param {string} rarity
 * @returns {string}
 */
export function getRarityColorClass(rarity) {
    switch (rarity) {
        case "Rare": return "text-blue-400";
        case "Epic": return "text-purple-400";
        case "Legendary": return "text-yellow-500";
        default: return "text-gray-200";
    }
}
