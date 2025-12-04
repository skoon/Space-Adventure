/**
 * Random Events System Module
 * Handles generation and processing of random events during exploration
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI, showDialog;
let encounterEnemy, gainXp, checkQuestProgress;
let quests;

// Event Types
const EVENT_TYPES = {
    COMBAT: 'combat',
    LOOT: 'loot',
    FLAVOR: 'flavor',
    RESTORE: 'restore',
    HAZARD: 'hazard',
    NPC: 'npc'
};

/**
 * Initialize the events module with required dependencies
 */
export function initEvents(deps) {
    state = deps.state;
    quests = deps.data.quests;

    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showDialog = deps.ui.showDialog;

    encounterEnemy = deps.combat.encounterEnemy;
    gainXp = deps.character.gainXp;
    checkQuestProgress = deps.quests.checkQuestProgress;
}

/**
 * Generate a random event based on weights
 */
export function generateRandomEvent() {
    const roll = Math.random();

    // 25% Combat
    if (roll < 0.25) {
        return { type: EVENT_TYPES.COMBAT };
    }

    // 15% Loot (Abandoned Outpost)
    if (roll < 0.40) {
        const lootTable = ["Energy Cell", "Data Chip", "Rusty Pipe", "Scrap Metal"];
        const item = lootTable[Math.floor(Math.random() * lootTable.length)];
        return {
            type: EVENT_TYPES.LOOT,
            text: `You discovered an Abandoned Outpost and found a ${item}.`,
            item: item
        };
    }

    // 15% Ancient Ruins (XP)
    if (roll < 0.55) {
        return {
            type: EVENT_TYPES.FLAVOR,
            text: "You explored Ancient Ruins and deciphered glyphs.",
            xp: 15
        };
    }

    // 10% Restore (Anomaly)
    if (roll < 0.65) {
        return {
            type: EVENT_TYPES.RESTORE,
            text: "You encountered a Strange Anomaly. Your energy is restored.",
            stat: "energy",
            amount: 100 // Full restore logic handled in handler
        };
    }

    // 10% Hazard (Radiation/Asteroids)
    if (roll < 0.75) {
        const hazards = [
            { text: "A sudden radiation storm burns you!", damage: 10 },
            { text: "Debris from an asteroid field hits you.", damage: 5 }
        ];
        const hazard = hazards[Math.floor(Math.random() * hazards.length)];
        return {
            type: EVENT_TYPES.HAZARD,
            text: hazard.text,
            damage: hazard.damage
        };
    }

    // 10% NPC Encounter
    if (roll < 0.85) {
        return { type: EVENT_TYPES.NPC };
    }

    // 15% Quiet
    return {
        type: EVENT_TYPES.FLAVOR,
        text: "The landscape is quiet... for now."
    };
}

/**
 * Handle a specific event
 */
export function handleEvent(event) {
    switch (event.type) {
        case EVENT_TYPES.COMBAT:
            encounterEnemy();
            break;

        case EVENT_TYPES.LOOT:
            addLog(event.text);
            state.inventory.push(event.item);
            checkQuestProgress("collect", event.item, 1);
            updateUI();
            break;

        case EVENT_TYPES.FLAVOR:
            addLog(event.text);
            if (event.xp) {
                gainXp(event.xp);
            }
            updateUI();
            break;

        case EVENT_TYPES.RESTORE:
            addLog(event.text);
            if (event.stat === "energy") {
                state.character.energy = state.character.maxEnergy;
            } else if (event.stat === "hp") {
                state.character.hp = Math.min(state.character.hp + event.amount, state.character.maxHp);
            }
            updateUI();
            break;

        case EVENT_TYPES.HAZARD:
            addLog(event.text);
            state.character.hp = Math.max(0, state.character.hp - event.damage);
            if (state.character.hp <= 0) {
                // Handle death if necessary, though usually combat handles this.
                // For now, let's just ensure they don't die from random events without a fight or check.
                // Or maybe they do? Let's keep it simple: 1 HP min for hazards to avoid cheap deaths.
                if (state.character.hp === 0) state.character.hp = 1;
                addLog("You barely survived the hazard!");
            }
            updateUI();
            break;

        case EVENT_TYPES.NPC:
            triggerNPCEvent();
            break;
    }
}

/**
 * Trigger an NPC event (moved from exploration.js and enhanced)
 */
function triggerNPCEvent() {
    // Check for quest NPCs first
    const availableQuests = Object.values(quests).filter(q =>
        !state.character.activeQuests[q.id] && !state.character.completedQuests.includes(q.id)
    );

    if (availableQuests.length > 0 && Math.random() < 0.7) {
        // 70% chance for a quest giver if quests are available
        const randomQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];

        showDialog(
            "NPC Encounter",
            `A mysterious figure approaches you.<br><br>"Greetings, traveler. I have a job for you if you're interested."<br><br><strong>Quest: ${randomQuest.title}</strong><br>${randomQuest.description}`,
            [
                {
                    text: "Accept Quest",
                    action: () => {
                        import('./quests.js').then(m => {
                            m.acceptQuest(randomQuest.id);
                            addLog(`You accepted the quest: ${randomQuest.title}`);
                            updateUI();
                        });
                    }
                },
                {
                    text: "Decline",
                    action: () => {
                        addLog("You declined the offer.");
                    }
                }
            ]
        );
    } else {
        // Flavor NPC
        const flavors = [
            "A merchant waves at you but has no stock today.",
            "A fellow explorer nods in passing.",
            "A lost droid beeps sadly at you."
        ];
        const text = flavors[Math.floor(Math.random() * flavors.length)];

        showDialog(
            "Encounter",
            text,
            [
                {
                    text: "Continue",
                    action: () => {
                        addLog("You continued on your way.");
                    }
                }
            ]
        );
    }
}
