/**
 * Companions System Module
 * Handles companions data, recruitment, trust progression, and abilities mapping
 */

let state;
let addLog, updateUI;

export const COMPANIONS = {
    vance: {
        id: "vance",
        name: "Vance",
        role: "Cyborg Scrapper",
        avatar: "🦾",
        abilityName: "Shield Generator",
        abilityDesc: "Adds a defense shield (+5 DEF) for 3 turns. Cooldown: 3 turns.",
        cooldown: 3,
        preferredGifts: ["Data Chip", "Scrap Metal"],
        dialogues: {
            recruit: "Need a hand? The name's Vance. I can watch your back in combat. For 200 credits, I'm in.",
            recruitCost: 200,
            greetings: [
                "System status nominal. What's the plan?",
                "Ready to scrap some metal.",
                "My cybernetics are fully charged and ready."
            ],
            trustUp: "Not bad, Captain. I'm starting to like this crew.",
            maxTrust: "I've served on a lot of ships, but this feels like home. Let's conquer the stars."
        }
    },
    lyra: {
        id: "lyra",
        name: "Dr. Lyra",
        role: "Android Medic",
        avatar: "🔬",
        abilityName: "Nano-Heal",
        abilityDesc: "Restores 25 HP. Cooldown: 4 turns.",
        cooldown: 4,
        preferredGifts: ["Bio-Gel", "Nanites"],
        dialogues: {
            recruit: "Salutations. I am Dr. Lyra. I specialize in trauma medicine. I would like to join your mission for a research fee of 250 credits.",
            recruitCost: 250,
            greetings: [
                "Analyzing biological signatures. You are in optimal health.",
                "Medical systems active. Ready to heal.",
                "How can I assist your scientific endeavors today?"
            ],
            trustUp: "My trust subroutines have increased in value. Thank you.",
            maxTrust: "You have shown exceptional leadership. My loyalty is mathematically absolute."
        }
    },
    apex: {
        id: "apex",
        name: "Apex",
        role: "Human Smuggler",
        avatar: "🔫",
        abilityName: "Precision Shot",
        abilityDesc: "Deals 20 direct damage to the enemy. Cooldown: 3 turns.",
        cooldown: 3,
        preferredGifts: ["Alien Crystal", "Quantum Chip"],
        dialogues: {
            recruit: "Hey there. Name's Apex. Best shot this side of the sector. I need to get off this rock. How about 150 credits and I join your crew?",
            recruitCost: 150,
            greetings: [
                "Keep your eyes open, danger's everywhere.",
                "Got any targets for me?",
                "Let's make some credits."
            ],
            trustUp: "Ha! You're alright, boss. Let's keep this streak going.",
            maxTrust: "I'd follow you into a black hole. You've got real grit."
        }
    }
};

/**
 * Initialize the companions module
 */
export function initCompanions(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;

    // Set up initial state structures if missing
    state.companions = state.companions || {
        vance: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false },
        lyra: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false },
        apex: { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false }
    };
    state.activeCompanion = state.activeCompanion || null;
}

/**
 * Recruit a companion
 */
export function recruitCompanion(id) {
    if (!COMPANIONS[id] || !state.companions[id]) return false;
    
    const cost = COMPANIONS[id].dialogues.recruitCost;
    if (state.character.credits < cost) {
        addLog("⚠️ Insufficient credits to recruit this companion.");
        return false;
    }

    state.character.credits -= cost;
    state.companions[id].unlocked = true;
    state.activeCompanion = id; // Set as active automatically on recruit
    addLog(`🎉 ${COMPANIONS[id].name} has joined your crew as active companion!`);
    updateUI();
    return true;
}

/**
 * Get active companion object
 */
export function getActiveCompanion() {
    if (!state.activeCompanion) return null;
    return {
        ...COMPANIONS[state.activeCompanion],
        ...state.companions[state.activeCompanion]
    };
}

/**
 * Switch the active companion
 */
export function setActiveCompanion(id) {
    if (id === null) {
        state.activeCompanion = null;
        addLog("You dismissed your active companion.");
        updateUI();
        return true;
    }
    if (!COMPANIONS[id] || !state.companions[id] || !state.companions[id].unlocked) return false;
    state.activeCompanion = id;
    addLog(`${COMPANIONS[id].name} is now your active companion!`);
    updateUI();
    return true;
}

