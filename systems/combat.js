import { rollRarity } from './rarity.js';
import { items } from '../data/items.js';

// State object that holds getters/setters
let state;

// Data and DOM references
let enemies, bosses, combatElements;

// Import functions from other modules
let addLog, updateCombatLog, showScreen, updateUI;
let getEffectiveStats, getCharacterAvatar, getStatusEffectIcon;
import { hasSkill, getPassiveBonus } from './skills.js';

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
    bosses = deps.data.bosses;
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
 * Encounter the area boss
 */
export function encounterBoss() {
    let availableBosses = bosses;
    if (state.currentLocation) {
        availableBosses = bosses.filter(b => !b.locations || b.locations.includes(state.currentLocation));
    }

    if (availableBosses.length === 0) {
        addLog("No boss found in this area.");
        return;
    }

    const difficulty = getDifficulty ? getDifficulty() : { enemyHpModifier: 1.0, enemyDmgModifier: 1.0 };
    const bossTemplate = availableBosses[Math.floor(Math.random() * availableBosses.length)];
    const boss = { ...bossTemplate, isBoss: true, currentPhase: 0 };
    
    // Apply level scaling and difficulty modifiers
    const levelScale = 1 + ((state.character.level - 1) * 0.15);
    const hpRandomness = 0.9 + Math.random() * 0.2; // Less variance for bosses
    boss.hp = Math.floor(boss.hp * hpRandomness * difficulty.enemyHpModifier * levelScale);
    boss.maxHp = boss.hp;
    boss.attack = Math.floor(boss.attack * difficulty.enemyDmgModifier * levelScale);

    state.enemy = boss;
    state.character.ap = state.character.maxAp || 3;
    state.playerStatusEffects = [];
    state.enemyStatusEffects = [];
    state.gameState = "combat";
    showScreen("combat");
    updateCombatUI();
    addLog(`⚠️ WARNING: YOU HAVE ENCOUNTERED THE AREA BOSS, ${state.enemy.name.toUpperCase()}!`);
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
    if (combatElements.playerAtk) combatElements.playerAtk.textContent = stats.attack + getPassiveBonus('attack');
    if (combatElements.playerDef) combatElements.playerDef.textContent = stats.defense + getPassiveBonus('defense');
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
    const enemyContainer = document.getElementById("enemyContainer");
    if (enemyContainer) {
        if (state.enemy.isBoss) {
            enemyContainer.classList.add("boss-container", "border-red-500");
        } else {
            enemyContainer.classList.remove("boss-container", "border-red-500");
        }
    }
    if (combatElements.enemyName) {
        combatElements.enemyName.textContent = state.enemy.isBoss ? `💀 ${state.enemy.name}` : state.enemy.name;
    }
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
        let energyCost = 30;
        let abilityName = "⭐ Special";
        
        if (state.character.role === "Warrior") {
            if (hasSkill('warrior_whirlwind')) { abilityName = "🌪️ Whirlwind"; energyCost = 40; }
            else abilityName = "⭐ Power Strike";
        } else if (state.character.role === "Rogue") {
            if (hasSkill('rogue_shadowstrike')) { abilityName = "🌑 Shadow Strike"; energyCost = 45; }
            else abilityName = "⭐ Assassinate";
        } else if (state.character.role === "Scientist") {
            if (hasSkill('sci_overload')) { abilityName = "💥 Overload"; energyCost = 50; }
            else abilityName = "⭐ Shield Boost";
        }

        const hasEnergy = currentEnergy >= energyCost;
        const hasAp = state.character.ap >= 3;
        specialButton.disabled = !hasEnergy || !hasAp;
        specialButton.className = `py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded font-bold transition-colors flex items-center justify-center gap-2 text-sm ${hasEnergy && hasAp ? "" : "opacity-50 cursor-not-allowed"}`;
        specialButton.textContent = `${abilityName} (3 AP)`;
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

    // Critical hit chance (15% base, higher for Rogues) + passive
    const passiveCrit = getPassiveBonus('critChance');
    const critChance = (state.character.role === "Rogue" ? 0.25 : 0.15) + passiveCrit;
    const isCritical = Math.random() < critChance;
    const critMultiplier = isCritical ? 2 : 1;

    // Check for attack buffs
    const stats = getEffectiveStats();
    const passiveAttack = getPassiveBonus('attack');
    const baseDamage = Math.max(1, (stats.attack + passiveAttack) - state.enemy.defense);
    const damage = Math.floor(baseDamage * critMultiplier);
    state.enemy.hp -= damage;
    checkPhaseTransition();

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

    const passiveDodge = getPassiveBonus('dodgeChance');
    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "dodging"),
        { type: "dodging", chance: 0.3 + passiveDodge, duration: 1 }
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

    let energyCost = 30;
    if (state.character.role === "Warrior" && hasSkill('warrior_whirlwind')) energyCost = 40;
    if (state.character.role === "Rogue" && hasSkill('rogue_shadowstrike')) energyCost = 45;
    if (state.character.role === "Scientist" && hasSkill('sci_overload')) energyCost = 50;

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
    const stats = getEffectiveStats();
    const effectiveAttack = stats.attack + getPassiveBonus('attack');

    if (state.character.role === "Warrior") {
        if (hasSkill('warrior_whirlwind')) {
            const damage = Math.max(0, effectiveAttack - state.enemy.defense);
            state.enemy.hp -= damage;
            state.character.ap += 1; // Refund 1 AP
            addLog(`🌪️ WHIRLWIND! You slash through the enemy for ${damage} damage and regain 1 AP!`);
        } else {
            // Power Strike - 1.5x damage
            const baseDamage = Math.max(0, effectiveAttack - state.enemy.defense);
            const damage = Math.floor(baseDamage * 1.5);
            state.enemy.hp -= damage;
            addLog(`⚔️ POWER STRIKE! You unleash a devastating blow for ${damage} damage!`);
        }
        checkPhaseTransition();
        updateCombatLog();

        if (state.enemy.hp <= 0) winCombat();
        else if (state.character.ap <= 0) enemyTurn();
    } else if (state.character.role === "Rogue") {
        if (hasSkill('rogue_shadowstrike')) {
            const baseDamage = Math.max(0, effectiveAttack - state.enemy.defense);
            const damage = Math.floor(baseDamage * 2.0);
            state.enemy.hp -= damage;
            state.enemyStatusEffects.push({ type: "poison", damage: 8, duration: 3 });
            addLog(`🌑 SHADOW STRIKE! You deal ${damage} damage and poison the enemy!`);
        } else {
            // Guaranteed Critical Hit - 2.5x damage
            const baseDamage = Math.max(0, effectiveAttack - state.enemy.defense);
            const damage = Math.floor(baseDamage * 2.5);
            state.enemy.hp -= damage;
            addLog(`🗡️ ASSASSINATE! You strike a critical weak point for ${damage} damage!`);
        }
        checkPhaseTransition();
        updateCombatLog();

        if (state.enemy.hp <= 0) winCombat();
        else if (state.character.ap <= 0) enemyTurn();
    } else if (state.character.role === "Scientist") {
        if (hasSkill('sci_overload')) {
            const baseDamage = Math.max(0, effectiveAttack - state.enemy.defense);
            const damage = Math.floor(baseDamage * 2.0);
            state.enemy.hp -= damage;
            state.enemyStatusEffects.push({ type: "defenseBreak", value: Math.floor(state.enemy.defense / 2), duration: 2 });
            addLog(`💥 OVERLOAD! You deal ${damage} damage and shatter their defense!`);
            checkPhaseTransition();
            if (state.enemy.hp <= 0) winCombat();
            else if (state.character.ap <= 0) enemyTurn();
        } else {
            // Shield Boost - temporary defense increase
            state.playerStatusEffects = [
                ...state.playerStatusEffects.filter(e => e.type !== "defenseBoost"),
                { type: "defenseBoost", value: 5, duration: 3 }
            ];
            addLog("🔬 You activate a defensive shield! Defense increased for 3 turns.");
            if (state.character.ap <= 0) enemyTurn();
        }
        updateCombatLog();
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
    const dodgeEffect = state.playerStatusEffects.find(e => e.type === "dodging");
    if (dodgeEffect) {
        const dodgeSuccess = Math.random() < (dodgeEffect.chance || 0.3);
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

    // Boss Special Attacks
    if (state.enemy.isBoss && state.enemy.specialAttacks) {
        for (let sp of state.enemy.specialAttacks) {
            if (Math.random() < sp.chance) {
                const minSpDamage = Math.max(2, Math.floor(state.enemy.attack * sp.damageMultiplier * 0.15));
                let spDamage = Math.max(minSpDamage, Math.floor(state.enemy.attack * sp.damageMultiplier) - effectiveDefense);
                if (isBlocking) {
                    spDamage = Math.max(1, Math.floor(spDamage * 0.5));
                    addLog(`🛡️ You blocked ${state.enemy.name}'s special attack, reducing damage!`);
                }
                state.character.hp -= spDamage;
                addLog(`💀 ${sp.msg} It hits you for ${spDamage} damage!`);
                updateCombatLog();
                
                // Rest of turn logic (status effects, energy, etc.)
                state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || state.character.maxEnergy) + 5);
                state.character.ap = state.character.maxAp || 3;
                if (state.character.hp <= 0) {
                    addLog("You have been defeated...");
                    if (state.derelict && state.derelict.active) {
                        import('./derelict.js').then(m => m.failRun());
                    } else {
                        state.gameState = "defeat";
                        showScreen("defeat");
                    }
                } else {
                    processStatusEffects();
                }
                updateCombatUI();
                updateUI();
                return; // End turn early
            }
        }
    }

    const minDamage = Math.max(1, Math.floor(state.enemy.attack * 0.15));
    let damage = Math.max(minDamage, state.enemy.attack - effectiveDefense);

    if (isBlocking) {
        damage = Math.max(1, Math.floor(damage * 0.5)); // 50% damage reduction, minimum 1
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
        if (state.derelict && state.derelict.active) {
            import('./derelict.js').then(m => m.failRun());
        } else {
            state.gameState = "defeat";
            showScreen("defeat");
        }
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
    const isBoss = state.enemy.isBoss;
    let xpGained = Math.floor(state.enemy.attack * 2 + state.enemy.defense * 3);
    let creditsGained = Math.floor(xpGained * (0.8 + Math.random() * 0.4)); // Credits roughly equal to XP
    
    if (isBoss) {
        xpGained *= 3;
        creditsGained *= 3;
    }
    
    // Loot Logic
    const dropTable = state.enemy.drops || ["Energy Cell", "Alien Crystal", "Data Chip"];
    const loot = dropTable[Math.floor(Math.random() * dropTable.length)];
    const finalLoot = rollRarity(loot, isBoss ? 0.15 : 0);

    // Clear enemy immediately to prevent further interactions
    state.enemy = null;

    // Restore energy on victory
    state.character.energy = state.character.maxEnergy;

    // Rewards
    gainXp(xpGained);
    checkQuestProgress("kill", enemyName, 1);
    
    // Inventory & Credits
    state.inventory.push(finalLoot);
    state.character.credits = (state.character.credits || 0) + creditsGained;

    // Log
    addLog(`You defeated the ${enemyName}!`);
    addLog(`You gained ${xpGained} XP, ${creditsGained} credits and found a ${finalLoot}.`);

    // Equipment Drop Chance (20% normal, 50% boss)
    const equipDropChance = isBoss ? 0.50 : 0.20;
    if (Math.random() < equipDropChance) {
        const equipmentPool = Object.keys(items).filter(k => ["weapon", "armor", "accessory"].includes(items[k].type));
        if (equipmentPool.length > 0) {
            const randomEquip = equipmentPool[Math.floor(Math.random() * equipmentPool.length)];
            const rolledEquip = rollRarity(randomEquip, isBoss ? 0.25 : 0.05);
            state.inventory.push(rolledEquip);
            addLog(`🎁 Lucky! You found a rare equipment drop: ${rolledEquip}!`);
        }
    }

    // Show victory message
    if (isBoss) {
        showVictoryMessage(`🏆 Epic Victory! You defeated the area boss ${enemyName}!`);
    } else {
        showVictoryMessage(`Victory! ${enemyName} defeated!`);
    }

    // Trigger medbay healing
    import('./ship.js').then(m => {
        const heal = m.getMedbayHealAmount();
        if (heal > 0 && state.character.hp < state.character.maxHp) {
            const oldHp = state.character.hp;
            state.character.hp = Math.min(state.character.maxHp, state.character.hp + heal);
            addLog(`🩺 Medbay healed you for ${state.character.hp - oldHp} HP after combat.`);
        }
        
        if (state.derelict && state.derelict.active) {
            state.gameState = "derelict";
            showScreen("derelict");
            updateUI();
        } else {
            state.gameState = "exploring";
            showScreen("exploring");
            updateUI();
            simulateExploration();
        }
    });
}

/**
 * Check if the boss has reached a new phase threshold
 */
export function checkPhaseTransition() {
    if (!state.enemy || !state.enemy.isBoss || !state.enemy.phases) return;

    const currentHpPct = state.enemy.hp / state.enemy.maxHp;
    const currentPhaseIdx = state.enemy.currentPhase || 0;

    if (currentPhaseIdx < state.enemy.phases.length) {
        const nextPhase = state.enemy.phases[currentPhaseIdx];
        if (currentHpPct <= nextPhase.threshold) {
            state.enemy.currentPhase = currentPhaseIdx + 1;
            state.enemy.attack += nextPhase.attackBuff || 0;
            state.enemy.defense += nextPhase.defenseBuff || 0;
            state.enemy.defense -= nextPhase.defenseNerf || 0;
            addLog(`⚠️ BOSS PHASE: ${nextPhase.msg}`);
            updateCombatLog();
        }
    }
}
