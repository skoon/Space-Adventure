/**
 * Character System Module
 * Handles character creation, leveling, and XP management
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI, showScreen;
let showLevelUpNotification, hideLevelUpNotification;
let simulateExploration;

/**
 * Initialize the character module with required dependencies
 */
export function initCharacter(deps) {
    // Store state object reference
    state = deps.state;

    // Functions
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showScreen = deps.ui.showScreen;
    showLevelUpNotification = deps.ui.showLevelUpNotification;
    hideLevelUpNotification = deps.ui.hideLevelUpNotification;
    simulateExploration = deps.exploration.simulateExploration;
}

/**
 * Create a new character
 */
export function createCharacter(event) {
    event.preventDefault();

    const name = document.getElementById("nameInput").value;
    const race = document.getElementById("raceSelect").value;
    const role = document.getElementById("roleSelect").value;

    // Base stats vary by role
    const roleStats = {
        Warrior: { hp: 120, attack: 12, defense: 8, maxEnergy: 100 },
        Rogue: { hp: 90, attack: 15, defense: 5, maxEnergy: 120 },
        Scientist: { hp: 100, attack: 10, defense: 10, maxEnergy: 150 }
    };

    // Default stats if role not found
    const stats = roleStats[role] || { hp: 100, attack: 10, defense: 10, maxEnergy: 100 };

    state.character = {
        name,
        race,
        role,
        level: 1,
        xp: 0,
        hp: stats.hp,
        maxHp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        energy: stats.maxEnergy,
        maxEnergy: stats.maxEnergy,
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        },
        inventory: [],
        activeQuests: {},
        completedQuests: [],
        credits: 100,
        pendingOrders: [],  // Photon Prime orders awaiting pickup
        knownRecipes: {}    // Unlockable crafting recipes
    };

    state.gameState = "exploring";
    showScreen("exploring");
    addLog(`Welcome, ${name} the ${race} ${role}! Your journey begins...`);
    updateUI();
    simulateExploration();
}

/**
 * Gain XP and check for level up
 */
export function gainXp(amount) {
    if (!state.character) return;

    state.character.xp += amount;

    // Check for level up
    const xpToNext = state.character.level * 100;
    if (state.character.xp >= xpToNext) {
        state.character.level++;
        state.character.xp -= xpToNext;

        // Stat increases
        const statIncreases = {
            maxHp: 10,
            attack: 2,
            defense: 1
        };

        state.character.maxHp += statIncreases.maxHp;
        state.character.hp = state.character.maxHp; // Full heal on level up
        state.character.attack += statIncreases.attack;
        state.character.defense += statIncreases.defense;
        state.character.maxEnergy += 10;
        state.character.energy = state.character.maxEnergy;

        showLevelUpNotification(state.character.level, statIncreases);
        addLog(`🎉 LEVEL UP! You reached Level ${state.character.level}!`);
    }

    updateUI();
}

/**
 * Get character avatar emoji
 */
export function getCharacterAvatar(race, role) {
    const avatars = {
        Human: { Warrior: "🛡️", Rogue: "🗡️", Scientist: "🔬" },
        Cyborg: { Warrior: "⚔️", Rogue: "🔪", Scientist: "🔧" },
        Android: { Warrior: "🤖", Rogue: "⚡", Scientist: "💾" }
    };
    return avatars[race]?.[role] || "👤";
}

/**
 * Heal character using an item
 */
export function useHealItem() {
    if (!state.character || state.character.hp >= state.character.maxHp) return;

    const healAmount = 30;
    const newHp = Math.min(state.character.maxHp, state.character.hp + healAmount);

    state.character.hp = newHp;

    // Remove one Energy Cell from inventory
    const index = state.inventory.indexOf("Energy Cell");
    if (index > -1) {
        state.inventory.splice(index, 1);
    }

    addLog("You used an Energy Cell to heal 30 HP.");
    updateUI();
}

/**
 * Restart the game
 */
export function restartGame() {
    location.reload();
}
