/**
 * Inventory UI Module
 * Handles inventory display and item interactions
 */

import { addLog } from './logger.js';

let state;
let renderCache;
let inventoryElement;
let items;
let applyQuestItem;
let equipItem;
let useHealItem;
let updateUI; 

export function initInventoryUI(deps, cache, uiUpdateFn) {
    state = deps.state;
    renderCache = cache;
    inventoryElement = deps.dom.inventoryElement;
    items = deps.data.items;
    
    if (deps.quests) applyQuestItem = deps.quests.applyQuestItem;
    if (deps.equipment) equipItem = deps.equipment.equipItem;
    if (deps.character) useHealItem = deps.character.useHealItem;
    
    updateUI = uiUpdateFn;
}

/**
 * Update inventory display
 */
export function updateInventory() {
    if (!inventoryElement) return;
    
    const inventorySig = JSON.stringify(state.inventory);
    
    if (renderCache.inventory === inventorySig) {
        updateHealButton();
        return;
    }
    
    renderCache.inventory = inventorySig;
    inventoryElement.innerHTML = "";
    
    // Count items
    const itemCounts = {};
    state.inventory.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
    
    // Group by category
    const categorized = {
        equipment: [],
        consumable: [],
        material: [],
        other: []
    };
    
    Object.entries(itemCounts).forEach(([itemName, count]) => {
        const item = items[itemName];
        const category = item?.category || 'other';
        if (categorized[category]) {
            categorized[category].push({ name: itemName, count, item });
        } else {
            categorized['other'].push({ name: itemName, count, item });
        }
    });
    
    // Render by category
    ['equipment', 'consumable', 'material', 'other'].forEach(cat => {
        if (categorized[cat].length > 0) {
            const header = document.createElement('div');
            header.className = 'text-xs font-bold text-gray-400 mt-2 mb-1 uppercase tracking-wider';
            header.textContent = cat;
            inventoryElement.appendChild(header);
            
            categorized[cat].forEach(({ name, count, item }) => {
                const button = createInventoryItemButton(name, count, item);
                inventoryElement.appendChild(button);
            });
        }
    });
    
    updateHealButton();
}

/**
 * Update heal button state
 */
export function updateHealButton() {
    const healButton = document.getElementById("healButton");
    if (healButton) {
        const hasHeal = state.inventory.includes("Energy Cell") && state.character?.hp < state.character?.maxHp;
        if (healButton.disabled !== !hasHeal) {
             healButton.disabled = !hasHeal;
             healButton.className = `heal-button ${hasHeal ? "" : "disabled-button"}`;
        }
    }
}

/**
 * Create inventory item button with tooltip
 */
export function createInventoryItemButton(itemName, count, item) {
    const button = document.createElement("button");
    
    let borderClass = "border-gray-600";
    let textClass = "text-gray-200";
    let bgHoverClass = "hover:bg-gray-600";
    let bgClass = "bg-gray-700";
    let glowClass = "";
    let tooltipHeaderColor = "text-yellow-400";
    
    if (item && item.rarity) {
        if (item.rarity === "Rare") {
            borderClass = "border-blue-500/50";
            textClass = "text-blue-300 font-semibold";
            bgClass = "bg-blue-950/20";
            bgHoverClass = "hover:bg-blue-900/30";
            tooltipHeaderColor = "text-blue-400";
        } else if (item.rarity === "Epic") {
            borderClass = "border-purple-500/50";
            textClass = "text-purple-300 font-semibold";
            bgClass = "bg-purple-950/20";
            bgHoverClass = "hover:bg-purple-900/30";
            tooltipHeaderColor = "text-purple-400";
        } else if (item.rarity === "Legendary") {
            borderClass = "border-yellow-500/50";
            textClass = "text-yellow-400 font-bold";
            bgClass = "bg-yellow-950/20";
            bgHoverClass = "hover:bg-yellow-900/30";
            glowClass = "shadow-[0_0_8px_rgba(234,179,8,0.25)]";
            tooltipHeaderColor = "text-yellow-500";
        }
    }
    
    button.className = `inventory-item relative group w-full text-left ${bgClass} ${bgHoverClass} border ${borderClass} rounded p-2 mb-1 flex justify-between items-center ${glowClass}`;
    
    // Display name with count
    const nameSpan = document.createElement('span');
    nameSpan.className = `text-sm ${textClass}`;
    nameSpan.textContent = itemName;
    button.appendChild(nameSpan);
    
    if (count > 1) {
        const countBadge = document.createElement('span');
        countBadge.className = 'text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full';
        countBadge.textContent = `×${count}`;
        button.appendChild(countBadge);
    }
    
    // Tooltip Container
    const tooltip = document.createElement('div');
    tooltip.className = 'hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-500 rounded shadow-xl z-50 w-48 text-left pointer-events-none';
    
    // Desktop Hover
    button.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: hover)').matches) {
            tooltip.classList.remove('hidden');
        }
    });
    button.addEventListener('mouseleave', () => {
        if (window.matchMedia('(hover: hover)').matches) {
            tooltip.classList.add('hidden');
        }
    });

    let tooltipHtml = `<div class="font-bold ${tooltipHeaderColor} text-sm border-b border-gray-700 pb-1 mb-1">${itemName}</div>`;
    tooltipHtml += `<div class="text-xs text-gray-400 mb-1 italic">${item?.type || 'Item'}</div>`;
    tooltipHtml += `<div class="text-xs text-gray-300">${item?.description || 'No description'}</div>`;
    
    if (item?.stats) {
        tooltipHtml += '<div class="text-xs text-green-400 mt-1 flex flex-col gap-0.5">';
        if (item.stats.attack) tooltipHtml += `<span>⚔️ ATK +${item.stats.attack}</span>`;
        if (item.stats.defense) tooltipHtml += `<span>🛡️ DEF +${item.stats.defense}</span>`;
        tooltipHtml += '</div>';
    }
    
    if (item?.effect && item?.value) {
        tooltipHtml += `<div class="text-xs text-blue-400 mt-1">❤️ Restores ${item.value} HP</div>`;
    }
    
    if (item?.price) {
        tooltipHtml += `<div class="text-xs text-yellow-600 mt-2 text-right">Value: ${Math.floor(item.price/2)} cr</div>`;
    }
    
    tooltip.innerHTML = tooltipHtml;
    button.appendChild(tooltip);
    
    // Click handler for using items
    button.onclick = (e) => {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        if (isTouch && tooltip.classList.contains('hidden')) {
            document.querySelectorAll('.inventory-item > div:not(.hidden)').forEach(el => el.classList.add('hidden'));
            tooltip.classList.remove('hidden');
            e.stopPropagation();
            return;
        }
        
        if (isTouch) tooltip.classList.add('hidden');

        if (item && ["weapon", "armor", "accessory"].includes(item.type)) {
            if (equipItem) equipItem(itemName);
        } else if (applyQuestItem) {
            const applied = applyQuestItem(itemName);
            if (!applied) {
                if (item?.effect === 'heal') {
                     if (useHealItem) useHealItem(itemName);
                } else {
                    addLog(`Cannot use ${itemName} right now.`);
                }
            } else {
                if (updateUI) updateUI();
            }
        }
    };
    
    return button;
}
