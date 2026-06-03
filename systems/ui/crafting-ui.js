/**
 * Crafting & Upgrades UI Module
 * Handles crafting interface and equipment upgrades UI
 */

let state;
let items;

export function initCraftingUI(deps) {
    state = deps.state;
    items = deps.data.items;
}

/**
 * Show crafting screen
 */
export function showCraftingUI() {
    // Remove existing if any
    const existing = document.getElementById('craftingModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'craftingModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-purple-500 rounded-lg max-w-4xl w-full p-6 relative shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <button onclick="document.getElementById('craftingModal').remove()" 
                    class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold">&times;</button>
            
            <h2 class="text-3xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                <span>🔨</span> Crafting Station
            </h2>

            <!-- Tabs -->
            <div class="flex border-b border-gray-700 mb-6 gap-2">
                <button id="tabCraft" onclick="window.switchCraftingTab('craft')" 
                        class="py-2 px-4 border-b-2 border-purple-500 text-purple-400 font-bold transition-all text-sm">
                    Craft Items
                </button>
                <button id="tabUpgrade" onclick="window.switchCraftingTab('upgrade')" 
                        class="py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm">
                    Upgrade Equipment
                </button>
            </div>
            
            <div id="recipeList" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2"></div>
            <div id="upgradePanel" class="hidden grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    updateCraftingUI();
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * Update crafting UI content
 */
export function updateCraftingUI() {
    const list = document.getElementById('recipeList');
    if (!list) return;
    
    list.innerHTML = '';
    
    const knownRecipes = state.character.knownRecipes || {};
    
    if (Object.keys(knownRecipes).length === 0) {
        list.innerHTML = '<div class="col-span-2 text-center text-gray-500 italic p-8">No recipes known yet. Explore the galaxy to discover crafting schematics!</div>';
        return;
    }
    
    Object.entries(knownRecipes).forEach(([id, recipe]) => {
        // Check materials
        let canCraft = true;
        const currentMaterials = {};
        state.inventory.forEach(i => currentMaterials[i] = (currentMaterials[i] || 0) + 1);
        
        let reqHtml = '';
        Object.entries(recipe.requires).forEach(([mat, amt]) => {
            const have = currentMaterials[mat] || 0;
            if (have < amt) canCraft = false;
            
            reqHtml += `<div class="flex justify-between text-xs mb-1">
                <span class="text-gray-300">${mat}</span>
                <span class="${have >= amt ? 'text-green-400' : 'text-red-400'} font-mono">${have}/${amt}</span>
            </div>`;
        });
        
        const card = document.createElement("div");
        card.className = `bg-gray-700 p-4 rounded border-l-4 ${canCraft ? 'border-green-500' : 'border-gray-600 opacity-75'}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="font-bold text-yellow-400 text-lg">${recipe.name}</div>
                ${canCraft ? '<span class="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Ready</span>' : ''}
            </div>
            <div class="text-sm text-gray-400 mb-3 italic">${recipe.description}</div>
            
            <div class="bg-gray-800 p-3 rounded mb-3">
                <div class="text-xs font-bold text-gray-500 uppercase mb-2">Required Materials</div>
                ${reqHtml}
            </div>
            
            <button onclick="window.craftItemFromUI('${id}')" 
                    class="w-full py-2 px-4 rounded font-bold transition-colors ${canCraft ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
                    ${!canCraft ? 'disabled' : ''}>
                ${canCraft ? 'Combine Materials' : 'Missing Materials'}
            </button>
        `;
        list.appendChild(card);
    });
}

/**
 * Update Upgrade UI panel contents
 */
export function updateUpgradeUI() {
    const list = document.getElementById('upgradePanel');
    if (!list) return;
    
    list.innerHTML = '';
    
    const ownedEquip = [];

    // 1. Equipped Items
    if (state.character && state.character.equipment) {
        Object.entries(state.character.equipment).forEach(([slot, itemName]) => {
            if (itemName) {
                ownedEquip.push({
                    container: 'equipment',
                    key: slot,
                    name: itemName,
                    equipped: true,
                    item: items[itemName]
                });
            }
        });
    }

    // 2. Inventory Items
    if (state.inventory) {
        state.inventory.forEach((itemName, index) => {
            const item = items[itemName];
            if (item && ["weapon", "armor", "accessory"].includes(item.type)) {
                ownedEquip.push({
                    container: 'inventory',
                    key: index,
                    name: itemName,
                    equipped: false,
                    item: item
                });
            }
        });
    }

    if (ownedEquip.length === 0) {
        list.innerHTML = '<div class="col-span-2 text-center text-gray-500 italic p-8 font-semibold">No upgradeable equipment found in inventory or equipped slots.</div>';
        return;
    }

    // Import dynamic upgrades module
    import('../upgrades.js').then(upgradesModule => {
        ownedEquip.forEach(eq => {
            const reqs = upgradesModule.getUpgradeRequirements(eq.name);
            const isMax = reqs === null;

            // Stat diff display
            let statDiffHtml = '';
            if (eq.item && eq.item.stats) {
                Object.entries(eq.item.stats).forEach(([stat, val]) => {
                    const icon = stat === 'attack' ? '⚔️ ATK' : '🛡️ DEF';
                    if (isMax) {
                        statDiffHtml += `<div class="text-xs text-gray-400">${icon}: +${val} (MAX)</div>`;
                    } else {
                        // calculate next level stat
                        let nextVal = val;
                        if (eq.item.type === "weapon") nextVal += 2;
                        else if (eq.item.type === "armor") nextVal += 2;
                        else if (eq.item.type === "accessory") nextVal += 1;
                        statDiffHtml += `<div class="text-xs text-cyan-300">${icon}: +${val} <span class="text-green-400 font-bold">➜ +${nextVal}</span></div>`;
                    }
                });
            }

            let costHtml = '';
            let canUpgrade = false;
            if (!isMax && reqs) {
                canUpgrade = true;
                let reqMatsHtml = '';
                const currentMaterials = {};
                state.inventory.forEach(i => currentMaterials[i] = (currentMaterials[i] || 0) + 1);

                // Check credits
                const hasCredits = state.character.credits >= reqs.credits;
                if (!hasCredits) canUpgrade = false;

                reqMatsHtml += `<div class="flex justify-between text-xs mb-1">
                    <span class="text-gray-300">Credits</span>
                    <span class="${hasCredits ? 'text-green-400' : 'text-red-400'} font-mono">${state.character.credits}/${reqs.credits} cr</span>
                </div>`;

                Object.entries(reqs.materials).forEach(([mat, amt]) => {
                    const have = currentMaterials[mat] || 0;
                    if (have < amt) canUpgrade = false;

                    reqMatsHtml += `<div class="flex justify-between text-xs mb-1">
                        <span class="text-gray-300">${mat}</span>
                        <span class="${have >= amt ? 'text-green-400' : 'text-red-400'} font-mono">${have}/${amt}</span>
                    </div>`;
                });

                costHtml = `
                    <div class="bg-gray-800 p-3 rounded mb-3 mt-2">
                        <div class="text-xs font-bold text-gray-500 uppercase mb-2">Upgrade Requirements</div>
                        ${reqMatsHtml}
                    </div>
                `;
            }

            const currentLevel = reqs ? reqs.currentLevel : 5;
            const card = document.createElement("div");
            card.className = `bg-gray-700 p-4 rounded border-l-4 ${isMax ? 'border-yellow-500 opacity-80' : (canUpgrade ? 'border-green-500' : 'border-gray-600')}`;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <div>
                        <span class="font-bold text-yellow-400 text-base">${eq.name}</span>
                        ${eq.equipped ? '<span class="text-[10px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-wider">Equipped</span>' : ''}
                    </div>
                    <span class="text-xs font-mono text-gray-400">Level: ${currentLevel}/5</span>
                </div>
                <div class="text-xs text-gray-400 mb-2 italic">${eq.item?.description || 'No description'}</div>
                
                <div class="flex flex-col gap-0.5 mb-2 bg-gray-800 p-2 rounded">
                    ${statDiffHtml}
                </div>

                ${costHtml}

                ${!isMax ? `
                    <button onclick="window.upgradeItemFromUI('${eq.container}', '${eq.key}')"
                            class="w-full py-2 px-4 rounded font-bold transition-colors ${canUpgrade ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
                            ${!canUpgrade ? 'disabled' : ''}>
                        ${canUpgrade ? `Upgrade to +${reqs.nextLevel}` : 'Lacking Resources'}
                    </button>
                ` : `
                    <button class="w-full py-2 px-4 rounded font-bold bg-yellow-600 text-yellow-100 cursor-not-allowed" disabled>
                        MAX LEVEL REACHED
                    </button>
                `}
            `;
            list.appendChild(card);
        });
    });
}

// Global switch tab helper
window.switchCraftingTab = function(tab) {
    const tabCraft = document.getElementById('tabCraft');
    const tabUpgrade = document.getElementById('tabUpgrade');
    const recipeList = document.getElementById('recipeList');
    const upgradePanel = document.getElementById('upgradePanel');
    
    if (!tabCraft || !tabUpgrade || !recipeList || !upgradePanel) return;

    if (tab === 'craft') {
        recipeList.classList.remove('hidden');
        upgradePanel.classList.add('hidden');
        
        tabCraft.className = "py-2 px-4 border-b-2 border-purple-500 text-purple-400 font-bold transition-all text-sm";
        tabUpgrade.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        
        updateCraftingUI();
    } else if (tab === 'upgrade') {
        recipeList.classList.add('hidden');
        upgradePanel.classList.remove('hidden');
        
        tabUpgrade.className = "py-2 px-4 border-b-2 border-purple-500 text-purple-400 font-bold transition-all text-sm";
        tabCraft.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        
        updateUpgradeUI();
    }
};

// Global helper for actions
window.craftItemFromUI = function(recipeId) {
    import('../crafting.js').then(m => {
        if (m.craftItem(recipeId)) {
            updateCraftingUI(); // Refresh list
        }
    });
};

window.upgradeItemFromUI = function(container, key) {
    const parsedKey = isNaN(key) ? key : parseInt(key, 10);
    import('../upgrades.js').then(m => {
        if (m.upgradeItem(container, parsedKey)) {
            updateUpgradeUI(); // Refresh list
        }
    });
};
