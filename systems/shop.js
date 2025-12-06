/**
 * Shop System Module
 * Handles buying and selling items
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI;
let items;

/**
 * Initialize the shop module
 */
export function initShop(deps) {
    state = deps.state;
    items = deps.data.items;

    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

/**
 * Buy an item from the shop
 */
export function buyItem(itemName) {
    const item = items[itemName];
    if (!item) return false;

    const price = item.price || 10; // Default price if not set

    if (state.character.credits < price) {
        addLog(`❌ Not enough credits! Cost: ${price}, You have: ${state.character.credits}`);
        return false;
    }

    state.character.credits -= price;
    state.inventory.push(itemName);
    addLog(`💰 Bought ${itemName} for ${price} credits.`);
    updateUI();
    return true;
}

/**
 * Sell an item to the shop
 */
export function sellItem(itemName) {
    const idx = state.inventory.indexOf(itemName);
    if (idx === -1) return false;

    const item = items[itemName];
    const price = item ? Math.floor((item.price || 10) / 2) : 5; // Sell for 50%

    state.inventory.splice(idx, 1);
    state.character.credits += price;
    addLog(`💰 Sold ${itemName} for ${price} credits.`);
    updateUI();
    return true;
}

/**
 * Get item price
 */
export function getItemPrice(itemName) {
    const item = items[itemName];
    return item ? (item.price || 10) : 0;
}

/**
 * Get item sell price
 */
export function getItemSellPrice(itemName) {
    return Math.floor(getItemPrice(itemName) / 2);
}
