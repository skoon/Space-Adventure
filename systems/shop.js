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

/**
 * Order an item for later pickup (Photon Prime online ordering)
 * Maximum 3 pending orders allowed
 */
export function orderItem(itemName) {
    const item = items[itemName];
    if (!item) return false;

    const price = item.price || 10;

    // Check credit
    if (state.character.credits < price) {
        addLog(`❌ Insufficient credits! Cost: ${price}, You have: ${state.character.credits}`);
        return false;
    }

    // Check pending order limit
    if (!state.character.pendingOrders) {
        state.character.pendingOrders = [];
    }

    if (state.character.pendingOrders.length >= 3) {
        addLog(`❌ Maximum 3 pending orders! Find a drop box to collect your items first.`);
        return false;
    }

    // Deduct credits and add to pending orders
    state.character.credits -= price;
    state.character.pendingOrders.push(itemName);
    addLog(`📦 Ordered ${itemName} from Photon Prime for ${price} credits. Find a drop box to collect!`);
    updateUI();
    return true;
}

/**
 * Claim a single order from pending orders
 */
export function claimOrder(itemName) {
    if (!state.character.pendingOrders) {
        state.character.pendingOrders = [];
        return false;
    }

    const idx = state.character.pendingOrders.indexOf(itemName);
    if (idx === -1) return false;

    state.character.pendingOrders.splice(idx, 1);
    state.inventory.push(itemName);
    addLog(`📦 Collected ${itemName} from Photon Prime drop box!`);
    updateUI();
    return true;
}

/**
 * Claim all pending orders
 */
export function claimAllOrders() {
    if (!state.character.pendingOrders || state.character.pendingOrders.length === 0) {
        return [];
    }

    const claimed = [...state.character.pendingOrders];
    claimed.forEach(itemName => {
        state.inventory.push(itemName);
    });

    state.character.pendingOrders = [];
    updateUI();
    return claimed;
}

/**
 * Get list of pending orders
 */
export function getPendingOrders() {
    return state.character.pendingOrders || [];
}

