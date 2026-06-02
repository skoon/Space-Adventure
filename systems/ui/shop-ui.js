/**
 * Shop UI Module
 * Handles shop interface and interactions
 */

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
    const buyContainer = document.getElementById("shopBuyContainer");
    const sellContainer = document.getElementById("shopSellContainer");

    if (buyTab && sellTab && buyContainer && sellContainer) {
        if (tab === 'buy') {
            buyTab.className = "px-6 py-2 text-yellow-500 border-b-2 border-yellow-500 font-bold bg-gray-700 rounded-t";
            sellTab.className = "px-6 py-2 text-gray-400 font-bold hover:text-white";
            buyContainer.classList.remove("hidden");
            sellContainer.classList.add("hidden");
        } else {
            sellTab.className = "px-6 py-2 text-yellow-500 border-b-2 border-yellow-500 font-bold bg-gray-700 rounded-t";
            buyTab.className = "px-6 py-2 text-gray-400 font-bold hover:text-white";
            sellContainer.classList.remove("hidden");
            buyContainer.classList.add("hidden");
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
            card.className = "bg-gray-700 p-3 rounded flex justify-between items-center";
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
                card.className = "bg-gray-700 p-3 rounded flex justify-between items-center";
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

window.switchShopTab = switchShopTab;
