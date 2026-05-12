/**
 * Deep Space Derelicts System Module
 * Handles the logic for exploring derelict ships during travel
 */

let state;
let deps;
let addLog, updateUI, showScreen, gainXp, checkQuestProgress;

export function initDerelict(dependencies) {
    deps = dependencies;
    state = deps.state;

    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showScreen = deps.ui.showScreen;
    gainXp = deps.character.gainXp;
    checkQuestProgress = deps.quests.checkQuestProgress;
}

/**
 * Start a new derelict run
 */
export function startDerelictRun(destination) {
    const maxOxygen = 10 + Math.floor(Math.random() * 6); // 10-15 Oxygen
    
    state.derelict = {
        active: true,
        oxygen: maxOxygen,
        maxOxygen: maxOxygen,
        roomsExplored: 0,
        currentLoot: [],
        destination: destination
    };

    state.previousGameState = state.gameState;
    state.gameState = "derelict";
    
    addLog("🚨 DISTRESS SIGNAL INTERCEPTED 🚨");
    addLog(`You docked with a derelict vessel. Life support is offline. You have ${maxOxygen} units of oxygen.`);
    
    // Switch to derelict UI (handled in ui.js later)
    if (deps.ui.showDerelictScreen) {
        deps.ui.showDerelictScreen();
    }
}

/**
 * Explore deeper into the derelict
 */
export function exploreRoom() {
    if (!state.derelict || !state.derelict.active) return;

    if (state.derelict.oxygen <= 0) {
        failRun();
        return;
    }

    // Deduct oxygen
    state.derelict.oxygen -= 1;
    state.derelict.roomsExplored += 1;

    addLog(`Venturing deeper... (Oxygen: ${state.derelict.oxygen}/${state.derelict.maxOxygen})`);

    // Check failure immediately if oxygen runs out during the step
    if (state.derelict.oxygen <= 0) {
        addLog("⚠️ Oxygen depleted! You are suffocating!");
        failRun();
        return;
    }

    // Roll Event
    const roll = Math.random();
    
    // Depth modifiers: combat gets harder/more frequent, loot gets better
    const depthBonus = state.derelict.roomsExplored * 0.02;

    if (roll < 0.40 + depthBonus) {
        // 40% Combat (Increases with depth)
        triggerCombat();
    } else if (roll < 0.70) {
        // 30% Loot
        findLoot();
    } else if (roll < 0.90) {
        // 20% Hazard
        triggerHazard();
    } else {
        // 10% Empty Room
        addLog("The room is empty save for floating debris.");
    }

    updateUI();
}

function triggerCombat() {
    // Save current location momentarily to force derelict enemies
    const originalLocation = state.currentLocation;
    state.currentLocation = "derelict";
    
    // We encounter enemy using standard combat system
    if (deps.combat && deps.combat.encounterEnemy) {
        addLog("⚠️ Hostiles detected!");
        deps.combat.encounterEnemy();
    }
    
    // Restore location
    state.currentLocation = originalLocation;
}

function findLoot() {
    // Base items
    const baseLoot = ["Scrap Metal", "Energy Cell", "Data Chip", "Rusty Pipe"];
    // High tier items (Higher chance with depth)
    const highTierLoot = ["Titanium Ingot", "Plasma Core", "Circuit Board", "Nanites", "Quantum Chip"];
    
    let isHighTier = Math.random() < (0.1 + (state.derelict.roomsExplored * 0.05));
    const lootPool = isHighTier ? highTierLoot : baseLoot;
    const item = lootPool[Math.floor(Math.random() * lootPool.length)];
    
    state.derelict.currentLoot.push(item);
    addLog(`📦 You secured a ${item}!`);
}

function triggerHazard() {
    const damage = 5 + Math.floor(Math.random() * 10) + state.derelict.roomsExplored;
    state.character.hp -= damage;
    addLog(`💥 A plasma conduit ruptured! You took ${damage} damage.`);
    
    if (state.character.hp <= 0) {
        addLog("You succumbed to your injuries inside the derelict...");
        state.gameState = "defeat";
        showScreen("defeat");
    }
}

/**
 * Escape with the loot
 */
export function escapeShip() {
    if (!state.derelict || !state.derelict.active) return;

    const lootCount = state.derelict.currentLoot.length;
    
    // Transfer loot
    state.derelict.currentLoot.forEach(item => {
        state.inventory.push(item);
    });

    addLog(`🚀 You escaped the derelict and returned to your ship with ${lootCount} items!`);
    
    finishRun();
}

/**
 * Fail run due to lack of oxygen
 */
export function failRun() {
    if (!state.derelict || !state.derelict.active) return;

    // HP Damage penalty
    const damage = Math.floor(state.character.maxHp * 0.25); // 25% max HP damage
    state.character.hp = Math.max(1, state.character.hp - damage); // Leave at 1 HP min
    
    addLog(`☠️ You passed out from lack of oxygen! The ship's emergency recall pulled you out, but you lost all secured loot and took ${damage} damage!`);

    finishRun();
}

function finishRun() {
    const destination = state.derelict.destination;
    
    state.derelict.active = false;
    state.derelict.currentLoot = [];
    
    // Complete the original travel
    state.currentLocation = destination.id;
    addLog(`🚀 Resuming travel to ${destination.name}...`);
    addLog(`ARRIVAL: ${destination.description}`);
    
    // Trigger medbay healing from ship.js
    if (deps.ship && deps.ship.getMedbayHealAmount) {
        const heal = deps.ship.getMedbayHealAmount();
        if (heal > 0 && state.character.hp < state.character.maxHp) {
            const oldHp = state.character.hp;
            state.character.hp = Math.min(state.character.maxHp, state.character.hp + heal);
            addLog(`🩺 Medbay healed you for ${state.character.hp - oldHp} HP during travel.`);
        }
    }

    state.gameState = "exploring";
    showScreen("exploring");
    updateUI();
}
