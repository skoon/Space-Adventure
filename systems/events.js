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
let deps; // Store all deps for access to data
let ui; // Store full UI object to access showTravelScreen dynamically

// Event Types
const EVENT_TYPES = {
    COMBAT: 'combat',
    LOOT: 'loot',
    FLAVOR: 'flavor',
    RESTORE: 'restore',
    HAZARD: 'hazard',
    NPC: 'npc',
    DROPBOX: 'dropbox',  // Photon Prime delivery drop box
    RECIPE: 'recipe'     // Crafting recipe discovery
};

/**
 * Initialize the events module with required dependencies
 */
export function initEvents(dependencies) {
    deps = dependencies; // Store for later use
    state = deps.state;
    quests = deps.data.quests;
    deps.data.recipes = deps.data.recipes || {}; // Ensure recipes access
    ui = deps.ui; // Capture full UI object

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
import { getScannerBonus } from './ship.js';
import { COMPANIONS } from './companions.js';

/**
 * Generate a random event based on weights and location
 */
export function generateRandomEvent(locationId) {
    let roll = Math.random();
    
    // Scanner Bonus: Chance to reroll Combat or Hazards into Loot or Restore
    const scannerBonus = getScannerBonus();
    if (scannerBonus > 0) {
        if (roll >= 0.40 && roll < 0.65) { // Combat
            if (Math.random() * 100 < scannerBonus) {
                roll = 0.65 + Math.random() * 0.15; // Reroll into Loot
            }
        }
    }

    const location = deps.data.locations[locationId];
    
    // 5% Recipe Discovery
    if (roll < 0.05) {
        const recipes = deps?.data?.recipes || {};
        const unknownRecipes = Object.keys(recipes).filter(
            id => !state.character.knownRecipes?.[id]
        );
        
        if (unknownRecipes.length > 0) {
            const recipeId = unknownRecipes[Math.floor(Math.random() * unknownRecipes.length)];
            return { type: EVENT_TYPES.RECIPE, recipeId };
        }
    }

    // 10% Drop Box Event (only if pending orders exist)
    if (roll < 0.15 && state.character?.pendingOrders?.length > 0) {
        return { type: EVENT_TYPES.DROPBOX };
    }

    // Location Specific Events (20% Chance - 0.20 to 0.40)
    if (roll < 0.40 && location) {
        if (locationId === 'terra_prime') {
             // Terra Prime Specific
             const subRoll = Math.random();
             if (subRoll < 0.5) {
                 return { 
                     type: EVENT_TYPES.FLAVOR, 
                     text: "You find a patch of rare medicinal herbs.", 
                     item: "Herb", // Assumes Herb exists or just flavor text? Added to loot table but not items.js potentially.
                     // Let's stick to safe items or credits
                     credits: 50
                 };
             } else {
                 return {
                     type: EVENT_TYPES.LOOT,
                     text: "You discover a hidden supply cache left by early settlers.",
                     item: "Energy Cell",
                     credits: 25
                 };
             }
        } else if (locationId === 'xylo_delta') {
            // Xylo Delta Specific
            const subRoll = Math.random();
             if (subRoll < 0.5) {
                 return { 
                     type: EVENT_TYPES.HAZARD, 
                     text: "A sudden sandstorm obscures your vision and sandblasts your armor!", 
                     damage: 15 
                 };
             } else {
                 return {
                     type: EVENT_TYPES.LOOT,
                     text: "You find the wreckage of a scavenger skiff.",
                     item: "Scrap Metal",
                     credits: 80
                 };
             }
        } else if (locationId === 'nebula_outpost') {
            // Nebula Outpost Specific
            const subRoll = Math.random();
             if (subRoll < 0.5) {
                 return { 
                     type: EVENT_TYPES.FLAVOR, 
                     text: "A ghost signal flickers on your comms, revealing a hidden compartment.", 
                     xp: 50,
                     credits: 100
                 };
             } else {
                 return {
                     type: EVENT_TYPES.COMBAT // Higher combat chance here effectively or specific enemy?
                     // Let's just return combat, encounterEnemy handles location filtering
                 };
             }
        }
    }

    // 25% Combat (0.40 - 0.65)
    if (roll < 0.65) {
        return { type: EVENT_TYPES.COMBAT };
    }

    // 15% Loot (0.65 - 0.80)
    if (roll < 0.80) {
        // Use location loot table if available
        let lootTable = ["Energy Cell", "Data Chip", "Rusty Pipe", "Scrap Metal"];
        if (location && location.lootTable) {
            lootTable = location.lootTable;
        }
        
        const item = lootTable[Math.floor(Math.random() * lootTable.length)];
        
        // Handle "Credits" as a special item case or separate property?
        // Implementation plan said "Credits will be added to loot tables".
        // If item is "Credits", we give credits.
        
        let event = {
            type: EVENT_TYPES.LOOT,
            text: `You searched the area and found a ${item}.`,
            item: item
        };
        
        if (item === "Credits") {
            const amount = 50 + Math.floor(Math.random() * 100);
            event.text = `You found a credit chip worth ${amount} credits.`;
            event.item = null;
            event.credits = amount;
        } else {
            // Add small credit amount to normal loot actions too?
            event.credits = 10 + Math.floor(Math.random() * 20);
        }
        
        return event;
    }

    // 10% Ancient Ruins / Flavor (0.80 - 0.90)
    if (roll < 0.90) {
        return {
            type: EVENT_TYPES.FLAVOR,
            text: "You explored Ancient Ruins and deciphered glyphs.",
            xp: 25,
            credits: 20
        };
    }

    // 10% Restore or Hazard or NPC (0.90 - 1.00)
    // Let's mix them
    const subRoll = Math.random();
    if (subRoll < 0.33) {
         return {
            type: EVENT_TYPES.RESTORE,
            text: "You found a functional regeneration station.",
            stat: "hp",
            amount: 50
        };
    } else if (subRoll < 0.66) {
        return { type: EVENT_TYPES.NPC };
    } else {
         return {
            type: EVENT_TYPES.HAZARD,
            text: "Seismic activity causes a rockfall!",
            damage: 8
        };
    }
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
            if (event.item) {
                state.inventory.push(event.item);
                checkQuestProgress("collect", event.item, 1);
            }
            if (event.credits) {
                state.character.credits = (state.character.credits || 0) + event.credits;
                addLog(`You gained ${event.credits} credits.`);
            }
            updateUI();
            break;

        case EVENT_TYPES.FLAVOR:
            addLog(event.text);
            if (event.xp) {
                gainXp(event.xp);
            }
            if (event.credits) {
                state.character.credits = (state.character.credits || 0) + event.credits;
                addLog(`You gained ${event.credits} credits.`);
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
            const difficulty = (deps.settings && deps.settings.getDifficulty) 
                ? deps.settings.getDifficulty() 
                : { hazardDmgModifier: 1.0 };
                
            const damage = Math.ceil(event.damage * difficulty.hazardDmgModifier);
            
            state.character.hp = Math.max(0, state.character.hp - damage);
            if (state.character.hp <= 0) {
                // Handle death if necessary, though usually combat handles this.
                // For now, let's just ensure they don't die from random events without a fight or check.
                // Or maybe they do? Let's keep it simple: 1 HP min for hazards to avoid cheap deaths.
                if (state.character.hp === 0) state.character.hp = 1;
                addLog(`You took ${damage} damage and barely survived!`);
            } else {
                addLog(`You took ${damage} damage.`);
            }
            updateUI();
            break;

        case EVENT_TYPES.NPC:
            triggerNPCEvent();
            break;


        case EVENT_TYPES.DROPBOX:
            triggerDropBoxEvent();
            break;

        case EVENT_TYPES.RECIPE:
            // We need access to recipes definitions again
            // Storing them in a module-level variable would be better
            const recipes = (ui && ui.getRecipes) ? ui.getRecipes() : (state.recipes || {}); 
            // Wait, state doesn't have recipes. deps.data does.
            // Let's modify init to store deps.data reference
            const recipeDef = deps?.data?.recipes?.[event.recipeId];
            
            if (recipeDef) {
                showDialog(
                    "[!] Recipe Discovery",
                    `You found a crafting schematic!<br><br><strong>${recipeDef.name}</strong><br>${recipeDef.description}`,
                    [{
                        text: "Learn Recipe",
                        action: () => {
                            import('./crafting.js').then(m => {
                                m.discoverRecipe(event.recipeId, recipeDef);
                            });
                        }
                    }]
                );
            } else {
                addLog("You found an unreadable schematic.");
            }
            break;
    }
}

/**
 * Trigger a Photon Prime drop box event
 */
function triggerDropBoxEvent() {
    const pendingCount = state.character.pendingOrders?.length || 0;

    showDialog(
        "📦 Photon Prime Drop Box",
        `You discovered a Photon Prime drop box! You have <strong>${pendingCount}</strong> item(s) waiting for pickup.<br><br><em>"Thank you for choosing Photon Prime - Delivering across the galaxy at light speed!"</em>`,
        [
            {
                text: "Collect Orders",
                action: () => {
                    // Import shop module and claim all orders
                    import('./shop.js').then(m => {
                        const claimed = m.claimAllOrders();
                        if (claimed.length > 0) {
                            addLog(`📦 Collected ${claimed.length} items from Photon Prime!`);
                            claimed.forEach(item => addLog(`  ✓ ${item}`));
                        }
                        updateUI();
                    });
                }
            },
            {
                text: "Leave",
                action: () => addLog("You decided to come back later.")
            }
        ]
    );
}

/**
 * Trigger an NPC event (moved from exploration.js and enhanced)
 */
function triggerNPCEvent() {
    // Check for recruit encounters if any companion is still locked
    const lockedCompanions = Object.keys(COMPANIONS).filter(id => !state.companions[id].unlocked);
    if (lockedCompanions.length > 0 && Math.random() < 0.35) {
        const companionId = lockedCompanions[Math.floor(Math.random() * lockedCompanions.length)];
        const compData = COMPANIONS[companionId];
        showDialog(
            "Encounter",
            `You meet a ${compData.role} named ${compData.name}.<br><br>"${compData.dialogues.recruit}"`,
            [
                {
                    text: `Hire for ${compData.dialogues.recruitCost} cr`,
                    action: () => {
                        import('./companions.js').then(m => {
                            m.recruitCompanion(companionId);
                        });
                    }
                },
                {
                    text: "Decline",
                    action: () => {
                        addLog(`You declined to hire ${compData.name}.`);
                    }
                }
            ]
        );
        return;
    }

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
