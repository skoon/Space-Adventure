import { rollRarity } from './rarity.js';
import { items } from '../data/items.js';
import { checkAchievement } from './achievements.js';
import { COMPANIONS, getCompanionAbilityValue, resetCompanionTalkFlags } from './companions.js';

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
    getDifficulty = deps.settings ? deps.settings.getDifficulty : null;
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

    randomEnemy.breakMax = Math.floor(randomEnemy.hp * 0.5);
    randomEnemy.breakCurrent = randomEnemy.breakMax;
    state.enemy = randomEnemy;
    state.combatStance = "Neutral";
    state.character.ap = state.character.maxAp || 3;
    if (state.character.cybernetics && state.character.cybernetics.arms === 'reflex_boosters') {
        if (Math.random() < 0.35) {
            state.character.ap += 1;
            addLog("🦾 CYBERNETICS: Reflex Boosters activated! Started combat with +1 AP.");
        }
    }
    state.companionCooldown = 0;
    resetCompanionTalkFlags();
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

    boss.breakMax = Math.floor(boss.hp * 0.6);
    boss.breakCurrent = boss.breakMax;
    state.enemy = boss;
    state.combatStance = "Neutral";
    state.character.ap = state.character.maxAp || 3;
    if (state.character.cybernetics && state.character.cybernetics.arms === 'reflex_boosters') {
        if (Math.random() < 0.35) {
            state.character.ap += 1;
            addLog("🦾 CYBERNETICS: Reflex Boosters activated! Started combat with +1 AP.");
        }
    }
    state.companionCooldown = 0;
    resetCompanionTalkFlags();
    state.playerStatusEffects = [];
    state.enemyStatusEffects = [];
    state.gameState = "combat";
    showScreen("combat");
    updateCombatUI();
    addLog(`⚠️ WARNING: YOU HAVE ENCOUNTERED THE AREA BOSS, ${state.enemy.name.toUpperCase()}!`);
}

/**
 * Get the damage type of the player's equipped weapon
 */
export function getPlayerDamageType() {
    if (!state.character || !state.character.equipment || !state.character.equipment.weapon) {
        return "Physical";
    }
    const weaponName = state.character.equipment.weapon;
    if (weaponName.includes("Plasma") || weaponName.includes("Photon")) {
        return "Plasma";
    }
    if (weaponName.includes("Laser") || weaponName.includes("Blade")) {
        return "Thermal";
    }
    if (weaponName.includes("Acid") || weaponName.includes("Corrosive")) {
        return "Corrosive";
    }
    if (weaponName.includes("Cryo")) {
        return "Cryo";
    }
    return "Physical";
}

/**
 * Calculate damage adjusting for Melted defense, Broken vulnerability, and Frozen Shatter combos
 */
export function calculateDamageAndApplyCombos(baseDmg, dmgType) {
    let finalDmg = baseDmg;
    
    // Broken vulnerability: 2x damage
    const isBroken = state.enemyStatusEffects.some(e => e.type === "broken");
    if (isBroken) {
        finalDmg *= 2;
    }
    
    // Frozen Shatter combo: Physical hitting Frozen triggers Shatter for 2x damage and consumes Frozen
    const isFrozen = state.enemyStatusEffects.some(e => e.type === "frozen");
    if (dmgType === "Physical" && isFrozen) {
        finalDmg *= 2;
        state.enemyStatusEffects = state.enemyStatusEffects.filter(e => e.type !== "frozen");
        addLog(`❄️ SHATTER! Physical damage shattered the Frozen ${state.enemy.name} for 2x damage!`);
    }

    // Opportunist: Deal +20% damage to poisoned or stunned enemies
    const isPoisonedOrStunned = state.enemyStatusEffects.some(e => e.type === "poison" || e.type === "stunned");
    if (isPoisonedOrStunned) {
        const opportunistMult = getPassiveBonus('opportunistDmg') || 0;
        if (opportunistMult > 0) {
            finalDmg = Math.floor(finalDmg * (1 + opportunistMult));
        }
    }

    // Plasma Overcharge: Plasma damage deals +20% extra damage
    if (dmgType === "Plasma") {
        const plasmaMult = getPassiveBonus('plasmaDmgMultiplier') || 0;
        if (plasmaMult > 0) {
            finalDmg = Math.floor(finalDmg * (1 + plasmaMult));
        }
    }
    
    return finalDmg;
}

/**
 * Apply status effects based on player's damage type and active stances
 */
