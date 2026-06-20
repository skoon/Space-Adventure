/**
 * Market System Module
 * Handles dynamic commodities exchange prices, trends, history, and news events.
 */

let state;
let addLog, updateUI;

export const BASE_COMMODITIES = {
    "Scrap Metal": 20,
    "Titanium Ingot": 600,
    "Plasma Core": 1200,
    "Circuit Board": 300,
    "Carbon Nanotubes": 800,
    "Quantum Chip": 1500,
    "Alien Crystal": 200,
    "Cargo Container": 400
};

export const NEWS_EVENTS = [
    {
        id: "stable",
        headline: "Galactic commodities markets remain stable and calm.",
        multipliers: {}
    },
    {
        id: "syndicate_blockade",
        headline: "BREAKING: Federation blockades Photon Prime Syndicate outposts! Tech shortages expected.",
        multipliers: {
            "Quantum Chip": [1.4, 1.8],
            "Circuit Board": [1.3, 1.6]
        }
    },
    {
        id: "solar_flare",
        headline: "ALERT: Solar radiation storm disrupts energy power grid in sector!",
        multipliers: {
            "Plasma Core": [1.3, 1.5]
        }
    },
    {
        id: "mining_boom",
        headline: "COMMERCE: Major Titanium mining boom reported on Inferno-IX! Prices drop.",
        multipliers: {
            "Titanium Ingot": [0.6, 0.8]
        }
    },
    {
        id: "alien_ruin",
        headline: "DISCOVERY: Ancient alien archive unburied on Crio-Prime! Data chips flood the market.",
        multipliers: {
            "Alien Crystal": [1.3, 1.6]
        }
    },
    {
        id: "pirate_raids",
        headline: "WARNING: Void Corsair pirate raids target cargo vessels near Xylo Delta!",
        multipliers: {
            "Cargo Container": [1.3, 1.6],
            "Scrap Metal": [1.2, 1.4]
        }
    }
];

export function initMarket(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;

    initializeMarketState();
}

export function initializeMarketState() {
    if (!state) return;
    if (!state.market) {
        state.market = {
            prices: { ...BASE_COMMODITIES },
            history: {},
            news: "Market stable. No recent disruptions."
        };
        
        // Initialize history with 5 ticks of base prices
        Object.keys(BASE_COMMODITIES).forEach(itemName => {
            state.market.history[itemName] = Array(5).fill(BASE_COMMODITIES[itemName]);
        });
    }
}

/**
 * Update market prices and roll a new news event
 */
export function rollMarketEvent() {
    if (!state) return;
    initializeMarketState();

    // Select a random news event
    const event = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
    state.market.news = event.headline;

    if (addLog) {
        addLog(`📰 NEWS: ${event.headline}`);
    }

    // Update prices for all commodities
    Object.keys(BASE_COMMODITIES).forEach(itemName => {
        const basePrice = BASE_COMMODITIES[itemName];
        let multRange = event.multipliers[itemName];
        
        let multiplier = 1.0;
        if (multRange) {
            multiplier = multRange[0] + Math.random() * (multRange[1] - multRange[0]);
        } else {
            // General market fluctuation: ±8%
            multiplier = 0.92 + Math.random() * 0.16;
        }

        // Apply price change
        const newPrice = Math.max(5, Math.floor(basePrice * multiplier));
        state.market.prices[itemName] = newPrice;

        // Push to history, maintaining last 5 entries
        if (!state.market.history[itemName]) {
            state.market.history[itemName] = Array(5).fill(basePrice);
        }
        state.market.history[itemName].push(newPrice);
        if (state.market.history[itemName].length > 5) {
            state.market.history[itemName].shift();
        }
    });

    if (updateUI) {
        updateUI();
    }
}

/**
 * Buy commodity directly from the Commodities Exchange
 */
export function buyCommodityExchange(itemName, amount = 1) {
    if (!state) return false;
    initializeMarketState();
    
    if (!state.market.prices[itemName]) return false;
    
    const price = state.market.prices[itemName];
    const totalPrice = price * amount;

    if (state.character.credits < totalPrice) {
        if (addLog) {
            addLog(`❌ Not enough credits! Cost: ${totalPrice}, You have: ${state.character.credits}`);
        }
        return false;
    }

    state.character.credits -= totalPrice;
    for (let i = 0; i < amount; i++) {
        state.inventory.push(itemName);
    }
    
    if (addLog) {
        addLog(`📈 Commodities Exchange: Purchased ${amount}x ${itemName} for ${totalPrice} credits.`);
    }
    if (updateUI) {
        updateUI();
    }
    return true;
}

/**
 * Sell commodity directly to the Commodities Exchange
 */
export function sellCommodityExchange(itemName, amount = 1) {
    if (!state) return false;
    initializeMarketState();
    
    if (!state.market.prices[itemName]) return false;

    // Count how many we have in inventory
    let count = 0;
    state.inventory.forEach(item => {
        if (item === itemName) count++;
    });

    if (count < amount) {
        if (addLog) {
            addLog(`❌ You don't have ${amount}x ${itemName} in your inventory!`);
        }
        return false;
    }

    const price = state.market.prices[itemName];
    const totalPrice = price * amount;

    // Remove from inventory
    for (let i = 0; i < amount; i++) {
        const idx = state.inventory.indexOf(itemName);
        if (idx > -1) state.inventory.splice(idx, 1);
    }

    state.character.credits += totalPrice;
    if (addLog) {
        addLog(`📉 Commodities Exchange: Sold ${amount}x ${itemName} for ${totalPrice} credits.`);
    }
    if (updateUI) {
        updateUI();
    }
    return true;
}
