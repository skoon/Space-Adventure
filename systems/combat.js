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
let getDifficulty;

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
    getDifficulty = deps.settings.getDifficulty;
}

/**
 * Process status effects at start of turn
 * Decrements duration and removes expired effects
 */
export function processStatusEffects() {
    // Process DOTs before decrementing duration
    state.playerStatusEffects.forEach(effect => {
        if (effect.type === 'poison') {
            state.character.hp -= effect.damage;
            addLog(`☠️ Poison ticks for ${effect.damage} damage!`);
        } else if (effect.type === 'burn') {
            state.character.hp -= effect.damage;
            addLog(`🔥 Burn ticks for ${effect.damage} damage!`);
        }
    });

    state.enemyStatusEffects.forEach(effect => {
        if (state.enemy && effect.type === 'poison') {
            state.enemy.hp -= effect.damage;
            addLog(`☠️ ${state.enemy.name} takes ${effect.damage} poison damage!`);
        } else if (state.enemy && effect.type === 'burn') {
            state.enemy.hp -= effect.damage;
            addLog(`🔥 ${state.enemy.name} takes ${effect.damage} burn damage!`);
        }
    });

    // We do NOT check for death here (state.character.hp <= 0 or state.enemy.hp <= 0)
    // to avoid complex cascading state changes outside of the main loop functions. 
    // Usually death from DOTs is handled after processStatusEffects returns to the caller,
    // or we could add explicit checks. To keep it safe, let's let the caller check hp <= 0.
    
    updateCombatLog();

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
    // Filter enemies by current location if property exists
    let availableEnemies = enemies;
    if (state.currentLocation) {
        availableEnemies = enemies.filter(e => !e.locations || e.locations.includes(state.currentLocation));
    }

    // Fallback if no specific enemies found (shouldn't happen with good data)
    if (availableEnemies.length === 0) availableEnemies = enemies;

    const difficulty = getDifficulty ? getDifficulty() : { enemyHpModifier: 1.0, enemyDmgModifier: 1.0 };
    const randomEnemy = { ...availableEnemies[Math.floor(Math.random() * availableEnemies.length)] };
    
    // Apply level scaling and difficulty modifiers
    const levelScale = 1 + ((state.character.level - 1) * 0.15);
    const hpRandomness = 0.8 + Math.random() * 0.4; // Variance
    randomEnemy.hp = Math.floor(randomEnemy.hp * hpRandomness * difficulty.enemyHpModifier * levelScale);
    randomEnemy.maxHp = randomEnemy.hp;
    randomEnemy.attack = Math.floor(randomEnemy.attack * difficulty.enemyDmgModifier * levelScale);

    state.enemy = randomEnemy;
    state.character.ap = state.character.maxAp || 3;
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

    const apPercentage = (state.character.ap / (state.character.maxAp || 3)) * 100;
    const apElement = document.getElementById("combatPlayerAp");
    if (apElement) apElement.textContent = state.character.ap;
    const maxApElement = document.getElementById("combatPlayerMaxAp");
    if (maxApElement) maxApElement.textContent = state.character.maxAp || 3;
    const apBar = document.getElementById("combatApBar");
    if (apBar) apBar.style.width = `${apPercentage}%`;

    const attackBtn = document.querySelector('button[onclick="playerAttack()"]');
    const blockBtn = document.querySelector('button[onclick="playerBlock()"]');
    const dodgeBtn = document.querySelector('button[onclick="playerDodge()"]');
    const itemBtn = document.querySelector('button[onclick="openCombatItemMenu()"]');
    if (attackBtn) {
        attackBtn.disabled = state.character.ap < 2;
        attackBtn.className = `py-3 px-4 bg-red-600 hover:bg-red-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < 2 ? "opacity-50 cursor-not-allowed" : ""}`;
    }
    if (blockBtn) {
        blockBtn.disabled = state.character.ap < 1;
        blockBtn.className = `py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
    }
    if (dodgeBtn) {
        dodgeBtn.disabled = state.character.ap < 1;
        dodgeBtn.className = `py-3 px-4 bg-green-600 hover:bg-green-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
    }
    if (itemBtn) {
        itemBtn.disabled = state.character.ap < 1;
        itemBtn.className = `py-3 px-4 bg-yellow-600 hover:bg-yellow-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
    }

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

    // Enemy Status effects
    const enemyEffectsContainer = document.getElementById("enemyStatusEffects");
    if (enemyEffectsContainer) {
        enemyEffectsContainer.innerHTML = "";
        state.enemyStatusEffects.forEach((effect, i) => {
            const span = document.createElement("span");
            span.className = "status-effect-icon";
            span.textContent = getStatusEffectIcon(effect.type);
            span.title = effect.type;
            enemyEffectsContainer.appendChild(span);
        });
    }

    const enemyHpPercentage = ((state.enemy.maxHp || state.enemy.hp) > 0 ? state.enemy.hp / (state.enemy.maxHp || state.enemy.hp) : 0) * 100;
    if (combatElements.enemyHpBar) combatElements.enemyHpBar.style.width = `${enemyHpPercentage}%`;

    // Update special ability button
    const specialButton = document.getElementById("specialAbilityButton");
    if (specialButton) {
        const hasEnergy = currentEnergy >= 30;
        const hasAp = state.character.ap >= 3;
        specialButton.disabled = !hasEnergy || !hasAp;
        specialButton.className = `py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${hasEnergy && hasAp ? "" : "opacity-50 cursor-not-allowed"}`;
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
    if (!state.character || !state.enemy || state.character.ap < 2) return;
    state.character.ap -= 2;

    if (state.character.hp <= 0) {
        addLog("You succumbed to your injuries...");
        state.gameState = "defeat";
        showScreen("defeat");
        updateCombatUI();
        updateUI();
        return;
    }
    if (state.enemy.hp <= 0) {
        addLog(`${state.enemy.name} succumbed to its injuries!`);
        winCombat();
        updateCombatUI();
        return;
    }

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
    } else if (state.character.ap <= 0) {
        enemyTurn();
    }

    updateCombatUI();
}

/**
 * Player blocks, reducing incoming damage by 50%
 */
export function playerBlock() {
    if (!state.character || !state.enemy || state.character.ap < 1) return;
    state.character.ap -= 1;

    if (state.character.hp <= 0) {
        addLog("You succumbed to your injuries...");
        state.gameState = "defeat";
        showScreen("defeat");
        updateCombatUI();
        updateUI();
        return;
    }
    if (state.enemy.hp <= 0) {
        addLog(`${state.enemy.name} succumbed to its injuries!`);
        winCombat();
        updateCombatUI();
        return;
    }

    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "blocking"),
        { type: "blocking", duration: 1 }
    ];

    addLog("🛡️ You raise your guard, ready to block the next attack!");
    updateCombatLog();
    if (state.character.ap <= 0) {
        enemyTurn();
    } else {
        updateCombatUI();
    }
}

/**
 * Player dodges, 30% chance to avoid attack
 */
export function playerDodge() {
    if (!state.character || !state.enemy || state.character.ap < 1) return;
    state.character.ap -= 1;

    if (state.character.hp <= 0) {
        addLog("You succumbed to your injuries...");
        state.gameState = "defeat";
        showScreen("defeat");
        updateCombatUI();
        updateUI();
        return;
    }
    if (state.enemy.hp <= 0) {
        addLog(`${state.enemy.name} succumbed to its injuries!`);
        winCombat();
        updateCombatUI();
        return;
    }

    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "dodging"),
        { type: "dodging", duration: 1 }
    ];

    addLog("💨 You prepare to dodge the next attack!");
    updateCombatLog();
    if (state.character.ap <= 0) {
        enemyTurn();
    } else {
        updateCombatUI();
    }
}

/**
 * Player uses role-specific special ability
 */
export function useSpecialAbility() {
    if (!state.character || !state.enemy || state.character.ap < 3) return;

    const energyCost = 30;
    const currentEnergy = state.character.energy ?? state.character.maxEnergy ?? 100;
    if (currentEnergy < energyCost) {
        addLog("⚠️ Not enough energy to use special ability!");
        updateCombatLog();
        return;
    }

    state.character.ap -= 3;

    if (state.character.hp <= 0) {
        addLog("You succumbed to your injuries...");
        state.gameState = "defeat";
        showScreen("defeat");
        updateCombatUI();
        updateUI();
        return;
    }
    if (state.enemy.hp <= 0) {
        addLog(`${state.enemy.name} succumbed to its injuries!`);
        winCombat();
        updateCombatUI();
        return;
    }

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
        } else if (state.character.ap <= 0) {
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
        } else if (state.character.ap <= 0) {
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
        if (state.character.ap <= 0) enemyTurn();
    }

    updateCombatUI();
}

/**
 * End the player's turn explicitly
 */
export function endPlayerTurn() {
    if (!state.character || !state.enemy) return;
    
    state.character.ap = 0;
    addLog("⏭️ You end your turn.");
    updateCombatLog();
    updateCombatUI();
    enemyTurn();
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
    const activeDefenseBreak = state.playerStatusEffects.find(e => e.type === "defenseBreak");
    const stats = getEffectiveStats();
    let effectiveDefense = stats.defense - (activeDefenseBreak?.value || 0);
    effectiveDefense = Math.max(0, effectiveDefense); // Don't let defense go below 0

    let damage = Math.max(0, state.enemy.attack - effectiveDefense);

    if (isBlocking) {
        damage = Math.floor(damage * 0.5); // 50% damage reduction
        addLog(`🛡️ You blocked ${state.enemy.name}'s attack, reducing damage!`);
        updateCombatLog();
    }

    state.character.hp -= damage;

    addLog(`${state.enemy.name} hits you for ${damage} damage.`);
    updateCombatLog();

    // 15% chance for enemy to apply a status effect
    if (Math.random() < 0.15 && state.enemy.attack > 0) {
        const effects = ["poison", "burn", "defenseBreak"];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        
        let existingEffect = state.playerStatusEffects.find(e => e.type === randomEffect);
        if (!existingEffect) {
            if (randomEffect === "defenseBreak") {
                state.playerStatusEffects.push({ type: "defenseBreak", value: 3, duration: 3 });
                addLog(`⚠️ ${state.enemy.name} broke your defense! (-3 DEF for 3 turns)`);
            } else if (randomEffect === "poison") {
                state.playerStatusEffects.push({ type: "poison", damage: 5, duration: 3 });
                addLog(`☠️ ${state.enemy.name} poisoned you!`);
            } else if (randomEffect === "burn") {
                state.playerStatusEffects.push({ type: "burn", damage: 8, duration: 2 });
                addLog(`🔥 ${state.enemy.name} set you on fire!`);
            }
            updateCombatLog();
        }
    }

    // Regenerate energy (5 per turn)
    state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || state.character.maxEnergy) + 5);

    // Reset AP for the new turn
    state.character.ap = state.character.maxAp || 3;

    if (state.character.hp <= 0) {
        addLog("You have been defeated...");
        state.gameState = "defeat";
        showScreen("defeat");
    } else {
        // Start of player's new turn
        processStatusEffects();
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
    const creditsGained = Math.floor(xpGained * (0.8 + Math.random() * 0.4)); // Credits roughly equal to XP
    
    // Loot Logic
    const dropTable = state.enemy.drops || ["Energy Cell", "Alien Crystal", "Data Chip"];
    const loot = dropTable[Math.floor(Math.random() * dropTable.length)];

    // Clear enemy immediately to prevent further interactions
    state.enemy = null;

    // Restore energy on victory
    state.character.energy = state.character.maxEnergy;

    // Rewards
    gainXp(xpGained);
    checkQuestProgress("kill", enemyName, 1);
    
    // Inventory & Credits
    state.inventory.push(loot);
    state.character.credits = (state.character.credits || 0) + creditsGained;

    // Log
    addLog(`You defeated the ${enemyName}!`);
    addLog(`You gained ${xpGained} XP, ${creditsGained} credits and found a ${loot}.`);

    // Show victory message
    showVictoryMessage(`Victory! ${enemyName} defeated!`);

    state.gameState = "exploring";
    showScreen("exploring");
    updateUI();
    simulateExploration();
}