export function applyAttackStatusEffects(dmgType) {
    if (!state.enemy || state.enemy.hp <= 0) return;
    
    // Scientist Disruption stance applies random elemental status effect
    if (state.combatStance === "Disruption") {
        const effects = ["burning", "frozen", "electrified", "melted"];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        applyEnemyStatus(randomEffect);
        return;
    }
    
    if (dmgType === "Thermal") {
        if (Math.random() < 0.50) {
            applyEnemyStatus("burning", 3);
        }
    } else if (dmgType === "Cryo") {
        if (Math.random() < 0.50) {
            applyEnemyStatus("frozen", 3);
        }
    } else if (dmgType === "Plasma") {
        // Electrified Plasma Shock combo
        const isElectrified = state.enemyStatusEffects.some(e => e.type === "electrified");
        if (isElectrified) {
            addLog(`⚡ SHOCK COMBO! Plasma damage reacted with Electrified status!`);
            state.enemyStatusEffects = state.enemyStatusEffects.filter(e => e.type !== "electrified");
            if (Math.random() < 0.50) {
                state.enemyStatusEffects.push({ type: "stunned", duration: 1 });
                addLog(`✨ ${state.enemy.name} is Stunned for 1 turn!`);
            } else {
                addLog(`✨ Stun failed, but Electrified charges dissipated.`);
            }
        } else {
            if (Math.random() < 0.30) {
                applyEnemyStatus("electrified", 3);
            }
        }
    } else if (dmgType === "Corrosive") {
        if (Math.random() < 0.50) {
            applyEnemyStatus("melted", 3);
        }
    }
}

/**
 * Helper to apply status effect to enemy
 */
function applyEnemyStatus(type, duration = 3) {
    if (!state.enemy) return;
    
    const existing = state.enemyStatusEffects.find(e => e.type === type);
    if (!existing) {
        if (type === "burning") {
            state.enemyStatusEffects.push({ type: "burning", damage: 8, duration });
            addLog(`🔥 ${state.enemy.name} is Burning!`);
        } else if (type === "frozen") {
            state.enemyStatusEffects.push({ type: "frozen", duration });
            addLog(`❄️ ${state.enemy.name} is Frozen!`);
        } else if (type === "electrified") {
            state.enemyStatusEffects.push({ type: "electrified", duration });
            addLog(`⚡ ${state.enemy.name} is Electrified!`);
        } else if (type === "melted") {
            state.enemyStatusEffects.push({ type: "melted", duration });
            addLog(`🧪 ${state.enemy.name} is Melted! (Defense reduced)`);
        }
    }
}

/**
 * Deal stagger damage to the enemy's Break shield
 */
export function dealStaggerDamage(amount) {
    if (!state.enemy) return;
    if (state.enemyStatusEffects.some(e => e.type === "broken")) return;
    
    state.enemy.breakCurrent = Math.max(0, (state.enemy.breakCurrent !== undefined ? state.enemy.breakCurrent : state.enemy.breakMax || 50) - amount);
    addLog(`⚡ Dealt ${amount} Stagger damage! (${state.enemy.breakCurrent}/${state.enemy.breakMax})`);
    
    if (state.enemy.breakCurrent <= 0) {
        state.enemyStatusEffects.push({ type: "broken", duration: 1 });
        addLog(`💥 BREAK! ${state.enemy.name}'s posture is broken! Stunned for 1 turn and takes 2x damage!`);
    }
}

/**
 * Stance switching handler
 */
