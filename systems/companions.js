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
        alliedFaction: "federation",
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
        alliedFaction: "syndicate",
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
        alliedFaction: "corsairs",
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
    if (!state) return;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;

    // Set up initial state structures key-by-key to support partially populated structures
    state.companions = state.companions || {};
    if (!state.companions.vance) state.companions.vance = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
    if (!state.companions.lyra) state.companions.lyra = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
    if (!state.companions.apex) state.companions.apex = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
    
    state.activeCompanion = state.activeCompanion || null;
}

export function getRecruitCost(id) {
    const data = COMPANIONS[id];
    if (!data) return 0;
    
    let baseCost = data.dialogues.recruitCost;
    if (!state || !state.character || !state.character.factions) return baseCost;
    
    const alliedFaction = data.alliedFaction;
    if (alliedFaction) {
        const rep = state.character.factions[alliedFaction] || 0;
        if (rep >= 30) {
            return Math.round(baseCost * 0.5); // 50% discount
        }
    }
    return baseCost;
}

export function canRecruitCompanion(id) {
    const data = COMPANIONS[id];
    if (!data) return false;
    
    if (!state || !state.character || !state.character.factions) return true;
    
    const alliedFaction = data.alliedFaction;
    if (alliedFaction) {
        const rep = state.character.factions[alliedFaction] || 0;
        if (rep < -20) return false; // Hostile stands lock out companion
    }
    return true;
}

/**
 * Recruit a companion
 */
export function recruitCompanion(id) {
    if (!state || !state.companions || !COMPANIONS[id] || !state.companions[id]) return false;
    
    if (!canRecruitCompanion(id)) {
        if (addLog) addLog(`❌ ${COMPANIONS[id].name} refuses to join you due to your hostile reputation with the ${COMPANIONS[id].alliedFaction.toUpperCase()}.`);
        return false;
    }
    
    const cost = getRecruitCost(id);
    if (state.character.credits < cost) {
        if (addLog) addLog("⚠️ Insufficient credits to recruit this companion.");
        return false;
    }

    state.character.credits -= cost;
    state.companions[id].unlocked = true;
    state.activeCompanion = id; // Set as active automatically on recruit
    if (addLog) addLog(`🎉 ${COMPANIONS[id].name} has joined your crew as active companion!`);
    if (updateUI) updateUI();
    return true;
}

/**
 * Get active companion object
 */
export function getActiveCompanion() {
    if (!state || !state.activeCompanion || !state.companions) return null;
    return {
        ...COMPANIONS[state.activeCompanion],
        ...state.companions[state.activeCompanion]
    };
}

/**
 * Switch the active companion
 */
export function setActiveCompanion(id) {
    if (!state || !state.companions) return false;
    if (id === null) {
        state.activeCompanion = null;
        if (addLog) addLog("You dismissed your active companion.");
        if (updateUI) updateUI();
        return true;
    }
    if (!COMPANIONS[id] || !state.companions[id] || !state.companions[id].unlocked) return false;
    state.activeCompanion = id;
    if (addLog) addLog(`${COMPANIONS[id].name} is now your active companion!`);
    if (updateUI) updateUI();
    return true;
}

/**
 * Add trust points to a companion
 */
export function addTrust(id, points) {
    if (!state || !state.companions || !state.companions[id]) return;
    
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
        if (addLog) addLog(`📈 TRUST UP! Your bond with ${COMPANIONS[id].name} has grown to Level ${newLevel}!`);
        if (newLevel === 3 && COMPANIONS[id].dialogues.maxTrust) {
            if (addLog) addLog(`💬 ${COMPANIONS[id].name}: "${COMPANIONS[id].dialogues.maxTrust}"`);
        } else if (COMPANIONS[id].dialogues.trustUp) {
            if (addLog) addLog(`💬 ${COMPANIONS[id].name}: "${COMPANIONS[id].dialogues.trustUp}"`);
        }
    }
}

/**
 * Talk to a companion for flavor text and a small trust boost (once per travel/combat)
 */
export function talkToCompanion(id) {
    if (!state || !state.companions || !COMPANIONS[id] || !state.companions[id] || !state.companions[id].unlocked) return "No data.";
    
    const record = state.companions[id];
    const data = COMPANIONS[id];
    
    let dialogue = data.dialogues.greetings[Math.floor(Math.random() * data.dialogues.greetings.length)];
    
    if (!record.talkedSinceLastAction) {
        record.talkedSinceLastAction = true;
        addTrust(id, 5);
        if (updateUI) updateUI();
    }
    
    return dialogue;
}

/**
 * Gift an item from the player's inventory to a companion
 */
export function giftToCompanion(id, itemName) {
    if (!state || !state.companions || !state.companions[id] || !state.companions[id].unlocked) return false;
    
    const index = state.inventory.indexOf(itemName);
    if (index === -1) {
        if (addLog) addLog(`⚠️ You do not have ${itemName} in your inventory.`);
        return false;
    }

    // Remove item from inventory
    state.inventory.splice(index, 1);

    // Calculate trust value
    const compData = COMPANIONS[id];
    const isPreferred = compData.preferredGifts.includes(itemName);
    const trustGain = isPreferred ? 25 : 10;

    addTrust(id, trustGain);
    if (addLog) addLog(`You gifted ${itemName} to ${compData.name}. (+${trustGain} Trust)`);
    if (updateUI) updateUI();
    return true;
}

/**
 * Gift credits to a companion
 */
export function giftCreditsToCompanion(id, amount) {
    if (!state || !state.companions || !state.companions[id] || !state.companions[id].unlocked) return false;
    if (state.character.credits < amount) {
        if (addLog) addLog("⚠️ Insufficient credits to gift.");
        return false;
    }

    state.character.credits -= amount;
    const trustGain = Math.floor(amount / 10) || 1;
    addTrust(id, trustGain);
    if (addLog) addLog(`You gifted ${amount} credits to ${COMPANIONS[id].name}. (+${trustGain} Trust)`);
    if (updateUI) updateUI();
    return true;
}

/**
 * Reset talkedSinceLastAction for all unlocked companions (called on travel/combat)
 */
export function resetCompanionTalkFlags() {
    if (!state || !state.companions) return;
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
