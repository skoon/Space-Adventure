/**
 * Inventory/Items System Module
 * Handles item usage in combat and inventory management
 */

// State object reference
let state;

// Dependencies
let addLog, updateCombatLog, updateCombatUI, updateUI;
let enemyTurn, dealStaggerDamage, checkPhaseTransition, winCombat;
let items;

import { getPassiveBonus } from './skills.js';

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
    dealStaggerDamage = deps.combat.dealStaggerDamage;
    checkPhaseTransition = deps.combat.checkPhaseTransition;
    winCombat = deps.combat.winCombat;
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

    const isSkirmisher = state.combatStance === "Skirmisher";
    const apCost = isSkirmisher ? 0 : 1;
    if (state.character.ap < apCost) return;

    // Remove 1 from inventory
    const index = state.inventory.indexOf(itemName);
    if (index === -1) return;
    
    state.character.ap -= apCost;
    state.inventory.splice(index, 1);

    // Apply effect
    if (item.effect === "heal") {
        const healMultiplier = 1 + getPassiveBonus('healMultiplier');
        const healAmount = Math.floor((item.value || 0) * healMultiplier);
        const oldHp = state.character.hp;
        state.character.hp = Math.min(state.character.maxHp, state.character.hp + healAmount);
        const healed = state.character.hp - oldHp;
        addLog(`💊 You used ${itemName} and recovered ${healed} HP.`);
    } else if (item.effect === "energy") {
        const energyAmount = item.value || 0;
        state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || 0) + energyAmount);
        addLog(`⚡ You used ${itemName} and restored ${energyAmount} Energy.`);
    } else if (item.effect === "damage") {
        const dmg = item.value || 0;
        const staggerVal = item.stagger || 0;

        // Apply stagger
        if (staggerVal > 0 && dealStaggerDamage) {
            dealStaggerDamage(staggerVal);
        }

        // Apply status effect if any
        if (item.applyStatus && state.enemyStatusEffects) {
            const statusType = item.applyStatus.toLowerCase();
            const existing = state.enemyStatusEffects.find(e => e.type === statusType);
            if (!existing) {
                if (statusType === "electrified") {
                    state.enemyStatusEffects.push({ type: "electrified", duration: 3 });
                    addLog(`⚡ ${state.enemy.name} is Electrified!`);
                } else if (statusType === "frozen") {
                    state.enemyStatusEffects.push({ type: "frozen", duration: 3 });
                    addLog(`❄️ ${state.enemy.name} is Frozen!`);
                } else if (statusType === "melted") {
                    state.enemyStatusEffects.push({ type: "melted", duration: 3 });
                    addLog(`🧪 ${state.enemy.name} is Melted!`);
                } else if (statusType === "burning") {
                    state.enemyStatusEffects.push({ type: "burning", damage: 8, duration: 3 });
                    addLog(`🔥 ${state.enemy.name} is Burning!`);
                }
            }
        }

        // Check broken double damage
        let finalDmg = dmg;
        if (state.enemyStatusEffects && state.enemyStatusEffects.some(e => e.type === "broken")) {
            finalDmg *= 2;
            addLog("💥 VULNERABILITY! 2x damage dealt to Broken enemy!");
        }

        state.enemy.hp = Math.max(0, state.enemy.hp - finalDmg);
        addLog(`💥 You threw ${itemName} dealing ${finalDmg} damage to ${state.enemy.name}!`);

        if (checkPhaseTransition) checkPhaseTransition();

        if (state.enemy.hp <= 0 && winCombat) {
            winCombat();
            closeCombatItemMenu();
            return;
        }
    } else {
        addLog(`You used ${itemName} but nothing happened.`);
    }

    updateCombatLog();
    updateCombatUI();
    closeCombatItemMenu();

    if (state.character.ap <= 0) {
        setTimeout(enemyTurn, 500);
    }
}