/**
 * Add trust points to a companion
 */
export function addTrust(id, points) {
    if (!state.companions[id]) return;
    
    const record = state.companions[id];
    const oldLevel = record.level || 1;
    record.trust = (record.trust || 0) + points;

    // Calculate level based on trust points
    let newLevel = 1;
    if (record.trust >= 100) {
        newLevel = 3;
    } else if (record.trust >= 50) {
        newLevel = 2;
    }
    record.level = newLevel;

    if (newLevel > oldLevel) {
        addLog(`📈 TRUST UP! Your bond with ${COMPANIONS[id].name} has grown to Level ${newLevel}!`);
        if (newLevel === 3 && COMPANIONS[id].dialogues.maxTrust) {
            addLog(`💬 ${COMPANIONS[id].name}: "${COMPANIONS[id].dialogues.maxTrust}"`);
        } else if (COMPANIONS[id].dialogues.trustUp) {
            addLog(`💬 ${COMPANIONS[id].name}: "${COMPANIONS[id].dialogues.trustUp}"`);
        }
    }
}

/**
 * Talk to a companion for flavor text and a small trust boost (once per travel/combat)
 */
export function talkToCompanion(id) {
    if (!COMPANIONS[id] || !state.companions[id] || !state.companions[id].unlocked) return "No data.";
    
    const record = state.companions[id];
    const data = COMPANIONS[id];
    
    let dialogue = data.dialogues.greetings[Math.floor(Math.random() * data.dialogues.greetings.length)];
    
    if (!record.talkedSinceLastAction) {
        record.talkedSinceLastAction = true;
        addTrust(id, 5);
        updateUI();
    }
    
    return dialogue;
}

/**
 * Gift an item from the player's inventory to a companion
 */
export function giftToCompanion(id, itemName) {
    if (!state.companions[id] || !state.companions[id].unlocked) return false;
    
    const index = state.inventory.indexOf(itemName);
    if (index === -1) {
        addLog(`⚠️ You do not have ${itemName} in your inventory.`);
        return false;
    }

    // Remove item from inventory
    state.inventory.splice(index, 1);

    // Calculate trust value
    const compData = COMPANIONS[id];
    const isPreferred = compData.preferredGifts.includes(itemName);
    const trustGain = isPreferred ? 25 : 10;

    addTrust(id, trustGain);
    addLog(`You gifted ${itemName} to ${compData.name}. (+${trustGain} Trust)`);
    updateUI();
    return true;
}

/**
 * Gift credits to a companion
 */
export function giftCreditsToCompanion(id, amount) {
    if (!state.companions[id] || !state.companions[id].unlocked) return false;
    if (state.character.credits < amount) {
        addLog("⚠️ Insufficient credits to gift.");
        return false;
    }

    state.character.credits -= amount;
    const trustGain = Math.floor(amount / 10) || 1;
    addTrust(id, trustGain);
    addLog(`You gifted ${amount} credits to ${COMPANIONS[id].name}. (+${trustGain} Trust)`);
    updateUI();
    return true;
}

/**
 * Reset talkedSinceLastAction for all unlocked companions (called on travel/combat)
 */
export function resetCompanionTalkFlags() {
    if (!state.companions) return;
    Object.keys(state.companions).forEach(id => {
        state.companions[id].talkedSinceLastAction = false;
    });
}

/**
 * Get scaled ability stats based on trust level
 * Vance: returns def value
 * Lyra: returns heal value
 * Apex: returns damage value
 */
export function getCompanionAbilityValue(id, level) {
    if (id === "vance") {
        if (level === 3) return 12;
        if (level === 2) return 8;
        return 5; // Level 1
    } else if (id === "lyra") {
        if (level === 3) return 70;
        if (level === 2) return 45;
        return 25; // Level 1
    } else if (id === "apex") {
        if (level === 3) return 55;
        if (level === 2) return 35;
        return 20; // Level 1
    }
    return 0;
}
