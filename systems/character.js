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

    if (!state) {
        console.error("Character system not initialized: state is undefined");
        alert("Game initialization failed. Please refresh the page.");
        return;
    }

    const name = document.getElementById("nameInput").value;
    const race = document.getElementById("raceSelect").value;
    const role = document.getElementById("roleSelect").value;

    // Base stats vary by role
    const roleStats = {
        Warrior: { hp: 120, attack: 12, defense: 8, maxEnergy: 100, strength: 12, agility: 8, intelligence: 6, charisma: 8 },
        Rogue: { hp: 90, attack: 15, defense: 5, maxEnergy: 120, strength: 8, agility: 12, intelligence: 8, charisma: 8 },
        Scientist: { hp: 100, attack: 10, defense: 10, maxEnergy: 150, strength: 6, agility: 8, intelligence: 12, charisma: 10 }
    };

    // Default stats if role not found
    const stats = roleStats[role] || { hp: 100, attack: 10, defense: 10, maxEnergy: 100, strength: 8, agility: 8, intelligence: 8, charisma: 8 };

    state.worldFlags = {};

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
        strength: stats.strength,
        agility: stats.agility,
        intelligence: stats.intelligence,
        charisma: stats.charisma,
        ap: 3,
        maxAp: 3,
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        },
        skillPoints: 0,
        unlockedSkills: [],
        specializationPoints: 0,
        unlockedSpecializations: [],
        statPoints: 0,
        narrativePoints: 0,
        storyline: {
            act: 1,
            alignment: "neutral",
            variables: {}
        },
        inventory: [],
        activeQuests: {},
        completedQuests: [],
        credits: 100,
        pendingOrders: [],  // Photon Prime orders awaiting pickup
        knownRecipes: {},   // Unlockable crafting recipes
        ship: {
            engineLevel: 1, // 1: Inner planets, 2: Outer planets, 3: Deep space
            medbayLevel: 0, // Heals after combat/travel
            cargoLevel: 0,  // Could increase stack sizes
            scannerLevel: 0, // Boosts good random events
            shieldLevel: 0,
            weaponsLevel: 0,
            shields: 0,
            maxShields: 0
        },
        factions: {
            federation: 0,
            corsairs: 0,
            syndicate: 0
        },
        npcs: {
            vance: { disposition: 0, memoryFlags: [] },
            mercer: { disposition: 0, memoryFlags: [] },
            thorne: { disposition: 0, memoryFlags: [] },
            nesta: { disposition: 0, memoryFlags: [] }
        }
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
            maxHp: 5,
            maxEnergy: 5,
            statPoints: 5
        };

        state.character.maxHp += statIncreases.maxHp;
        state.character.hp = state.character.maxHp; // Full heal on level up
        state.character.maxEnergy += statIncreases.maxEnergy;
        state.character.energy = state.character.maxEnergy;
        
        // Award 5 stat points, 1 narrative attribute point, 1 skill point, and 1 specialization point per level
        state.character.statPoints = (state.character.statPoints || 0) + 5;
        state.character.narrativePoints = (state.character.narrativePoints || 0) + 1;
        state.character.skillPoints = (state.character.skillPoints || 0) + 1;
        state.character.specializationPoints = (state.character.specializationPoints || 0) + 1;
        state.character.unlockedSkills = state.character.unlockedSkills || [];
        state.character.unlockedSpecializations = state.character.unlockedSpecializations || [];

        showLevelUpNotification(state.character.level, statIncreases);
        addLog(`🎉 LEVEL UP! You reached Level ${state.character.level}! You gained 5 Combat Stat points, 1 Narrative Attribute point, and 1 Specialization point!`);
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

/**
 * Purchase a Specialization Point at the med-bay clinic
 */
export function buySpecializationPoint() {
    if (!state || !state.character) return { success: false, message: "No character profile found." };
    
    const costCredits = 500;
    const costMaterial = "Quantum Chip";
    
    if (state.character.credits < costCredits) {
        return { success: false, message: `Insufficient credits. Need ${costCredits} CR.` };
    }
    
    const matIdx = state.inventory.indexOf(costMaterial);
    if (matIdx === -1) {
        return { success: false, message: `Missing required material: ${costMaterial}.` };
    }
    
    // Spend resources
    state.character.credits -= costCredits;
    state.inventory.splice(matIdx, 1);
    
    // Award SP
    state.character.specializationPoints = (state.character.specializationPoints || 0) + 1;
    
    if (addLog) addLog(`🦾 CYBERNETICS: Purchased 1 Neural Specialization Point at the med-bay terminal!`);
    if (updateUI) updateUI();
    
    return { success: true };
}