export function selectStance(index) {
    if (!state.character || !state.enemy) return;
    if (state.character.ap < 1) {
        addLog("⚠️ Not enough Action Points (AP) to change stance!");
        updateCombatLog();
        return;
    }

    const rawStances = {
        Warrior: ["Vanguard", "Berserker"],
        Rogue: ["Shadow", "Skirmisher"],
        Scientist: ["Support Overclock", "Disruption"]
    };
    const roleStances = rawStances[state.character.role];
    if (!roleStances) return;

    const targetStance = roleStances[index];
    if (!targetStance) return;

    state.character.ap -= 1;
    if (state.combatStance === targetStance) {
        state.combatStance = "Neutral";
        addLog(`🔄 Returned to Neutral stance.`);
    } else {
        state.combatStance = targetStance;
        addLog(`🔄 Switched to ${targetStance} stance!`);
    }

    updateCombatLog();
    updateCombatUI();
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

    const activeStance = state.combatStance || "Neutral";
    const isShadow = activeStance === "Shadow";
    
    const attackBtn = document.querySelector('button[onclick="playerAttack()"]');
    const blockBtn = document.querySelector('button[onclick="playerBlock()"]');
    const dodgeBtn = document.querySelector('button[onclick="playerDodge()"]');
    const itemBtn = document.querySelector('button[onclick="openCombatItemMenu()"]');
    if (attackBtn) {
        attackBtn.disabled = state.character.ap < 2;
        attackBtn.className = `py-3 px-4 bg-red-600 hover:bg-red-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < 2 ? "opacity-50 cursor-not-allowed" : ""}`;
    }
    if (blockBtn) {
        if (isShadow) {
            blockBtn.disabled = true;
            blockBtn.className = "py-3 px-4 bg-gray-750 text-gray-500 rounded font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed border border-gray-700";
        } else {
            blockBtn.disabled = state.character.ap < 1;
            blockBtn.className = `py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
        }
    }
    if (dodgeBtn) {
        if (isShadow) {
            dodgeBtn.disabled = true;
            dodgeBtn.className = "py-3 px-4 bg-gray-750 text-gray-500 rounded font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed border border-gray-700";
        } else {
            dodgeBtn.disabled = state.character.ap < 1;
            dodgeBtn.className = `py-3 px-4 bg-green-600 hover:bg-green-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
        }
    }
    if (itemBtn) {
        const itemApCost = activeStance === "Skirmisher" ? 0 : 1;
        itemBtn.disabled = state.character.ap < itemApCost;
        itemBtn.className = `py-3 px-4 bg-yellow-600 hover:bg-yellow-700 rounded font-bold transition-colors flex items-center justify-center gap-2 ${state.character.ap < itemApCost ? "opacity-50 cursor-not-allowed" : ""}`;
    }

    const companionBtn = document.getElementById("combatCompanionBtn");
    if (companionBtn) {
        if (state.activeCompanion) {
            const comp = COMPANIONS[state.activeCompanion];
            const cooldown = state.companionCooldown || 0;
            
            companionBtn.disabled = cooldown > 0 || state.character.ap < 1;
            
            if (cooldown > 0) {
                companionBtn.textContent = `⏳ ${comp.name} (${cooldown}t)`;
                companionBtn.className = `py-3 px-4 bg-gray-750 text-gray-500 rounded font-bold transition-colors flex items-center justify-center gap-2 text-xs opacity-60 cursor-not-allowed border border-gray-700`;
            } else {
                companionBtn.textContent = `👥 ${comp.name} (1 AP)`;
                companionBtn.className = `py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold transition-colors flex items-center justify-center gap-2 text-xs ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
            }
        } else {
            companionBtn.disabled = true;
            companionBtn.textContent = "👥 No Crew";
            companionBtn.className = "py-3 px-4 bg-gray-800 text-gray-500 rounded font-bold flex items-center justify-center gap-2 text-xs opacity-50 cursor-not-allowed border border-gray-700";
        }
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
    const enemyEffectsContainer = combatElements.enemyStatusEffects;
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

    // Update Break shield UI
    const breakMax = state.enemy.breakMax || 50;
    const breakCurrent = state.enemy.breakCurrent !== undefined ? state.enemy.breakCurrent : breakMax;
    if (combatElements.enemyBreakCurrent) combatElements.enemyBreakCurrent.textContent = breakCurrent;
    if (combatElements.enemyBreakMax) combatElements.enemyBreakMax.textContent = breakMax;
    if (combatElements.enemyBreakBar) {
        const breakPct = Math.max(0, Math.min(100, (breakCurrent / breakMax) * 100));
        combatElements.enemyBreakBar.style.width = `${breakPct}%`;
        if (state.enemyStatusEffects.some(e => e.type === "broken")) {
            combatElements.enemyBreakBar.className = "bg-orange-500 h-2 rounded-full transition-all animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]";
        } else {
            combatElements.enemyBreakBar.className = "bg-sky-400 h-2 rounded-full transition-all shadow-[0_0_8px_rgba(56,189,248,0.8)]";
        }
    }

    // Update Stance UI text badge
    const stanceBadge = document.getElementById("combatPlayerStance");
    if (stanceBadge) {
        stanceBadge.textContent = `Stance: ${activeStance}`;
        if (activeStance === "Neutral") {
            stanceBadge.className = "text-xs font-bold text-gray-400 mt-1";
        } else {
            stanceBadge.className = "text-xs font-bold text-cyan-400 mt-1 animate-pulse";
        }
    }

    // Update Stance buttons in selector panel
    const stanceBtn0 = document.getElementById("stanceBtn0");
    const stanceBtn1 = document.getElementById("stanceBtn1");
    if (stanceBtn0 && stanceBtn1) {
        const stances = {
            Warrior: ["🛡️ Vanguard", "🪓 Berserker"],
            Rogue: ["🌑 Shadow", "👟 Skirmisher"],
            Scientist: ["⚡ Overclock", "🧬 Disruption"]
        };
        const rawStances = {
            Warrior: ["Vanguard", "Berserker"],
            Rogue: ["Shadow", "Skirmisher"],
            Scientist: ["Support Overclock", "Disruption"]
        };
        const roleStances = stances[state.character.role] || ["Stance A", "Stance B"];
        const roleRawStances = rawStances[state.character.role] || ["Stance A", "Stance B"];
        
        stanceBtn0.textContent = roleStances[0];
        stanceBtn1.textContent = roleStances[1];

        stanceBtn0.disabled = state.character.ap < 1 && activeStance !== roleRawStances[0];
        stanceBtn1.disabled = state.character.ap < 1 && activeStance !== roleRawStances[1];
        
        if (activeStance === roleRawStances[0]) {
            stanceBtn0.className = "py-1 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-bold transition-colors border border-cyan-400";
            stanceBtn0.disabled = state.character.ap < 1;
        } else {
            stanceBtn0.className = `py-1 px-3 bg-gray-700 hover:bg-gray-650 text-gray-200 rounded text-xs font-bold transition-colors border border-gray-600 ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
        }
        
        if (activeStance === roleRawStances[1]) {
            stanceBtn1.className = "py-1 px-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-bold transition-colors border border-cyan-400";
            stanceBtn1.disabled = state.character.ap < 1;
        } else {
            stanceBtn1.className = `py-1 px-3 bg-gray-700 hover:bg-gray-650 text-gray-200 rounded text-xs font-bold transition-colors border border-gray-600 ${state.character.ap < 1 ? "opacity-50 cursor-not-allowed" : ""}`;
        }
    }

    // Render dynamic active skills
    const skillsContainer = document.getElementById("combatActiveSkillsContainer");
    if (skillsContainer) {
        skillsContainer.innerHTML = "";
        
        const activeSkills = [];
        if (state.character.role === "Warrior" && hasSkill('warrior_shield_wall')) {
            activeSkills.push({
                id: 'warrior_shield_wall',
                name: '🔰 Shield Wall',
                ap: 1,
                energy: 20,
                action: 'useShieldWall'
            });
        }
        if (state.character.role === "Rogue" && hasSkill('rogue_smoke_bomb')) {
            activeSkills.push({
                id: 'rogue_smoke_bomb',
                name: '🌫️ Smoke Bomb',
                ap: 1,
                energy: 25,
                action: 'useSmokeBomb'
            });
        }
        if (state.character.role === "Scientist") {
            if (hasSkill('sci_nanite_repair')) {
                activeSkills.push({
                    id: 'sci_nanite_repair',
                    name: '🧪 Nanite Repair',
                    ap: 1,
                    energy: 30,
                    action: 'useNaniteRepair'
                });
            }
            if (hasSkill('sci_acid_spray')) {
                activeSkills.push({
                    id: 'sci_acid_spray',
                    name: '💨 Acid Spray',
                    ap: 1,
                    energy: 30,
                    action: 'useAcidSpray'
                });
            }
        }
        
        activeSkills.forEach(skill => {
            const hasEnergy = currentEnergy >= skill.energy;
            const hasAp = state.character.ap >= skill.ap;
            const disabled = !hasEnergy || !hasAp || (activeStance === "Shadow");
            
            const btn = document.createElement("button");
            btn.className = `py-2 px-3 rounded font-bold transition-all text-xs flex items-center justify-center gap-1 border border-cyan-800 ${
                !disabled 
                    ? "bg-cyan-950/80 text-cyan-400 hover:bg-cyan-900/80 shadow-[0_0_6px_rgba(6,182,212,0.2)]" 
                    : "bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed border-gray-700"
            }`;
            btn.disabled = disabled;
            btn.innerHTML = `<span>${skill.name}</span> <span class="text-[9px] text-gray-400">(${skill.ap} AP, ${skill.energy} E)</span>`;
            
            btn.onclick = () => {
                import('./combat.js').then(m => {
                    m[skill.action]();
                });
            };
            
            skillsContainer.appendChild(btn);
        });
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
    const isShadow = state.combatStance === "Shadow";
    const critChance = (state.character.role === "Rogue" ? 0.25 : 0.15) + passiveCrit;
    const isCritical = Math.random() < critChance || isShadow;
    let critMultiplier = isCritical ? 2 : 1;
    if (isCritical && state.character.cybernetics && state.character.cybernetics.head === 'targeting_matrix') {
        critMultiplier += 0.5;
    }

    // Check for attack buffs
    const stats = getEffectiveStats();
    const passiveAttack = getPassiveBonus('attack');
    
    // Melted status reduces enemy defense
    const isMelted = state.enemyStatusEffects.some(e => e.type === "melted");
    const enemyDefense = Math.max(0, state.enemy.defense - (isMelted ? 5 : 0));
    
    let baseDamage = Math.max(1, (stats.attack + passiveAttack) - enemyDefense);
    const dmgType = getPlayerDamageType();
    
    // Adjust base damage for combos & stagger break
    baseDamage = calculateDamageAndApplyCombos(baseDamage, dmgType);
    const damage = Math.floor(baseDamage * critMultiplier);
    state.enemy.hp = Math.max(0, state.enemy.hp - damage);
    
    checkPhaseTransition();

    if (isCritical) {
        addLog(`💥 CRITICAL HIT! You hit the ${state.enemy.name} for ${damage} damage!`);
    } else {
        addLog(`You hit the ${state.enemy.name} for ${damage} damage.`);
    }

    if (isShadow) {
        state.combatStance = "Neutral";
        addLog("👤 You emerge from the shadows! Stance reset to Neutral.");
    }

    // Apply elemental status effects
    applyAttackStatusEffects(dmgType);

    // Apply stagger
    dealStaggerDamage(state.combatStance === "Berserker" ? 20 : 10);
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
    let dodgeChance = 0.3 + passiveDodge;
    if (state.character.cybernetics && state.character.cybernetics.nervous === 'synaptic_accelerator') {
        dodgeChance += 0.15;
    }
    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "dodging"),
        { type: "dodging", chance: dodgeChance, duration: 1 }
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

    const isMelted = state.enemyStatusEffects.some(e => e.type === "melted");
    const enemyDefense = Math.max(0, state.enemy.defense - (isMelted ? 5 : 0));
    const isShadow = state.combatStance === "Shadow";

    if (state.character.role === "Warrior") {
        if (hasSkill('warrior_whirlwind')) {
            let baseDamage = Math.max(0, effectiveAttack - enemyDefense);
            baseDamage = calculateDamageAndApplyCombos(baseDamage, "Physical");
            let mult = 1.0;
            if (state.character.cybernetics && state.character.cybernetics.head === 'targeting_matrix') {
                mult += 0.5;
            }
            if (isShadow) {
                mult *= 2; // guaranteed crit
                state.combatStance = "Neutral";
                addLog("👤 You emerge from the shadows! Stance reset to Neutral.");
            }
            const damage = Math.floor(baseDamage * mult);
            state.enemy.hp = Math.max(0, state.enemy.hp - damage);
            state.character.ap += 1; // Refund 1 AP
            addLog(`🌪️ WHIRLWIND! You slash through the enemy for ${damage} damage and regain 1 AP!`);
            dealStaggerDamage(state.combatStance === "Berserker" ? 50 : 25);
        } else {
            // Power Strike - 1.5x damage
            let baseDamage = Math.max(0, effectiveAttack - enemyDefense);
            baseDamage = calculateDamageAndApplyCombos(baseDamage, "Physical");
            let mult = 1.5;
            if (state.character.cybernetics && state.character.cybernetics.head === 'targeting_matrix') {
                mult += 0.5;
            }
            if (isShadow) {
                mult *= 2; // guaranteed crit
                state.combatStance = "Neutral";
                addLog("👤 You emerge from the shadows! Stance reset to Neutral.");
            }
            const damage = Math.floor(baseDamage * mult);
            state.enemy.hp = Math.max(0, state.enemy.hp - damage);
            addLog(`⚔️ POWER STRIKE! You unleash a devastating blow for ${damage} damage!`);
            dealStaggerDamage(state.combatStance === "Berserker" ? 80 : 40);
        }
        checkPhaseTransition();
        updateCombatLog();

        if (state.enemy.hp <= 0) winCombat();
        else if (state.character.ap <= 0) enemyTurn();
    } else if (state.character.role === "Rogue") {
        if (hasSkill('rogue_shadowstrike')) {
            let baseDamage = Math.max(0, effectiveAttack - enemyDefense);
            baseDamage = calculateDamageAndApplyCombos(baseDamage, "Physical");
            let mult = 2.0;
            if (state.character.cybernetics && state.character.cybernetics.head === 'targeting_matrix') {
                mult += 0.5;
            }
            if (isShadow) {
                mult *= 2; // guaranteed crit
                state.combatStance = "Neutral";
                addLog("👤 You emerge from the shadows! Stance reset to Neutral.");
            }
            const damage = Math.floor(baseDamage * mult);
            state.enemy.hp = Math.max(0, state.enemy.hp - damage);
            state.enemyStatusEffects.push({ type: "poison", damage: 8, duration: 3 });
            addLog(`🌑 SHADOW STRIKE! You deal ${damage} damage and poison the enemy!`);
            dealStaggerDamage(20);
        } else {
            // Guaranteed Critical Hit - 2.5x damage
            let baseDamage = Math.max(0, effectiveAttack - enemyDefense);
            baseDamage = calculateDamageAndApplyCombos(baseDamage, "Physical");
            let mult = 2.5;
            if (state.character.cybernetics && state.character.cybernetics.head === 'targeting_matrix') {
                mult += 0.5;
            }
            if (isShadow) {
                state.combatStance = "Neutral";
                addLog("👤 You emerge from the shadows! Stance reset to Neutral.");
            }
            const damage = Math.floor(baseDamage * mult);
            state.enemy.hp = Math.max(0, state.enemy.hp - damage);
            addLog(`🗡️ ASSASSINATE! You strike a critical weak point for ${damage} damage!`);
            dealStaggerDamage(15);
        }
        checkPhaseTransition();
        updateCombatLog();

        if (state.enemy.hp <= 0) winCombat();
        else if (state.character.ap <= 0) enemyTurn();
    } else if (state.character.role === "Scientist") {
        if (hasSkill('sci_overload')) {
            let baseDamage = Math.max(0, effectiveAttack - enemyDefense);
            
            // Overload deals Plasma damage, check electrified shock combo
            const isElectrified = state.enemyStatusEffects.some(e => e.type === "electrified");
            if (isElectrified) {
                addLog(`⚡ SHOCK COMBO! Plasma Overload reacted with Electrified status!`);
                state.enemyStatusEffects = state.enemyStatusEffects.filter(e => e.type !== "electrified");
                if (Math.random() < 0.50) {
                    state.enemyStatusEffects.push({ type: "stunned", duration: 1 });
                    addLog(`✨ ${state.enemy.name} is Stunned for 1 turn!`);
                } else {
                    addLog(`✨ Stun failed, but Electrified charges dissipated.`);
                }
            }
            
            baseDamage = calculateDamageAndApplyCombos(baseDamage, "Plasma");
            let mult = 2.0;
            if (state.character.cybernetics && state.character.cybernetics.head === 'targeting_matrix') {
                mult += 0.5;
            }
            if (isShadow) {
                mult *= 2; // guaranteed crit
                state.combatStance = "Neutral";
                addLog("👤 You emerge from the shadows! Stance reset to Neutral.");
            }
            const damage = Math.floor(baseDamage * mult);
            state.enemy.hp = Math.max(0, state.enemy.hp - damage);
            state.enemyStatusEffects.push({ type: "defenseBreak", value: Math.floor(state.enemy.defense / 2), duration: 2 });
            addLog(`💥 OVERLOAD! You deal ${damage} damage and shatter their defense!`);
            checkPhaseTransition();
            dealStaggerDamage(35);
            if (state.enemy.hp <= 0) winCombat();
            else if (state.character.ap <= 0) enemyTurn();
        } else {
            // Shield Boost - temporary defense increase
            state.playerStatusEffects = [
                ...state.playerStatusEffects.filter(e => e.type !== "defenseBoost"),
                { type: "defenseBoost", value: 5, duration: 3 }
            ];
            addLog("🔬 You activate a defensive shield! Defense increased for 3 turns.");
            if (isShadow) {
                state.combatStance = "Neutral";
                addLog("👤 You emerge from the shadows! Stance reset to Neutral.");
            }
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

    // Tactical Combat 2.0: Skip enemy turn if Broken or Stunned
    if (state.enemyStatusEffects.some(e => e.type === "broken" || e.type === "stunned")) {
        addLog(`✨ ${state.enemy.name} is incapacitated and skips their turn!`);
        
        // Decrement status durations since their turn is skipped
        processStatusEffects();

        // AP and energy regeneration
        let startingAp = state.character.maxAp || 3;
        if (state.playerStatusEffects.some(e => e.type === "frozen")) {
            startingAp = Math.max(1, startingAp - 1);
            addLog("❄️ You are Frozen! Starting AP reduced by 1.");
        }
        
        // Support Overclock AP bonus (+1 AP regen)
        if (state.combatStance === "Support Overclock") {
            startingAp += 1;
            addLog("⚡ Stance: Support Overclock provides +1 AP!");
            
            // Reduce companion active cooldowns by 1 extra turn
            if (state.companionCooldown > 0) {
                state.companionCooldown = Math.max(0, state.companionCooldown - 1);
            }
        }
        
        state.character.ap = startingAp;

        // Reset companion cooldown if it was 0 or higher
        if (state.companionCooldown > 0) {
            state.companionCooldown--;
        }

        state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || state.character.maxEnergy) + 5);

        updateCombatLog();
        updateCombatUI();
        updateUI();
        return;
    }

    // Check if player is dodging
    const dodgeEffect = state.playerStatusEffects.find(e => e.type === "dodging");
    if (dodgeEffect) {
        const dodgeSuccess = Math.random() < (dodgeEffect.chance || 0.3);
        if (dodgeSuccess) {
            addLog(`💨 You successfully dodged ${state.enemy.name}'s attack!`);
            updateCombatLog();
            // Regenerate energy
            state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || state.character.maxEnergy) + 5);
            
            // Fleeting Shadow bonus: Regain 10 additional Energy and 1 AP
            if (hasSkill('rogue_fleeting_shadow')) {
                state.character.energy = Math.min(state.character.maxEnergy, (state.character.energy || state.character.maxEnergy) + 10);
                state.character.ap = Math.min(state.character.maxAp || 3, (state.character.ap || 0) + 1);
                addLog(`👻 Fleeting Shadow: Regained 10 Energy and 1 Action Point!`);
            }
            
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
                
                // Sub-dermal Plating absorption
                if (state.character.cybernetics && state.character.cybernetics.torso === 'subdermal_plating' && state.character.energy > 0) {
                    let absorbAmount = Math.floor(spDamage * 0.15);
                    if (absorbAmount > 0) {
                        absorbAmount = Math.min(absorbAmount, state.character.energy);
                        spDamage -= absorbAmount;
                        state.character.energy -= absorbAmount;
                        addLog(`🛡️ CYBERNETICS: Sub-dermal Plating converted ${absorbAmount} damage into energy drain.`);
                    }
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

    // Sub-dermal Plating absorption
    if (state.character.cybernetics && state.character.cybernetics.torso === 'subdermal_plating' && state.character.energy > 0) {
        let absorbAmount = Math.floor(damage * 0.15);
        if (absorbAmount > 0) {
            absorbAmount = Math.min(absorbAmount, state.character.energy);
            damage -= absorbAmount;
            state.character.energy -= absorbAmount;
            addLog(`🛡️ CYBERNETICS: Sub-dermal Plating converted ${absorbAmount} damage into energy drain.`);
        }
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

    // Reset AP for the new turn with stances & statuses applied
    let startingAp = state.character.maxAp || 3;
    if (state.playerStatusEffects.some(e => e.type === "frozen")) {
        startingAp = Math.max(1, startingAp - 1);
        addLog("❄️ You are Frozen! Starting AP reduced by 1.");
    }
    
    if (state.combatStance === "Support Overclock") {
        startingAp += 1;
        addLog("⚡ Stance: Support Overclock provides +1 AP!");
        
        if (state.companionCooldown > 0) {
            state.companionCooldown = Math.max(0, state.companionCooldown - 1);
        }
    }
    
    state.character.ap = startingAp;
    if (state.companionCooldown > 0) {
        state.companionCooldown--;
    }

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

    // Bloodlust heal on kill passive
    const healOnKill = getPassiveBonus('healOnKill') || 0;
    if (healOnKill > 0 && state.character.hp < state.character.maxHp) {
        state.character.hp = Math.min(state.character.maxHp, state.character.hp + healOnKill);
        addLog(`🩸 Bloodlust: Restored ${healOnKill} HP on victory!`);
    }

    // Rewards
    gainXp(xpGained);
    checkQuestProgress("kill", enemyName, 1);
    
    // Stats tracking and Achievement check
    state.stats = state.stats || {};
    state.stats.enemiesDefeated = (state.stats.enemiesDefeated || 0) + 1;
    if (isBoss) {
        state.stats.bossesDefeated = (state.stats.bossesDefeated || 0) + 1;
    }
    checkAchievement("combat");
    
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

/**
 * Trigger the active companion's tactical ability
 */
export function triggerCompanionAbility() {
    if (!state.character || !state.enemy) return;
    if (!state.activeCompanion) {
        addLog("⚠️ You do not have a companion active.");
        updateCombatLog();
        return;
    }
    if (state.character.ap < 1) {
        addLog("⚠️ Not enough Action Points (AP) to command companion.");
        updateCombatLog();
        return;
    }
    if ((state.companionCooldown || 0) > 0) {
        addLog("⚠️ Companion ability is on cooldown.");
        updateCombatLog();
        return;
    }

    state.character.ap -= 1;
    
    const compRecord = state.companions[state.activeCompanion];
    const compData = COMPANIONS[state.activeCompanion];
    const level = compRecord.level || 1;
    const value = getCompanionAbilityValue(state.activeCompanion, level);
    
    state.companionCooldown = compData.cooldown;

    if (state.activeCompanion === "vance") {
        state.playerStatusEffects = [
            ...state.playerStatusEffects.filter(e => e.type !== "defenseBoost"),
            { type: "defenseBoost", value: value, duration: 3 }
        ];
        addLog(`🛡️ [Companion] Vance activates Shield Generator! (+${value} DEF for 3 turns)`);
    } else if (state.activeCompanion === "lyra") {
        const oldHp = state.character.hp;
        state.character.hp = Math.min(state.character.maxHp, state.character.hp + value);
        addLog(`🩺 [Companion] Dr. Lyra uses Nano-Heal, restoring ${state.character.hp - oldHp} HP!`);
    } else if (state.activeCompanion === "apex") {
        state.enemy.hp -= value;
        addLog(`🔫 [Companion] Apex fires a Precision Shot, dealing ${value} damage to ${state.enemy.name}!`);
        checkPhaseTransition();
        if (state.enemy.hp <= 0) {
            winCombat();
            updateCombatUI();
            return;
        }
    }

    updateCombatLog();
    updateCombatUI();
    updateUI();
}

export function useShieldWall() {
    if (!state.character || !state.enemy || state.character.ap < 1) return;
    const energyCost = 20;
    const currentEnergy = state.character.energy ?? state.character.maxEnergy ?? 100;
    if (currentEnergy < energyCost) {
        addLog("⚠️ Not enough energy to use Shield Wall!");
        updateCombatLog();
        return;
    }
    state.character.ap -= 1;
    state.character.energy = Math.max(0, currentEnergy - energyCost);
    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "defenseBoost"),
        { type: "defenseBoost", value: 8, duration: 3 }
    ];
    addLog("🔰 SHIELD WALL! You raise a defensive barrier, boosting defense (+8) for 3 turns.");
    updateCombatLog();
    updateCombatUI();
    updateUI();
    if (state.character.ap <= 0) enemyTurn();
}

export function useSmokeBomb() {
    if (!state.character || !state.enemy || state.character.ap < 1) return;
    const energyCost = 25;
    const currentEnergy = state.character.energy ?? state.character.maxEnergy ?? 100;
    if (currentEnergy < energyCost) {
        addLog("⚠️ Not enough energy to use Smoke Bomb!");
        updateCombatLog();
        return;
    }
    state.character.ap -= 1;
    state.character.energy = Math.max(0, currentEnergy - energyCost);
    
    const passiveDodge = getPassiveBonus('dodgeChance');
    const dodgeChance = 0.6 + passiveDodge;
    
    state.playerStatusEffects = [
        ...state.playerStatusEffects.filter(e => e.type !== "dodging"),
        { type: "dodging", chance: dodgeChance, duration: 2 }
    ];
    addLog("🌫️ SMOKE BOMB! You disappear in a cloud of smoke, boosting dodge chance (60%) for 2 turns.");
    updateCombatLog();
    updateCombatUI();
    updateUI();
    if (state.character.ap <= 0) enemyTurn();
}

export function useNaniteRepair() {
    if (!state.character || !state.enemy || state.character.ap < 1) return;
    const energyCost = 30;
    const currentEnergy = state.character.energy ?? state.character.maxEnergy ?? 100;
    if (currentEnergy < energyCost) {
        addLog("⚠️ Not enough energy to use Nanite Repair!");
        updateCombatLog();
        return;
    }
    state.character.ap -= 1;
    state.character.energy = Math.max(0, currentEnergy - energyCost);
    
    const baseHeal = 40;
    const healMultiplier = getPassiveBonus('healMultiplier') || 0;
    const finalHeal = Math.floor(baseHeal * (1 + healMultiplier));
    
    state.character.hp = Math.min(state.character.maxHp, state.character.hp + finalHeal);
    
    const negativeEffects = ["poison", "burn", "burning", "frozen", "defenseBreak", "broken", "stunned"];
    state.playerStatusEffects = state.playerStatusEffects.filter(e => !negativeEffects.includes(e.type));
    
    addLog(`🧪 NANITE REPAIR! You healed for ${finalHeal} HP and purged all negative status effects.`);
    updateCombatLog();
    updateCombatUI();
    updateUI();
    if (state.character.ap <= 0) enemyTurn();
}

export function useAcidSpray() {
    if (!state.character || !state.enemy || state.character.ap < 1) return;
    const energyCost = 30;
    const currentEnergy = state.character.energy ?? state.character.maxEnergy ?? 100;
    if (currentEnergy < energyCost) {
        addLog("⚠️ Not enough energy to use Acid Spray!");
        updateCombatLog();
        return;
    }
    state.character.ap -= 1;
    state.character.energy = Math.max(0, currentEnergy - energyCost);
    
    const stats = getEffectiveStats();
    let effectiveAttack = stats.attack + getPassiveBonus('attack');
    
    const plasmaMult = getPassiveBonus('plasmaDmgMultiplier') || 0;
    
    const isMelted = state.enemyStatusEffects.some(e => e.type === "melted");
    const enemyDefense = Math.max(0, state.enemy.defense - (isMelted ? 5 : 0));
    
    let baseDamage = Math.max(0, effectiveAttack - enemyDefense);
    baseDamage = calculateDamageAndApplyCombos(baseDamage, "Plasma");
    
    let mult = 1.5 * (1 + plasmaMult);
    const damage = Math.floor(baseDamage * mult);
    
    state.enemy.hp = Math.max(0, state.enemy.hp - damage);
    
    state.enemyStatusEffects = [
        ...state.enemyStatusEffects.filter(e => e.type !== "melted"),
        { type: "melted", duration: 3 }
    ];
    
    addLog(`🧪 ACID SPRAY! You deal ${damage} Plasma damage and apply Melted (-5 Defense) to ${state.enemy.name} for 3 turns!`);
    
    checkPhaseTransition();
    dealStaggerDamage(20);
    updateCombatLog();
    updateCombatUI();
    updateUI();
    
    if (state.enemy.hp <= 0) {
        winCombat();
    } else if (state.character.ap <= 0) {
        enemyTurn();
    }
}
