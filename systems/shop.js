/**
 * Shop System Module
 * Handles buying and selling items
 */

import { rollRarity } from './rarity.js';

// State object reference
let state;
let addLog, updateUI;
let items, locations;

/**
 * Initialize the shop module
 */
export function initShop(deps) {
    state = deps.state;
    items = deps.data.items;
    locations = deps.data.locations;

    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

/**
 * Get the price multiplier for a faction based on player reputation
 */
export function getPriceMultiplier(factionId) {
    if (!state || !state.character || !state.character.factions) return 1.0;
    const rep = state.character.factions[factionId] || 0;
    if (rep >= 0) {
        return 1.0 - (rep / 100) * 0.3; // Up to 30% discount at +100 Rep
    } else {
        return 1.0 + (Math.abs(rep) / 100) * 0.5; // Up to 50% markup at -100 Rep
    }
}

/**
 * Get the active faction for the local planet's merchant
 */
export function getLocalShopFaction() {
    if (!state || !state.currentLocation) return 'federation';
    const loc = locations?.[state.currentLocation];
    if (loc && loc.controllingFaction) {
        return loc.controllingFaction;
    }
    if (state.currentLocation === 'xylo_delta') return 'corsairs';
    if (state.currentLocation === 'nebula_outpost') return 'syndicate';
    return 'federation';
}

/**
 * Buy an item from the shop
 */
export function buyItem(itemName) {
    const item = items[itemName];
    if (!item) return false;

    const price = getItemPrice(itemName);

    if (state.character.credits < price) {
        addLog(`❌ Not enough credits! Cost: ${price}, You have: ${state.character.credits}`);
        return false;
    }

    state.character.credits -= price;
    const finalItem = rollRarity(itemName, 0.02);
    state.inventory.push(finalItem);
    if (finalItem !== itemName) {
        addLog(`🎉 Lucky! Your purchased ${itemName} was upgraded to ${finalItem}!`);
    }
    addLog(`💰 Bought ${finalItem} for ${price} credits.`);
    updateUI();
    return true;
}

/**
 * Sell an item to the shop
 */
export function sellItem(itemName) {
    const idx = state.inventory.indexOf(itemName);
    if (idx === -1) return false;

    const price = getItemSellPrice(itemName);

    state.inventory.splice(idx, 1);
    state.character.credits += price;
    addLog(`💰 Sold ${itemName} for ${price} credits.`);
    updateUI();
    return true;
}

function getRegionalPriceModifier(locationId, itemName) {
    if (!locationId) return 1.0;
    
    // Terra Prime
    if (locationId === 'terra_prime') {
        if (itemName === 'Scrap Metal' || itemName === 'Rusty Pipe') return 0.75;
        if (itemName === 'Plasma Core' || itemName === 'Carbon Nanotubes') return 1.25;
    }
    // Xylo Delta
    if (locationId === 'xylo_delta') {
        if (itemName === 'Cargo Container') return 0.70;
        if (itemName === 'Energy Cell' || itemName === 'Nano Stimpack') return 1.30;
    }
    // Inferno-IX
    if (locationId === 'inferno_ix') {
        if (itemName === 'Titanium Ingot' || itemName === 'Tungsten Ore') return 0.65;
        if (itemName === 'Quantum Chip' || itemName === 'Circuit Board') return 1.25;
    }
    // Crio-Prime
    if (locationId === 'crio_prime') {
        if (itemName === 'Alien Crystal' || itemName === 'Bio-Gel') return 0.65;
        if (itemName === 'Quantum Chip' || itemName === 'Carbon Nanotubes') return 1.25;
    }
    
    return 1.0;
}

/**
 * Get item price
 */
export function getItemPrice(itemName) {
    const item = items[itemName];
    if (!item) return 0;
    
    let basePrice = item.price || 10;
    
    // Apply dynamic market price if it's a commodity
    if (state.market && state.market.prices && state.market.prices[itemName] !== undefined) {
        basePrice = state.market.prices[itemName];
    }
    
    // Apply regional price modifier
    const regMod = getRegionalPriceModifier(state.currentLocation, itemName);
    basePrice = Math.floor(basePrice * regMod);
    
    const faction = getLocalShopFaction();
    return Math.max(1, Math.floor(basePrice * getPriceMultiplier(faction)));
}

/**
 * Get item sell price
 */
export function getItemSellPrice(itemName) {
    const item = items[itemName];
    if (!item) return 0;
    
    let basePrice = item.price || 10;
    
    // Apply dynamic market price if it's a commodity
    if (state.market && state.market.prices && state.market.prices[itemName] !== undefined) {
        basePrice = state.market.prices[itemName];
    }
    
    // Apply regional price modifier
    const regMod = getRegionalPriceModifier(state.currentLocation, itemName);
    basePrice = Math.floor(basePrice * regMod);
    
    const baseSellPrice = Math.floor(basePrice / 2);
    const faction = getLocalShopFaction();
    const mult = getPriceMultiplier(faction);
    return Math.max(1, Math.floor(baseSellPrice * (2.0 - mult))); // Friendly = higher sell price, Hostile = lower sell price
}

/**
 * Order an item for later pickup (Photon Prime online ordering)
 * Maximum 3 pending orders allowed
 */
export function orderItem(itemName) {
    const item = items[itemName];
    if (!item) return false;

    const basePrice = item.price || 10;
    const price = Math.floor(basePrice * getPriceMultiplier('syndicate'));

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
    const finalItem = rollRarity(itemName, 0.02);
    state.inventory.push(finalItem);
    if (finalItem !== itemName) {
        addLog(`🎉 Lucky! Your delivery of ${itemName} was upgraded to ${finalItem}!`);
    }
    addLog(`📦 Collected ${finalItem} from Photon Prime drop box!`);
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
    const finalClaimed = [];
    claimed.forEach(itemName => {
        const finalItem = rollRarity(itemName, 0.02);
        state.inventory.push(finalItem);
        finalClaimed.push(finalItem);
        if (finalItem !== itemName) {
            addLog(`🎉 Lucky! Your delivery of ${itemName} was upgraded to ${finalItem}!`);
        }
        addLog(`📦 Collected ${finalItem} from Photon Prime drop box!`);
    });

    state.character.pendingOrders = [];
    updateUI();
    return finalClaimed;
}

/**
 * Get list of pending orders
 */
export function getPendingOrders() {
    return state.character.pendingOrders || [];
}

