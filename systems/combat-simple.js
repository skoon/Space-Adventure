/**
 * Combat System Module - Simplified Version
 * This version uses a simpler pattern that's easier to integrate
 */

export const Combat = {
    // State will be injected
    state: null,

    /**
     * Initialize with game state references
     */
    init(gameState) {
        this.state = gameState;
    },

    /**
     * Process status effects at start of turn
     */
    processStatusEffects() {
        const { playerStatusEffects, enemyStatusEffects } = this.state;

        this.state.playerStatusEffects = playerStatusEffects.map(effect => ({
            ...effect,
            duration: effect.duration - 1
        })).filter(effect => effect.duration > 0);

        this.state.enemyStatusEffects = enemyStatusEffects.map(effect => ({
            ...effect,
            duration: effect.duration - 1
        })).filter(effect => effect.duration > 0);
    },

    /**
     * Encounter a random enemy
     */
    encounterEnemy() {
        const { enemies, addLog, showScreen } = this.state;

        const randomEnemy = { ...enemies[Math.floor(Math.random() * enemies.length)] };
        randomEnemy.hp = Math.floor(randomEnemy.hp * (0.8 + Math.random() * 0.4));
        randomEnemy.maxHp = randomEnemy.hp;

        this.state.enemy = randomEnemy;
        this.state.playerStatusEffects = [];
        this.state.enemyStatusEffects = [];
        this.state.gameState = "combat";
        showScreen("combat");
        this.updateCombatUI();
        addLog(`You encountered a ${randomEnemy.name}!`);
    },

    /**
     * Update combat UI
     */
    updateCombatUI() {
        const { character, enemy, combatElements, playerStatusEffects } = this.state;
        const { getEffectiveStats, getCharacterAvatar, getStatusEffectIcon } = this.state;

        if (!character || !enemy) return;

        const currentEnergy = character.energy ?? character.maxEnergy ?? 100;
        const maxEnergy = character.maxEnergy || 100;

        // Player stats
        if (combatElements.playerName) combatElements.playerName.textContent = character.name;
        if (combatElements.playerHp) combatElements.playerHp.textContent = character.hp;
        if (combatElements.playerMaxHp) combatElements.playerMaxHp.textContent = character.maxHp;

        const stats = getEffectiveStats();
        if (combatElements.playerAtk) combatElements.playerAtk.textContent = stats.attack;
        if (combatElements.playerDef) combatElements.playerDef.textContent = stats.defense;
        if (combatElements.playerEnergy) combatElements.playerEnergy.textContent = currentEnergy;
        if (combatElements.playerMaxEnergy) combatElements.playerMaxEnergy.textContent = maxEnergy;
        if (combatElements.playerAvatar) {
            combatElements.playerAvatar.textContent = getCharacterAvatar(character.race, character.role);
        }

        // HP and Energy bars
        const combatHpPercentage = (character.hp / character.maxHp) * 100;
        if (combatElements.playerHpBar) combatElements.playerHpBar.style.width = `${combatHpPercentage}%`;

        const energyPercentage = (currentEnergy / maxEnergy) * 100;
        if (combatElements.playerEnergyBar) {
            combatElements.playerEnergyBar.style.width = `${energyPercentage}%`;
        }

        // Status effects
        if (combatElements.playerStatusEffects) {
            combatElements.playerStatusEffects.innerHTML = "";
            playerStatusEffects.forEach(effect => {
                const span = document.createElement("span");
                span.className = "status-effect-icon";
                span.textContent = getStatusEffectIcon(effect.type);
                span.title = effect.type;
                combatElements.playerStatusEffects.appendChild(span);
            });
        }

        // Enemy stats
        if (combatElements.enemyName) combatElements.enemyName.textContent = enemy.name;
        if (combatElements.enemyHp) combatElements.enemyHp.textContent = enemy.hp;
        if (combatElements.enemyMaxHp) combatElements.enemyMaxHp.textContent = enemy.maxHp || enemy.hp;
        if (combatElements.enemyAtk) combatElements.enemyAtk.textContent = enemy.attack;
        if (combatElements.enemyDef) combatElements.enemyDef.textContent = enemy.defense;

        const enemyHpPercentage = ((enemy.maxHp || enemy.hp) > 0 ?
            enemy.hp / (enemy.maxHp || enemy.hp) : 0) * 100;
        if (combatElements.enemyHpBar) {
            combatElements.enemyHpBar.style.width = `${enemyHpPercentage}%`;
        }

        // Special ability button
        const specialButton = document.getElementById("specialAbilityButton");
        if (specialButton) {
            specialButton.disabled = currentEnergy < 30;
            specialButton.className = `special-button ${currentEnergy >= 30 ? "" : "disabled-button"}`;

            if (character.role === "Warrior") {
                specialButton.textContent = "⭐ Power Strike";
            } else if (character.role === "Rogue") {
                specialButton.textContent = "⭐ Assassinate";
            } else if (character.role === "Scientist") {
                specialButton.textContent = "⭐ Shield Boost";
            }
        }
    },

    /**
     * Player attacks
     */
    playerAttack() {
        const { character, enemy, addLog, updateCombatLog, getEffectiveStats } = this.state;

        if (!character || !enemy) return;
        this.processStatusEffects();

        const critChance = character.role === "Rogue" ? 0.25 : 0.15;
        const isCritical = Math.random() < critChance;
        const critMultiplier = isCritical ? 2 : 1;

        const stats = getEffectiveStats();
        const baseDamage = Math.max(0, stats.attack - enemy.defense);
        const damage = Math.floor(baseDamage * critMultiplier);
        this.state.enemy.hp -= damage;

        if (isCritical) {
            addLog(`💥 CRITICAL HIT! You hit the ${enemy.name} for ${damage} damage!`);
        } else {
            addLog(`You hit the ${enemy.name} for ${damage} damage.`);
        }
        updateCombatLog();

        if (this.state.enemy.hp <= 0) {
            this.winCombat();
        } else {
            this.enemyTurn();
        }

        this.updateCombatUI();
    },

    /**
     * Player blocks
     */
    playerBlock() {
        const { character, enemy, playerStatusEffects, addLog, updateCombatLog } = this.state;

        if (!character || !enemy) return;
        this.processStatusEffects();

        this.state.playerStatusEffects = [
            ...playerStatusEffects.filter(e => e.type !== "blocking"),
            { type: "blocking", duration: 1 }
        ];

        addLog("🛡️ You raise your guard, ready to block the next attack!");
        updateCombatLog();
        this.updateCombatUI();
        this.enemyTurn();
    },

    /**
     * Player dodges
     */
    playerDodge() {
        const { character, enemy, playerStatusEffects, addLog, updateCombatLog } = this.state;

        if (!character || !enemy) return;
        this.processStatusEffects();

        this.state.playerStatusEffects = [
            ...playerStatusEffects.filter(e => e.type !== "dodging"),
            { type: "dodging", duration: 1 }
        ];

        addLog("💨 You prepare to dodge the next attack!");
        updateCombatLog();
        this.updateCombatUI();
        this.enemyTurn();
    },

    /**
     * Use special ability
     */
    useSpecialAbility() {
        const { character, enemy, playerStatusEffects, addLog, updateCombatLog } = this.state;

        if (!character || !enemy) return;

        const energyCost = 30;
        const currentEnergy = character.energy ?? character.maxEnergy ?? 100;
        if (currentEnergy < energyCost) {
            addLog("⚠️ Not enough energy to use special ability!");
            updateCombatLog();
            return;
        }

        this.processStatusEffects();
        this.state.character.energy = Math.max(0, currentEnergy - energyCost);

        if (character.role === "Warrior") {
            const baseDamage = Math.max(0, character.attack - enemy.defense);
            const damage = Math.floor(baseDamage * 1.5);
            this.state.enemy.hp -= damage;

            addLog(`⚔️ POWER STRIKE! You unleash a devastating blow for ${damage} damage!`);
            updateCombatLog();

            if (this.state.enemy.hp <= 0) {
                this.winCombat();
            } else {
                this.enemyTurn();
            }
        } else if (character.role === "Rogue") {
            const baseDamage = Math.max(0, character.attack - enemy.defense);
            const damage = Math.floor(baseDamage * 2.5);
            this.state.enemy.hp -= damage;

            addLog(`🗡️ ASSASSINATE! You strike a critical weak point for ${damage} damage!`);
            updateCombatLog();

            if (this.state.enemy.hp <= 0) {
                this.winCombat();
            } else {
                this.enemyTurn();
            }
        } else if (character.role === "Scientist") {
            this.state.playerStatusEffects = [
                ...playerStatusEffects.filter(e => e.type !== "defenseBoost"),
                { type: "defenseBoost", value: 5, duration: 3 }
            ];
            addLog("🔬 You activate a defensive shield! Defense increased for 3 turns.");
            updateCombatLog();
            this.enemyTurn();
        }

        this.updateCombatUI();
    },

    /**
     * Enemy turn
     */
    enemyTurn() {
        const { character, enemy, playerStatusEffects, addLog, updateCombatLog,
            showScreen, updateUI, getEffectiveStats } = this.state;

        if (!character || !enemy) return;

        // Check dodge
        const isDodging = playerStatusEffects.some(e => e.type === "dodging");
        if (isDodging) {
            const dodgeSuccess = Math.random() < 0.3;
            if (dodgeSuccess) {
                addLog(`💨 You successfully dodged ${enemy.name}'s attack!`);
                updateCombatLog();
                this.state.character.energy = Math.min(
                    character.maxEnergy,
                    (character.energy || character.maxEnergy) + 5
                );
                this.updateCombatUI();
                return;
            } else {
                addLog(`💨 You tried to dodge but ${enemy.name} still hit you!`);
                updateCombatLog();
            }
        }

        // Check block
        const isBlocking = playerStatusEffects.some(e => e.type === "blocking");
        const stats = getEffectiveStats();
        let damage = Math.max(0, enemy.attack - stats.defense);

        if (isBlocking) {
            damage = Math.floor(damage * 0.5);
            addLog(`🛡️ You blocked ${enemy.name}'s attack, reducing damage!`);
            updateCombatLog();
        }

        this.state.character.hp -= damage;
        addLog(`${enemy.name} hits you for ${damage} damage.`);
        updateCombatLog();

        // Regenerate energy
        this.state.character.energy = Math.min(
            character.maxEnergy,
            (character.energy || character.maxEnergy) + 5
        );

        if (this.state.character.hp <= 0) {
            addLog("You have been defeated...");
            this.state.gameState = "defeat";
            showScreen("defeat");
        }

        this.updateCombatUI();
        updateUI();
    },

    /**
     * Win combat
     */
    winCombat() {
        const { enemy, character, inventory, gainXp, checkQuestProgress,
            addLog, showVictoryMessage, showScreen, updateUI, simulateExploration } = this.state;

        if (!enemy) return;

        const enemyName = enemy.name;
        const xpGained = Math.floor(enemy.attack * 2 + enemy.defense * 3);
        const loot = ["Energy Cell", "Alien Crystal", "Data Chip"][Math.floor(Math.random() * 3)];

        this.state.enemy = null;
        this.state.character.energy = character.maxEnergy;

        gainXp(xpGained);
        checkQuestProgress("kill", enemyName, 1);
        inventory.push(loot);

        addLog(`You defeated the ${enemyName}!`);
        addLog(`You gained ${xpGained} XP and found a ${loot}.`);
        showVictoryMessage(`Victory! ${enemyName} defeated!`);

        this.state.gameState = "exploring";
        showScreen("exploring");
        updateUI();
        simulateExploration();
    }
};

// Export individual functions for convenience
export const {
    processStatusEffects,
    encounterEnemy,
    updateCombatUI,
    playerAttack,
    playerBlock,
    playerDodge,
    useSpecialAbility,
    enemyTurn,
    winCombat
} = Combat;
