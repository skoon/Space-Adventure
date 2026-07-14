/**
 * Shop UI Module
 * Handles shop interface and interactions
 */

import { buyCommodityExchange, sellCommodityExchange, BASE_COMMODITIES } from '../market.js';

let state;
let items;
let buyItem;
let sellItem;
let getItemPrice;
let getItemSellPrice;
let orderItem;
let updateUI;
let currentShopTab = 'buy';

export function initShopUI(deps, uiUpdateFn) {
    state = deps.state;
    items = deps.data.items;
    updateUI = uiUpdateFn;

    if (deps.shop) {
        buyItem = deps.shop.buyItem;
        sellItem = deps.shop.sellItem;
        getItemPrice = deps.shop.getItemPrice;
        getItemSellPrice = deps.shop.getItemSellPrice;
        orderItem = deps.shop.orderItem;
    }
}

/**
 * Show Shop Modal
 */
export function showShop() {
    const modal = document.getElementById("shopScreen");
    if (modal) {
        modal.classList.remove("hidden");
        updateShopUI();
    }
}

/**
 * Switch Shop Tab
 */
export function switchShopTab(tab) {
    currentShopTab = tab;
    const buyTab = document.getElementById("shopTabBuy");
    const sellTab = document.getElementById("shopTabSell");
    const marketTab = document.getElementById("shopTabMarket");
    
    const buyContainer = document.getElementById("shopBuyContainer");
    const sellContainer = document.getElementById("shopSellContainer");
    const marketContainer = document.getElementById("shopMarketContainer");

    if (buyTab && sellTab && buyContainer && sellContainer) {
        // Reset classes
        buyTab.className = "px-6 py-2 text-gray-400 font-bold hover:text-white border-b border-transparent";
        sellTab.className = "px-6 py-2 text-gray-400 font-bold hover:text-white border-b border-transparent";
        if (marketTab) marketTab.className = "px-6 py-2 text-gray-400 font-bold hover:text-white flex items-center gap-1 border-b border-transparent";
        
        buyContainer.classList.add("hidden");
        sellContainer.classList.add("hidden");
        if (marketContainer) marketContainer.classList.add("hidden");

        if (tab === 'buy') {
            buyTab.className = "px-6 py-2 text-yellow-500 border-b-2 border-yellow-500 font-bold bg-orange-500/10 rounded-t";
            buyContainer.classList.remove("hidden");
        } else if (tab === 'sell') {
            sellTab.className = "px-6 py-2 text-yellow-500 border-b-2 border-yellow-500 font-bold bg-orange-500/10 rounded-t";
            sellContainer.classList.remove("hidden");
        } else if (tab === 'market' && marketTab && marketContainer) {
            marketTab.className = "px-6 py-2 text-yellow-500 border-b-2 border-yellow-500 font-bold bg-orange-500/10 rounded-t flex items-center gap-1";
            marketContainer.classList.remove("hidden");
        }
    }
    updateShopUI();
}

/**
 * Update Shop UI content
 */
