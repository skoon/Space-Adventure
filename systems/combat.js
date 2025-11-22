/**
 * Combat System Module
 * Handles all combat-related functionality including player actions, enemy AI, and combat flow
 */

// State object that holds getters/setters
let state;

// Data and DOM references
let enemies, combatElements;

// Import functions from other modules
let addLog, updateCombatLog, showScreen, updateUI;
let getEffectiveStats, getCharacterAvatar, getStatusEffectIcon;
let gainXp, checkQuestProgress, showVictoryMessage, simulateExploration;

/**
 * Initialize the combat module with required dependencies
 */
export function initCombat(deps) {
    // Store state object reference (with getters/setters)
    state = deps.state;

    // Data
    enemies = deps.data.enemies;
    combatElements = deps.dom.combatElements;

    // Functions
    addLog = deps.ui.addLog;
    updateCombatLog = deps.ui.updateCombatLog;
    showScreen = deps.ui.showScreen;
    updateUI = deps.ui.updateUI;
    getEffectiveStats = deps.equipment.getEffectiveStats;
    getCharacterAvatar = deps.character.getCharacterAvatar;
    getStatusEffectIcon = deps.ui.getStatusEffectIcon;
    gainXp = deps.character.gainXp;
    checkQuestProgress = deps.quests.checkQuestProgress;
    showVictoryMessage = deps.ui.showVictoryMessage;
    simulateExploration = deps.exploration.simulateExploration;
}

/**
 * Process status effects at start of turn
 * Decrements duration and removes expired effects
 */
export function processStatusEffects() {
    state.playerStatusEffects = state.playerStatusEffects.map(effect => ({
        ...effect,
        duration: effect.duration - 1
    })).filter(effect => effect.duration > 0);

    state.enemyStatusEffects = state.enemyStatusEffects.map(effect => ({
        ...effect,
        duration: effect.duration - 1
    })).filter(effect => effect.duration > 0);
}

/**
 * Encounter a random enemy and start combat
 */
export function encounterEnemy() {
    const randomEnemy = { ...enemies[Math.floor(Math.random() * enemies.length)] };
    randomEnemy.hp = Math.floor(randomEnemy.hp * (0.8 + Math.random() * 0.4));
    randomEnemy.maxHp = randomEnemy.hp;

    state.enemy = randomEnemy;
    state.playerStatusEffects = [];
    state.enemyStatusEffects = [];
    state.gameState = "combat";
    showScreen("combat");
    updateCombatUI();
    addLog(`You encountered a ${state.enemy.name}!`);
}

/**
 * Update the combat UI with current stats
 */
