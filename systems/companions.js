/**
 * Companions System Module
 * Handles companions data, recruitment, trust progression, and abilities mapping
 */

let state;
let addLog, updateUI, showDialog;

import { COMPANIONS } from '../data/companions.js';
export { COMPANIONS };

/**
 * Initialize the companions module
 */
export function initCompanions(deps) {
    state = deps.state;
    if (!state) return;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showDialog = deps.ui.showDialog;

    // Set up initial state structures key-by-key to support partially populated structures
    state.companions = state.companions || {};
    if (!state.companions.vance) state.companions.vance = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
    if (!state.companions.lyra) state.companions.lyra = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
    if (!state.companions.apex) state.companions.apex = { unlocked: false, trust: 0, level: 1, talkedSinceLastAction: false };
    
    state.activeCompanion = state.activeCompanion || null;
    state.activeCrewDirective = state.activeCrewDirective || null;
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

export const CREW_PASSIVES = {
    heavy_plating: {
        id: "heavy_plating",
        name: "Vance: Heavy Plating",
        desc: "Grants +3 Defense in combat.",
        stat: "defense",
        value: 3
    },
    overcharged_shield: {
        id: "overcharged_shield",
        name: "Vance: Overcharged Shield",
        desc: "Grants +5 Defense in combat.",
        stat: "defense",
        value: 5
    },
    nano_healer: {
        id: "nano_healer",
        name: "Lyra: Nano-Healer",
        desc: "Increases heal effectiveness by +15%.",
        stat: "healMultiplier",
        value: 0.15
    },
    emergency_protocol: {
        id: "emergency_protocol",
        name: "Lyra: Emergency Protocol",
        desc: "Heals for 5 HP on every combat victory.",
        stat: "healOnKill",
        value: 5
    },
    precision_focus: {
        id: "precision_focus",
        name: "Apex: Precision Focus",
        desc: "Increases critical hit chance by +5%.",
        stat: "critChance",
        value: 0.05
    },
    weakpoint_analysis: {
        id: "weakpoint_analysis",
        name: "Apex: Weakpoint Analysis",
        desc: "Grants +4 Attack in combat.",
        stat: "attack",
        value: 4
    },
    steel_fortress: {
        id: "steel_fortress",
        name: "Vance + Lyra: Steel Fortress",
        desc: "Grants +3 Defense and +10% heal effectiveness.",
        stats: {
            defense: 3,
            healMultiplier: 0.10
        }
    },
    scrapper_smugglers: {
        id: "scrapper_smugglers",
        name: "Vance + Apex: Scrapper Smugglers",
        desc: "Grants +3 Attack and +3 Defense.",
        stats: {
            attack: 3,
            defense: 3
        }
    },
    tactical_doctor: {
        id: "tactical_doctor",
        name: "Lyra + Apex: Tactical Doctor",
        desc: "Grants +4% Critical Hit Chance and +10% heal effectiveness.",
        stats: {
            critChance: 0.04,
            healMultiplier: 0.10
        }
    }
};

export function getCompanionPassiveBonus(statName) {
    if (!state || !state.activeCrewDirective) return 0;
    const passive = CREW_PASSIVES[state.activeCrewDirective];
    if (!passive) return 0;
    if (passive.stat === statName) {
        return passive.value;
    } else if (passive.stats && passive.stats[statName]) {
        return passive.stats[statName];
    }
    return 0;
}

export function setActiveCrewDirective(directiveId) {
    if (!state) return false;
    if (directiveId === null) {
        state.activeCrewDirective = null;
        if (addLog) addLog("Active Crew Directive cleared.");
        if (updateUI) updateUI();
        return true;
    }
    if (!CREW_PASSIVES[directiveId]) return false;
    state.activeCrewDirective = directiveId;
    if (addLog) addLog(`Crew Directive activated: ${CREW_PASSIVES[directiveId].name}`);
    if (updateUI) updateUI();
    return true;
}

export function triggerCrewBanter() {
    if (!state || !state.companions) return false;

    const unlockedCompanions = Object.keys(state.companions).filter(id => state.companions[id].unlocked);
    if (unlockedCompanions.length === 0) return false;

    const doubleBanters = [];
    const soloBanters = [];

    // Vance & Lyra
    if (unlockedCompanions.includes("vance") && unlockedCompanions.includes("lyra")) {
        doubleBanters.push({
            title: "Crew Comm: Vance & Lyra",
            text: "Vance is cursing while polishing his cybernetic arm. 'Damn gears are squeaking again. Hey, doc! You got any of that fancy sub-dermal lubricant left?'<br><br>Lyra scans him. 'Vance, your joint friction is within acceptable limits, but I recommend a full diagnostic scan rather than crude oiling.'<br><br>Vance grumbles: 'I don't need a diagnostic scan, Lyra. I need WD-40.'",
            choices: [
                {
                    text: "Support Vance: 'Let the man use his classic lubricant.'",
                    action: () => {
                        addTrust("vance", 10);
                        addTrust("lyra", -5);
                        if (addLog) addLog("You supported Vance. (+10 Vance Trust, -5 Lyra Trust)");
                    }
                },
                {
                    text: "Support Lyra: 'She's right, Vance. Let her run the diagnostics.'",
                    action: () => {
                        addTrust("lyra", 10);
                        addTrust("vance", -5);
                        if (addLog) addLog("You supported Lyra. (+10 Lyra Trust, -5 Vance Trust)");
                    }
                },
                {
                    text: "Settle both: 'Can we just find a quiet spot for repairs?'",
                    action: () => {
                        addTrust("vance", 5);
                        addTrust("lyra", 5);
                        if (addLog) addLog("You pacified both crew members. (+5 Vance, +5 Lyra Trust)");
                    }
                }
            ]
        });
    }

    // Vance & Apex
    if (unlockedCompanions.includes("vance") && unlockedCompanions.includes("apex")) {
        doubleBanters.push({
            title: "Crew Comm: Vance & Apex",
            text: "Apex is cleaning his pistol, chuckling. 'Vance, my buddy, that military posture of yours is a big red target. In the smuggling business, you gotta slouch. Look natural.'<br><br>Vance snorts. 'Slouching gets your spine misaligned and your reaction time delayed, smuggler. Military discipline keeps you alive.'",
            choices: [
                {
                    text: "Agree with Vance: 'Rules and discipline keep the ship intact.'",
                    action: () => {
                        addTrust("vance", 10);
                        addTrust("apex", -5);
                        if (addLog) addLog("You agreed with Vance. (+10 Vance Trust, -5 Apex Trust)");
                    }
                },
                {
                    text: "Agree with Apex: 'Improvisation is key in deep space.'",
                    action: () => {
                        addTrust("apex", 10);
                        addTrust("vance", -5);
                        if (addLog) addLog("You agreed with Apex. (+10 Apex Trust, -5 Vance Trust)");
                    }
                },
                {
                    text: "Suggest compromise: 'A disciplined smuggler is the deadliest kind.'",
                    action: () => {
                        addTrust("vance", 5);
                        addTrust("apex", 5);
                        if (addLog) addLog("You suggested compromise. (+5 Vance, +5 Apex Trust)");
                    }
                }
            ]
        });
    }

    // Lyra & Apex
    if (unlockedCompanions.includes("lyra") && unlockedCompanions.includes("apex")) {
        doubleBanters.push({
            title: "Crew Comm: Lyra & Apex",
            text: "Lyra is watching Apex shuffle a holographic deck of cards. 'Apex, my biometric sensors indicate a 14% heart rate increase whenever you prepare a bluff. It is statistically inefficient for your card-playing success.'<br><br>Apex looks horrified. 'Hey! Don't look at my heart rate! That's cheating, doc! Keep your science out of my Sabacc!'",
            choices: [
                {
                    text: "Side with Lyra: 'She's just giving you useful data.'",
                    action: () => {
                        addTrust("lyra", 10);
                        addTrust("apex", -5);
                        if (addLog) addLog("You sided with Lyra. (+10 Lyra Trust, -5 Apex Trust)");
                    }
                },
                {
                    text: "Side with Apex: 'Sabacc is about instinct, Lyra. Leave him be.'",
                    action: () => {
                        addTrust("apex", 10);
                        addTrust("lyra", -5);
                        if (addLog) addLog("You sided with Apex. (+10 Apex Trust, -5 Lyra Trust)");
                    }
                },
                {
                    text: "Join the game: 'How about you deal both of us in?'",
                    action: () => {
                        addTrust("lyra", 5);
                        addTrust("apex", 5);
                        if (addLog) addLog("You joined the game. (+5 Lyra, +5 Apex Trust)");
                    }
                }
            ]
        });
    }

    // Solo Vance
    if (unlockedCompanions.includes("vance")) {
        soloBanters.push({
            title: "Crew Comm: Vance",
            text: "Vance leans against the bulkhead. 'You know, Captain, this ship reminds me of my old corvette from the Federation service. Sturdy. But we had a kitchen that actually served real food, not just paste. What do you miss most about solid ground?'",
            choices: [
                {
                    text: "Share memories: 'I miss the fresh air and open skies.'",
                    action: () => {
                        addTrust("vance", 10);
                        if (addLog) addLog("You shared memories with Vance. (+10 Trust)");
                    }
                },
                {
                    text: "Focus on mission: 'I only care about the stars and our next credit payout.'",
                    action: () => {
                        addTrust("vance", 5);
                        if (addLog) addLog("Vance nods in respect. (+5 Trust)");
                    }
                }
            ]
        });
    }

    // Solo Lyra
    if (unlockedCompanions.includes("lyra")) {
        soloBanters.push({
            title: "Crew Comm: Dr. Lyra",
            text: "Dr. Lyra is looking out the window at planetary dust. 'Captain, my core programming specifies database maintenance during travel, yet I find myself cataloging human behavior instead. Tell me, why do crew members find humor in mechanical failures?'",
            choices: [
                {
                    text: "Explain humor: 'Humor is how humans cope with stress and danger.'",
                    action: () => {
                        addTrust("lyra", 10);
                        if (addLog) addLog("You explained human behavior. (+10 Trust)");
                    }
                },
                {
                    text: "Call it a bug: 'It's just a logic error in organic minds.'",
                    action: () => {
                        addTrust("lyra", 10);
                        if (addLog) addLog("Lyra records the definition. (+10 Trust)");
                    }
                }
            ]
        });
    }

    // Solo Apex
    if (unlockedCompanions.includes("apex")) {
        soloBanters.push({
            title: "Crew Comm: Apex",
            text: "Apex gestures to a datapad. 'Hey Boss, I intercepted a Syndicate trade channel about a minor cargo drop nearby. We could easily slip in and grab some spare components. What do you say? A quick detour?'",
            choices: [
                {
                    text: "Accept detour: 'Sounds lucrative. Let's do it.'",
                    action: () => {
                        addTrust("apex", 10);
                        state.character.credits = (state.character.credits || 0) + 100;
                        if (addLog) addLog("You agreed to the detour. (+10 Apex Trust, +100 Credits!)");
                    }
                },
                {
                    text: "Reject detour: 'We stick to the flight path, Apex.'",
                    action: () => {
                        addTrust("apex", 5);
                        if (addLog) addLog("Apex accepts the call. (+5 Trust)");
                    }
                }
            ]
        });
    }

    let selectedBanter = null;
    if (doubleBanters.length > 0 && Math.random() < 0.6) {
        selectedBanter = doubleBanters[Math.floor(Math.random() * doubleBanters.length)];
    } else if (soloBanters.length > 0) {
        selectedBanter = soloBanters[Math.floor(Math.random() * soloBanters.length)];
    }

    if (selectedBanter) {
        const dialogCallbacks = selectedBanter.choices.map(choice => {
            return {
                text: choice.text,
                action: () => {
                    choice.action();
                    if (state.gameState === "combat") {
                        import('./combat.js').then(combat => {
                            if (combat.updateCombatUI) combat.updateCombatUI();
                        });
                    }
                    if (updateUI) updateUI();
                }
            };
        });

        if (showDialog) {
            showDialog(selectedBanter.title, selectedBanter.text, dialogCallbacks);
            return true;
        }
    }

    return false;
}