export function updateShopUI() {
    const shopScreen = document.getElementById("shopScreen");
    if (!shopScreen || shopScreen.classList.contains("hidden")) return;

    // Update Credits Display
    const creditsDisplay = document.getElementById("shopCreditsDisplay");
    if (creditsDisplay && state.character) {
        creditsDisplay.textContent = state.character.credits;
    }

    // Buy Container
    const buyContainer = document.getElementById("shopBuyContainer");
    if (buyContainer && currentShopTab === 'buy') {
        buyContainer.innerHTML = "";
        // List all items for sale (exclude custom rarity items to avoid catalog pollution)
        const itemsForSale = Object.keys(items).filter(itemName => {
            const item = items[itemName];
            return item && !item.rarity;
        });

        itemsForSale.forEach(itemName => {
            const item = items[itemName];
            if (!item) return;

            const price = getItemPrice ? getItemPrice(itemName) : (item.price || 0);
            const canAfford = state.character.credits >= price;

            const card = document.createElement("div");
            card.className = "bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20 p-3 rounded flex justify-between items-center transition-all duration-300";
            card.innerHTML = `
                <div>
                    <div class="font-bold text-gray-200">${itemName}</div>
                    <div class="text-xs text-gray-400">${item.description}</div>
                    <div class="text-yellow-500 font-mono mt-1">${price} cr</div>
                </div>
                <button class="px-3 py-1 rounded text-sm font-bold ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
                    onclick="window.orderItemFromShop('${itemName}')" ${!canAfford ? 'disabled' : ''}>Order Now</button>
            `;
            buyContainer.appendChild(card);
        });
    }

    // Sell Container
    const sellContainer = document.getElementById("shopSellContainer");
    if (sellContainer && currentShopTab === 'sell' && state.inventory) {
        sellContainer.innerHTML = "";

        if (state.inventory.length === 0) {
            sellContainer.innerHTML = "<div class='text-gray-500 italic col-span-2 text-center p-4'>Your inventory is empty.</div>";
        } else {
            // Count items
            const counts = {};
            state.inventory.forEach(i => counts[i] = (counts[i] || 0) + 1);

            Object.keys(counts).forEach(itemName => {
                const item = items[itemName];
                const count = counts[itemName];
                const price = getItemSellPrice ? getItemSellPrice(itemName) : 0;

                let textClass = "text-gray-200";
                if (item && item.rarity) {
                    if (item.rarity === "Rare") textClass = "text-blue-400 font-semibold";
                    else if (item.rarity === "Epic") textClass = "text-purple-400 font-semibold";
                    else if (item.rarity === "Legendary") textClass = "text-yellow-500 font-bold";
                }

                const card = document.createElement("div");
                card.className = "bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20 p-3 rounded flex justify-between items-center transition-all duration-300";
                card.innerHTML = `
                    <div>
                        <div class="font-bold ${textClass}">${itemName} x${count}</div>
                        <div class="text-xs text-gray-400">${item ? item.description : ''}</div>
                        <div class="text-green-500 font-mono mt-1">Sell: ${price} cr</div>
                    </div>
                    <button class="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-sm font-bold"
                        onclick="window.sellItemToShop('${itemName}')">Sell</button>
                `;
                sellContainer.appendChild(card);
            });
        }
    }

    // Market Container
    const marketContainer = document.getElementById("shopMarketContainer");
    if (marketContainer && currentShopTab === 'market') {
        const newsTicker = document.getElementById("shopMarketNewsTicker");
        if (newsTicker) {
            newsTicker.textContent = (state.market && state.market.news) ? state.market.news : "Market stable. No recent disruptions.";
        }

        const lockedWarning = document.getElementById("shopMarketLockedWarning");
        const marketGrid = document.getElementById("shopMarketGrid");

        const isAtNexus = state.currentLocation === 'galactic_nexus';
        if (!isAtNexus) {
            if (lockedWarning) lockedWarning.classList.remove("hidden");
            if (marketGrid) marketGrid.classList.add("hidden");
        } else {
            if (lockedWarning) lockedWarning.classList.add("hidden");
            if (marketGrid) {
                marketGrid.classList.remove("hidden");
                marketGrid.innerHTML = "";

                Object.keys(BASE_COMMODITIES).forEach(itemName => {
                    const currentPrice = (state.market && state.market.prices && state.market.prices[itemName] !== undefined)
                        ? state.market.prices[itemName]
                        : BASE_COMMODITIES[itemName];
                    const basePrice = BASE_COMMODITIES[itemName];
                    
                    // Calculate trend relative to base price
                    const diffPercent = Math.round(((currentPrice - basePrice) / basePrice) * 100);
                    const trendText = diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`;
                    const trendClass = diffPercent > 0 ? "text-green-500 font-semibold" : (diffPercent < 0 ? "text-red-500 font-semibold" : "text-gray-400");
                    const trendArrow = diffPercent > 0 ? "▲" : (diffPercent < 0 ? "▼" : "▶");

                    // Count in inventory
                    let count = 0;
                    if (state.inventory) {
                        state.inventory.forEach(item => {
                            if (item === itemName) count++;
                        });
                    }

                    const itemDef = items[itemName] || { description: "Commodity cargo." };

                    const card = document.createElement("div");
                    card.className = "bg-gray-700/60 border border-gray-600/50 p-3 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-3";
                    card.innerHTML = `
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-gray-200">${itemName}</span>
                                <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">Cargo x${count}</span>
                            </div>
                            <div class="text-xs text-gray-400 mt-0.5">${itemDef.description}</div>
                        </div>
                        
                        <div class="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div class="text-right">
                                <div class="text-xs text-gray-400">Exchange Price</div>
                                <div class="text-yellow-500 font-mono font-bold">${currentPrice} cr</div>
                            </div>
                            
                            <div class="text-right min-w-[70px]">
                                <div class="text-xs text-gray-400">Trend</div>
                                <div class="${trendClass} text-sm font-mono">${trendArrow} ${trendText}</div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold font-mono transition-colors"
                                    onclick="window.buyCommodityExchange('${itemName}', 1)">
                                    Buy
                                </button>
                                <button class="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-bold font-mono transition-colors ${count === 0 ? 'opacity-40 cursor-not-allowed' : ''}"
                                    onclick="window.sellCommodityExchange('${itemName}', 1)" ${count === 0 ? 'disabled' : ''}>
                                    Sell
                                </button>
                            </div>
                        </div>
                    `;
                    marketGrid.appendChild(card);
                });
            }
        }
    }
}

// Global Wrappers
window.sellItemToShop = function (itemName) {
    if (sellItem && sellItem(itemName)) {
        updateShopUI();
        if(updateUI) updateUI(); 
    }
};

window.buyItemFromShop = function (itemName) {
    if (buyItem && buyItem(itemName)) {
        updateShopUI();
        if(updateUI) updateUI();
    }
};

window.orderItemFromShop = function (itemName) {
    if (orderItem && orderItem(itemName)) {
        updateShopUI();
        if(updateUI) updateUI();
    }
};

window.buyCommodityExchange = function (itemName, amount = 1) {
    if (buyCommodityExchange && buyCommodityExchange(itemName, amount)) {
        updateShopUI();
        if (updateUI) updateUI();
    }
};

window.sellCommodityExchange = function (itemName, amount = 1) {
    if (sellCommodityExchange && sellCommodityExchange(itemName, amount)) {
        updateShopUI();
        if (updateUI) updateUI();
    }
};

window.switchShopTab = switchShopTab;
