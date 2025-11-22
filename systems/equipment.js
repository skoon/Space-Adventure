/**
 * Equipment System Module
 * Handles equipment management and stat calculations
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI;
let items;

/**
 * Initialize the equipment module with required dependencies
 */
export function initEquipment(deps) {
    // Store state object reference
    state = deps.state;

    // Data
    items = deps.data.items;

    // Functions
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

/**
 * Get effective stats including equipment bonuses
 */
export function getEffectiveStats() {
    if (!state.character) return { attack: 0, defense: 0 };

    let attack = state.character.attack;
    let defense = state.character.defense;

    // Add equipment stats
    if (state.character.equipment.weapon) {
        const weapon = items[state.character.equipment.weapon];
        if (weapon && weapon.stats && weapon.stats.attack) {
            attack += weapon.stats.attack;
        }
    }

    if (state.character.equipment.armor) {
        const armor = items[state.character.equipment.armor];
        if (armor && armor.stats && armor.stats.defense) {
            defense += armor.stats.defense;
        }
    }

    if (state.character.equipment.accessory) {
        const accessory = items[state.character.equipment.accessory];
        if (accessory && accessory.stats) {
            if (accessory.stats.attack) attack += accessory.stats.attack;
            if (accessory.stats.defense) defense += accessory.stats.defense;
        }
    }

    // Add status effects
    const attackBuff = state.playerStatusEffects.find(e => e.type === "attackBoost")?.value || 0;
    const defenseBuff = state.playerStatusEffects.find(e => e.type === "defenseBoost")?.value || 0;

    attack += attackBuff;
    defense += defenseBuff;

    return { attack, defense };
}

/**
 * Equip an item
 */
export function equipItem(itemName) {
    const item = items[itemName];
    if (!item || !["weapon", "armor", "accessory"].includes(item.type)) {
        addLog("Cannot equip this item.");
        return;
    }

    // Remove from inventory
    const index = state.inventory.indexOf(itemName);
    if (index === -1) return;
    state.inventory.splice(index, 1);

    // Unequip current item in slot if any
    const slot = item.type;
    if (state.character.equipment[slot]) {
        unequipItem(slot);
    }

    // Equip new item
    state.character.equipment[slot] = itemName;
    addLog(`Equipped ${itemName}.`);
    updateUI();
}

/**
 * Unequip an item from a slot
 */
export function unequipItem(slot) {
    const itemName = state.character.equipment[slot];
    if (!itemName) return;

    state.character.equipment[slot] = null;
    state.inventory.push(itemName);
    addLog(`Unequipped ${itemName}.`);
    updateUI();
}

/**
 * Get item data
 */
export function getItem(itemName) {
    return items[itemName];
}

/**
 * Check if item is equippable
 */
export function isEquippable(itemName) {
    const item = items[itemName];
    return item && ["weapon", "armor", "accessory"].includes(item.type);
}

/**
 * Check if item is consumable
 */
export function isConsumable(itemName) {
    const item = items[itemName];
    return item && item.type === "consumable";
}