export function updateCombatUI() {
    if (!state.character || !state.enemy) return;

    const activeDefenseBoost = state.playerStatusEffects.find(e => e.type === "defenseBoost");
    const effectiveDefense = state.character.defense + (activeDefenseBoost?.value || 0);
    const currentEnergy = state.character.energy ?? state.character.maxEnergy ?? 100;
    const maxEnergy = state.character.maxEnergy || 100;

    // Player stats
    if (combatElements.playerName) combatElements.playerName.textContent = state.character.name;
    if (combatElements.playerHp) combatElements.playerHp.textContent = state.character.hp;
    if (combatElements.playerMaxHp) combatElements.playerMaxHp.textContent = state.character.maxHp;
    const stats = getEffectiveStats();
    if (combatElements.playerAtk) combatElements.playerAtk.textContent = stats.attack;
    if (combatElements.playerDef) combatElements.playerDef.textContent = stats.defense;
    if (combatElements.playerEnergy) combatElements.playerEnergy.textContent = currentEnergy;
    if (combatElements.playerMaxEnergy) combatElements.playerMaxEnergy.textContent = maxEnergy;
    if (combatElements.playerAvatar) combatElements.playerAvatar.textContent = getCharacterAvatar(state.character.race, state.character.role);

    const combatHpPercentage = (state.character.hp / state.character.maxHp) * 100;
    if (combatElements.playerHpBar) combatElements.playerHpBar.style.width = `${combatHpPercentage}%`;

    const energyPercentage = (currentEnergy / maxEnergy) * 100;
    if (combatElements.playerEnergyBar) combatElements.playerEnergyBar.style.width = `${energyPercentage}%`;

    // Status effects
    if (combatElements.playerStatusEffects) {
        combatElements.playerStatusEffects.innerHTML = "";
        state.playerStatusEffects.forEach((effect, i) => {
            const span = document.createElement("span");
            span.className = "status-effect-icon";
            span.textContent = getStatusEffectIcon(effect.type);
            span.title = effect.type;
            combatElements.playerStatusEffects.appendChild(span);
        });
    }

    // Enemy stats
    if (combatElements.enemyName) combatElements.enemyName.textContent = state.enemy.name;
    if (combatElements.enemyHp) combatElements.enemyHp.textContent = state.enemy.hp;
    if (combatElements.enemyMaxHp) combatElements.enemyMaxHp.textContent = state.enemy.maxHp || state.enemy.hp;
    if (combatElements.enemyAtk) combatElements.enemyAtk.textContent = state.enemy.attack;
    if (combatElements.enemyDef) combatElements.enemyDef.textContent = state.enemy.defense;

    const enemyHpPercentage = ((state.enemy.maxHp || state.enemy.hp) > 0 ? state.enemy.hp / (state.enemy.maxHp || state.enemy.hp) : 0) * 100;
    if (combatElements.enemyHpBar) combatElements.enemyHpBar.style.width = `${enemyHpPercentage}%`;

    // Update special ability button
    const specialButton = document.getElementById("specialAbilityButton");
    if (specialButton) {
        specialButton.disabled = currentEnergy < 30;
        specialButton.className = `special-button ${currentEnergy >= 30 ? "" : "disabled-button"}`;
        // Update button text based on role
        if (state.character.role === "Warrior") {
            specialButton.textContent = "⭐ Power Strike";
        } else if (state.character.role === "Rogue") {
            specialButton.textContent = "⭐ Assassinate";
        } else if (state.character.role === "Scientist") {
            specialButton.textContent = "⭐ Shield Boost";
        }
    }
}

/**
 * Player performs a basic attack
 */
export function playerAttack() {
    if (!state.character || !state.enemy) return;
    processStatusEffects();

    // Critical hit chance (15% base, higher for Rogues)
    const critChance = state.character.role === "Rogue" ? 0.25 : 0.15;
    const isCritical = Math.random() < critChance;
    const critMultiplier = isCritical ? 2 : 1;

    // Check for attack buffs
    const stats = getEffectiveStats();
    const baseDamage = Math.max(0, stats.attack - state.enemy.defense);
    const damage = Math.floor(baseDamage * critMultiplier);
    state.enemy.hp -= damage;

    if (isCritical) {
        addLog(`💥 CRITICAL HIT! You hit the ${state.enemy.name} for ${damage} damage!`);
    } else {
        addLog(`You hit the ${state.enemy.name} for ${damage} damage.`);
    }
    updateCombatLog();

    if (state.enemy.hp <= 0) {
        winCombat();
    } else {
        enemyTurn();
    }

    updateCombatUI();
}

/**
 * Player blocks, reducing incoming damage by 50%
 */
export function playerBlock() {
    if (!state.character || !state.enemy) return;
    processStatusEffects();

    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "blocking"),
        { type: "blocking", duration: 1 }
    ];

    addLog("🛡️ You raise your guard, ready to block the next attack!");
    updateCombatLog();
    updateCombatUI();
    enemyTurn();
}

/**
 * Player dodges, 30% chance to avoid attack
 */
export function playerDodge() {
    if (!state.character || !state.enemy) return;
    processStatusEffects();

    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "dodging"),
        { type: "dodging", duration: 1 }
    ];

    addLog("💨 You prepare to dodge the next attack!");
    updateCombatLog();
    updateCombatUI();
    enemyTurn();
}

/**
 * Player uses role-specific special ability
 */
