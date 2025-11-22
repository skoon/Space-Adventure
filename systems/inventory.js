/**
 * Inventory/Items System Module
 * Handles item usage in combat and inventory management
 */

// State object reference
let state;

// Dependencies
let addLog, updateCombatLog, updateCombatUI, updateUI;
let enemyTurn;
let items;

/**
 * Initialize the inventory module with required dependencies
 */
export function initInventory(deps) {
    // Store state object reference
    state = deps.state;

    // Data
    items = deps.data.items;

    // Functions
    addLog = deps.ui.addLog;
    updateCombatLog = deps.ui.updateCombatLog;
    updateCombatUI = deps.combat.updateCombatUI;
    updateUI = deps.ui.updateUI;
    enemyTurn = deps.combat.enemyTurn;
}

/**
 * Open combat item menu
 */
export function openCombatItemMenu() {
    const modal = document.getElementById("combatItemModal");
    const list = document.getElementById("combatItemList");
    if (!modal || !list) return;

    list.innerHTML = "";

    // Filter for consumable items in inventory
    const consumables = state.inventory.filter(itemName => {
        const item = items[itemName];
        return item && item.type === "consumable";
    });

    // Get unique items and counts
    const itemCounts = {};
    consumables.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
    });

    if (Object.keys(itemCounts).length === 0) {
        const div = document.createElement("div");
        div.className = "text-gray-400 italic text-center p-4";
        div.textContent = "No usable items.";
        list.appendChild(div);
    } else {
        Object.entries(itemCounts).forEach(([itemName, count]) => {
            const item = items[itemName];
            const button = document.createElement("button");
            button.className = "w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 flex justify-between items-center group transition-colors";
            button.onclick = () => useCombatItem(itemName);

            const content = `
                <div>
                    <div class="font-bold text-white group-hover:text-yellow-400 transition-colors">${itemName} x${count}</div>
                    <div class="text-xs text-gray-400">${item.description}</div>
                </div>
                <div class="text-green-400 font-bold bg-gray-800 px-3 py-1 rounded group-hover:bg-green-600 group-hover:text-white transition-colors">Use</div>
            `;
            button.innerHTML = content;
            list.appendChild(button);
        });
    }

    modal.style.display = "flex";
}

/**
 * Close combat item menu
 */
export function closeCombatItemMenu() {
    const modal = document.getElementById("combatItemModal");
    if (modal) {
        modal.style.display = "none";
    }
}

/**
 * Use a combat item
 */
export function useCombatItem(itemName) {
    if (!state.character || !state.enemy) return;

    const item = items[itemName];
    if (!item || item.type !== "consumable") return;

    // Remove 1 from inventory
    const index = state.inventory.indexOf(itemName);
    if (index === -1) return;
    state.inventory.splice(index, 1);

    // Apply effect
    if (item.effect === "heal") {
        const healAmount = item.value || 0;
        const oldHp = state.character.hp;
        state.character.hp = Math.min(state.character.maxHp, state.character.hp + healAmount);
        const healed = state.character.hp - oldHp;
        addLog(`💊 You used ${itemName} and recovered ${healed} HP.`);
    } else if (item.effect === "energy") {
        const energyAmount = item.value || 0;
        state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || 0) + energyAmount);
        addLog(`⚡ You used ${itemName} and restored ${energyAmount} Energy.`);
    } else {
        addLog(`You used ${itemName} but nothing happened.`);
    }

    updateCombatLog();
    updateCombatUI();
    closeCombatItemMenu();

    // Enemy turn
    setTimeout(enemyTurn, 500);
}
