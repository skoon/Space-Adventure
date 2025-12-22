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
    TRAVEL: 'travel',
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
export function generateRandomEvent() {
    const roll = Math.random();

    // 5% Recipe Discovery
    if (roll < 0.05) {
        // Need to import game recipes - assuming they are in deps.data or can be accessed via imported module in real game.
        // But since this is a module, we should rely on deps. However recipes are local to game.js in current architecture.
        // Wait, initEvents received deps.data.items, but maybe not recipes.
        // I will assume recipes are passed in data or accessible.
        // The plan says "const recipes = ..." in game.js. We need to make sure they are passed to events system.
        // I will check initEvents in game.js later. For now, let's assume `deps.data.recipes` exists.
        
        // Actually, looking at game.js initEvents call:
        // initEvents({ ...deps, ... }) -> deps contains data: { enemies, quests, items, locations }
        // I haven't added recipes to `deps.data` in `game.js` yet! I need to do that.
        // Assuming I will do that (it's a critical step), here I use it.
        
        const recipes = deps?.data?.recipes || {};
        const unknownRecipes = Object.keys(recipes).filter(
            id => !state.character.knownRecipes?.[id]
        );
        
        if (unknownRecipes.length > 0) {
            const recipeId = unknownRecipes[Math.floor(Math.random() * unknownRecipes.length)];
            return { type: EVENT_TYPES.RECIPE, recipeId };
        }
        // If all known, fall through to other events
    }

    // 10% Drop Box Event (only if pending orders exist)
    if (roll < 0.15 && state.character?.pendingOrders?.length > 0) {
        return { type: EVENT_TYPES.DROPBOX };
    }

    // 5% Travel Event (Transport Device) - adjusted range
    if (roll < 0.15) {
        return { type: EVENT_TYPES.TRAVEL };
    }

    // 25% Combat (0.05 - 0.30)
    if (roll < 0.30) {
        return { type: EVENT_TYPES.COMBAT };
    }

    // 15% Loot (0.30 - 0.45)
    if (roll < 0.45) {
        const lootTable = ["Energy Cell", "Data Chip", "Rusty Pipe", "Scrap Metal"];
        const item = lootTable[Math.floor(Math.random() * lootTable.length)];
        return {
            type: EVENT_TYPES.LOOT,
            text: `You discovered an Abandoned Outpost and found a ${item}.`,
            item: item
        };
    }

    // 15% Ancient Ruins (0.45 - 0.60)
    if (roll < 0.60) {
        return {
            type: EVENT_TYPES.FLAVOR,
            text: "You explored Ancient Ruins and deciphered glyphs.",
            xp: 15
        };
    }

    // 10% Restore (0.60 - 0.70)
    if (roll < 0.70) {
        return {
            type: EVENT_TYPES.RESTORE,
            text: "You encountered a Strange Anomaly. Your energy is restored.",
            stat: "energy",
            amount: 100
        };
    }

    // 10% Hazard (0.70 - 0.80)
    if (roll < 0.80) {
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

    // 10% NPC Encounter (0.80 - 0.90)
    if (roll < 0.90) {
        return { type: EVENT_TYPES.NPC };
    }

    // 10% Quiet (0.90 - 1.00)
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

        case EVENT_TYPES.TRAVEL:
            showDialog(
                "Working Transport Device",
                "You stumble upon an ancient but functional transport device. It seems capable of taking you to another world. Do you want to use it?",
                [
                    {
                        text: "Travel",
                        action: () => {
                            // Close dialog first
                            if (typeof hideDialog === 'function') hideDialog(); // Accessing hidden global or import? No, showDialog handles closing usually.

                            // We need to verify if showTravelScreen exists on the ui object we captured
                            if (ui && ui.showTravelScreen) {
                                ui.showTravelScreen();
                            } else {
                                addLog("Travel system error: UI not ready.");
                            }
                        }
                    },
                    {
                        text: "Leave it",
                        action: () => addLog("You decided not to risk using the device.")
                    }
                ]
            );
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
                    "📜 Recipe Discovery",
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