export function useSpecialAbility() {
    if (!state.character || !state.enemy) return;

    const energyCost = 30;
    const currentEnergy = state.character.energy ?? state.character.maxEnergy ?? 100;
    if (currentEnergy < energyCost) {
        addLog("⚠️ Not enough energy to use special ability!");
        updateCombatLog();
        return;
    }

    processStatusEffects();

    state.character.energy = Math.max(0, currentEnergy - energyCost);

    if (state.character.role === "Warrior") {
        // Power Strike - 1.5x damage
        const baseDamage = Math.max(0, state.character.attack - state.enemy.defense);
        const damage = Math.floor(baseDamage * 1.5);
        state.enemy.hp -= damage;

        addLog(`⚔️ POWER STRIKE! You unleash a devastating blow for ${damage} damage!`);
        updateCombatLog();

        if (state.enemy.hp <= 0) {
            winCombat();
        } else {
            enemyTurn();
        }
    } else if (state.character.role === "Rogue") {
        // Guaranteed Critical Hit - 2.5x damage
        const baseDamage = Math.max(0, state.character.attack - state.enemy.defense);
        const damage = Math.floor(baseDamage * 2.5);
        state.enemy.hp -= damage;

        addLog(`🗡️ ASSASSINATE! You strike a critical weak point for ${damage} damage!`);
        updateCombatLog();

        if (state.enemy.hp <= 0) {
            winCombat();
        } else {
            enemyTurn();
        }
    } else if (state.character.role === "Scientist") {
        // Shield Boost - temporary defense increase
        state.playerStatusEffects = [
            ...state.playerStatusEffects.filter(e => e.type !== "defenseBoost"),
            { type: "defenseBoost", value: 5, duration: 3 }
        ];
        addLog("🔬 You activate a defensive shield! Defense increased for 3 turns.");
        updateCombatLog();
        enemyTurn();
    }

    updateCombatUI();
}

/**
 * Enemy's turn to attack
 */
export function enemyTurn() {
    if (!state.character || !state.enemy) return;

    // Check if player is dodging
    const isDodging = state.playerStatusEffects.some(e => e.type === "dodging");
    if (isDodging) {
        const dodgeSuccess = Math.random() < 0.3; // 30% chance
        if (dodgeSuccess) {
            addLog(`💨 You successfully dodged ${state.enemy.name}'s attack!`);
            updateCombatLog();
            // Regenerate energy
            state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || state.character.maxEnergy) + 5);
            updateCombatUI();
            return;
        } else {
            addLog(`💨 You tried to dodge but ${state.enemy.name} still hit you!`);
            updateCombatLog();
        }
    }

    // Check if player is blocking
    const isBlocking = state.playerStatusEffects.some(e => e.type === "blocking");
    const stats = getEffectiveStats();
    let damage = Math.max(0, state.enemy.attack - stats.defense);

    if (isBlocking) {
        damage = Math.floor(damage * 0.5); // 50% damage reduction
        addLog(`🛡️ You blocked ${state.enemy.name}'s attack, reducing damage!`);
        updateCombatLog();
    }

    state.character.hp -= damage;

    addLog(`${state.enemy.name} hits you for ${damage} damage.`);
    updateCombatLog();

    // Regenerate energy (5 per turn)
    state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || state.character.maxEnergy) + 5);

    if (state.character.hp <= 0) {
        addLog("You have been defeated...");
        state.gameState = "defeat";
        showScreen("defeat");
    }

    updateCombatUI();
    updateUI();
}

/**
 * Handle combat victory
 */
export function winCombat() {
    if (!state.enemy) return; // Safety check

    const enemyName = state.enemy.name;
    const xpGained = Math.floor(state.enemy.attack * 2 + state.enemy.defense * 3);
    const loot = ["Energy Cell", "Alien Crystal", "Data Chip"][Math.floor(Math.random() * 3)];

    // Clear enemy immediately to prevent further interactions
    state.enemy = null;

    // Restore energy on victory
    state.character.energy = state.character.maxEnergy;

    // Gain XP
    gainXp(xpGained);

    // Check Quest Progress
    checkQuestProgress("kill", enemyName, 1);

    // Add loot
    state.inventory.push(loot);

    addLog(`You defeated the ${enemyName}!`);
    addLog(`You gained ${xpGained} XP and found a ${loot}.`);

    // Show victory message
    showVictoryMessage(`Victory! ${enemyName} defeated!`);

    state.gameState = "exploring";
    showScreen("exploring");
    updateUI();
    simulateExploration();
}
