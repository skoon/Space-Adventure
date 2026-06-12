/**
 * Quest System Module
 * Handles quest management, progress tracking, and completion
 */

import { items } from '../data/items.js';

// State object reference
let state;

// Dependencies
let addLog, updateUI, showVictoryMessage, showSaveMessage, showDialog;
let quests;
let deps;

/**
 * Initialize the quest module with required dependencies
 */
export function initQuests(dependencies) {
    deps = dependencies;
    state = deps.state;

    // Data
    quests = deps.data.quests;

    // Functions
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showVictoryMessage = deps.ui.showVictoryMessage;
    showSaveMessage = deps.ui.showSaveMessage;
    showDialog = deps.ui.showDialog;
}

/**
 * Accept a quest
 */
export function acceptQuest(questId) {
    if (!state.character || state.character.activeQuests[questId] || state.character.completedQuests.includes(questId)) return;

    const quest = quests[questId];
    if (!quest) return;

    state.character.activeQuests[questId] = { progress: 0, currentStep: 0 };
    addLog(`[!] Quest Accepted: ${quest.title}`);
    showSaveMessage(`Quest Accepted: ${quest.title}`);

    // If the first step is a choice, trigger it immediately
    triggerChoiceStepIfActive(questId);
}

/**
 * Check quest progress for a specific action
 */
export function checkQuestProgress(type, target, amount) {
    if (!state.character) return;

    Object.keys(state.character.activeQuests).forEach(questId => {
        const quest = quests[questId];
        if (!quest) return;

        let targetType = quest.type;
        let targetTarget = quest.target;
        let targetAmount = quest.amount;

        // Handle multi-step quests
        const activeQuest = state.character.activeQuests[questId];
        if (quest.steps && quest.steps.length > 0) {
            const currentStepIndex = activeQuest.currentStep || 0;
            if (currentStepIndex < quest.steps.length) {
                const step = quest.steps[currentStepIndex];
                targetType = step.type;
                targetTarget = step.target;
                targetAmount = step.amount;
            } else {
                // Should be completed already
                return;
            }
        }

        // Choice steps do not progress via standard game events; they are processed via dialog choices
        if (targetType === "choice") return;

        if (targetType === type && targetTarget === target) {
            const currentProgress = activeQuest.progress;
            if (currentProgress < targetAmount) {
                state.character.activeQuests[questId].progress += amount;

                if (state.character.activeQuests[questId].progress >= targetAmount) {
                    if (quest.steps && quest.steps.length > 0) {
                        completeStep(questId);
                    } else {
                        completeQuest(questId);
                    }
                }
            }
        }
    });
}

/**
 * Complete a quest step
 */
export function completeStep(questId) {
    if (!state.character || !state.character.activeQuests[questId]) return;

    const quest = quests[questId];
    const activeQuest = state.character.activeQuests[questId];
    const currentStepIndex = activeQuest.currentStep || 0;
    const step = quest.steps[currentStepIndex];

    // Grant Step Rewards
    if (step.rewards) {
        if (step.rewards.xp) {
            // Call gainXp if available in character deps, else do it manually
            const gainXpFn = deps?.character?.gainXp;
            if (gainXpFn) {
                gainXpFn(step.rewards.xp);
            } else {
                state.character.xp += step.rewards.xp;
            }
            addLog(`Step Reward: +${step.rewards.xp} XP`);
        }
        if (step.rewards.items) {
            step.rewards.items.forEach(item => {
                state.inventory.push(item);
                addLog(`Step Reward: +1 ${item}`);
            });
        }
    }

    // Show Dialog (only if not a choice step, choice steps handle dialog rendering themselves)
    if (step.dialog && showDialog && step.type !== 'choice') {
        showDialog(step.dialog.title, step.dialog.text);
    }

    // Advance Step
    activeQuest.progress = 0;
    activeQuest.currentStep = currentStepIndex + 1;

    addLog(`✅ Quest Step Completed!`);

    // Check if all steps are done
    if (activeQuest.currentStep >= quest.steps.length) {
        completeQuest(questId);
    } else {
        updateUI();
        // Trigger next step if it's a choice step
        triggerChoiceStepIfActive(questId);
    }
}

/**
 * Complete a quest and grant rewards
 */
export function completeQuest(questId) {
    if (!state.character || !state.character.activeQuests[questId]) return;

    const quest = quests[questId];

    // Grant Rewards
    if (quest.rewards) {
        if (quest.rewards.xp) {
            const gainXpFn = deps?.character?.gainXp;
            if (gainXpFn) {
                gainXpFn(quest.rewards.xp);
            } else {
                state.character.xp += quest.rewards.xp;
            }
            addLog(`Quest Reward: +${quest.rewards.xp} XP`);
        }

        if (quest.rewards.items) {
            quest.rewards.items.forEach(item => {
                state.inventory.push(item);
                addLog(`Quest Reward: +1 ${item}`);
            });
        }
    }

    // Move to completed
    delete state.character.activeQuests[questId];
    state.character.completedQuests.push(questId);

    addLog(`✅ Quest Completed: ${quest.title}!`);
    showVictoryMessage(`Quest Completed: ${quest.title}`);

    updateUI();
}

/**
 * Get quest data by ID
 */
export function getQuest(questId) {
    return quests[questId];
}

/**
 * Check if the player character meets choice requirements
 */
export function checkChoiceRequirements(requires) {
    if (!requires) return true;
    if (!state.character) return false;

    if (requires.role && state.character.role !== requires.role) {
        return false;
    }

    if (requires.race && state.character.race !== requires.race) {
        return false;
    }

    if (requires.stat) {
        const { name, value } = requires.stat;
        let playerVal = 0;

        if (name === "attack" || name === "defense") {
            let baseVal = state.character[name] || 0;
            if (state.character.equipment) {
                const equip = state.character.equipment;
                const getWeaponAtk = () => {
                    if (!equip.weapon) return 0;
                    const item = items[equip.weapon];
                    if (!item) return 0;
                    return (item.stats && item.stats.attack) ? item.stats.attack : (item.attack || 0);
                };
                const getArmorDef = () => {
                    if (!equip.armor) return 0;
                    const item = items[equip.armor];
                    if (!item) return 0;
                    return (item.stats && item.stats.defense) ? item.stats.defense : (item.defense || 0);
                };
                const getAccessoryBonus = (stat) => {
                    if (!equip.accessory) return 0;
                    const item = items[equip.accessory];
                    if (!item) return 0;
                    return (item.stats && item.stats[stat]) ? item.stats[stat] : (item[stat] || 0);
                };

                if (name === "attack") {
                    playerVal = baseVal + getWeaponAtk() + getAccessoryBonus("attack");
                } else if (name === "defense") {
                    playerVal = baseVal + getArmorDef() + getAccessoryBonus("defense");
                }
            } else {
                playerVal = baseVal;
            }
        } else {
            playerVal = state.character[name] || 0;
        }

        if (playerVal < value) return false;
    }

    if (requires.faction && state.character.factions) {
        const { id, value } = requires.faction;
        const currentRep = state.character.factions[id] || 0;
        if (currentRep < value) return false;
    }

    if (requires.npc && state.character.npcs) {
        const { id, value } = requires.npc;
        const currentDisp = state.character.npcs[id]?.disposition || 0;
        if (currentDisp < value) return false;
    }

    return true;
}

/**
 * Display branching choices dialog
 */
function showBranchingChoiceDialog(questId, step) {
    if (!showDialog) return;

    const dialogOptions = step.choices.map((choice, idx) => {
        const passesCheck = checkChoiceRequirements(choice.requires);
        let text = choice.text;

        if (choice.requires) {
            const reqTexts = [];
            if (choice.requires.role) reqTexts.push(choice.requires.role);
            if (choice.requires.stat) {
                const { name, value } = choice.requires.stat;
                reqTexts.push(`${name.toUpperCase()} >= ${value}`);
            }
            if (choice.requires.faction) {
                const { id, value } = choice.requires.faction;
                reqTexts.push(`${id.toUpperCase()} REP >= ${value}`);
            }
            if (choice.requires.npc) {
                const { id, value } = choice.requires.npc;
                reqTexts.push(`${id.toUpperCase()} DISP >= ${value}`);
            }
            text = `[${reqTexts.join(', ')}] ${text}`;
        }

        return {
            text: text,
            disabled: !passesCheck,
            action: () => {
                evaluateChoice(questId, idx);
            }
        };
    });

    showDialog(step.dialogTitle || "Choice Required", step.dialogText || "Choose your path:", dialogOptions);
}

/**
 * Trigger choice step if it's active in the quest line
 */
export function triggerChoiceStepIfActive(questId) {
    if (!state.character || !state.character.activeQuests[questId]) return;

    const quest = quests[questId];
    if (!quest || !quest.steps) return;
    const activeQuest = state.character.activeQuests[questId];
    const currentStepIndex = activeQuest.currentStep || 0;

    if (currentStepIndex >= quest.steps.length) return;

    const step = quest.steps[currentStepIndex];
    if (step && step.type === "choice") {
        showBranchingChoiceDialog(questId, step);
    }
}

/**
 * Evaluate choice results and update state accordingly
 */
export function evaluateChoice(questId, choiceIndex) {
    if (!state.character || !state.character.activeQuests[questId]) return;

    const quest = quests[questId];
    const activeQuest = state.character.activeQuests[questId];
    const currentStepIndex = activeQuest.currentStep || 0;
    const step = quest.steps[currentStepIndex];

    if (!step || step.type !== 'choice') return;

    const choice = step.choices[choiceIndex];
    if (!choice) return;

    if (!checkChoiceRequirements(choice.requires)) {
        addLog("❌ Check failed. You do not meet the requirements.");
        return;
    }

    addLog(`Choice selected: ${choice.text}`);

    // Grant choice rewards
    if (choice.rewards) {
        if (choice.rewards.xp) {
            const gainXpFn = deps?.character?.gainXp;
            if (gainXpFn) {
                gainXpFn(choice.rewards.xp);
            } else {
                state.character.xp += choice.rewards.xp;
            }
            addLog(`Choice Reward: +${choice.rewards.xp} XP`);
        }
        if (choice.rewards.credits) {
            state.character.credits = (state.character.credits || 0) + choice.rewards.credits;
            addLog(`Choice Reward: +${choice.rewards.credits} credits`);
        }
        if (choice.rewards.items) {
            choice.rewards.items.forEach(item => {
                state.inventory.push(item);
                addLog(`Choice Reward: +1 ${item}`);
            });
        }
    }

    // Apply Faction reputation
    if (choice.reputation && state.character.factions) {
        for (const [factionId, amount] of Object.entries(choice.reputation)) {
            state.character.factions[factionId] = (state.character.factions[factionId] || 0) + amount;
            state.character.factions[factionId] = Math.max(-100, Math.min(100, state.character.factions[factionId]));
            const sign = amount >= 0 ? '+' : '';
            addLog(`Reputation: ${factionId.toUpperCase()} ${sign}${amount}`);
        }
    }

    // Apply NPC disposition
    if (choice.disposition && state.character.npcs) {
        for (const [npcId, amount] of Object.entries(choice.disposition)) {
            if (state.character.npcs[npcId]) {
                state.character.npcs[npcId].disposition = (state.character.npcs[npcId].disposition || 0) + amount;
                state.character.npcs[npcId].disposition = Math.max(-100, Math.min(100, state.character.npcs[npcId].disposition));
                const sign = amount >= 0 ? '+' : '';
                addLog(`Disposition: ${npcId.toUpperCase()} ${sign}${amount}`);
            }
        }
    }

    // Apply memory flags
    if (choice.memoryFlags && state.character.npcs) {
        choice.memoryFlags.forEach(flag => {
            const npcId = flag.split('_')[0];
            if (state.character.npcs[npcId]) {
                if (!state.character.npcs[npcId].memoryFlags.includes(flag)) {
                    state.character.npcs[npcId].memoryFlags.push(flag);
                }
            }
        });
    }

    if (choice.log) {
        addLog(choice.log);
    }

    const triggerCombatData = choice.triggerCombat;

    // Advance step
    activeQuest.progress = 0;
    const nextStepVal = choice.nextStepIndex !== undefined ? choice.nextStepIndex : (currentStepIndex + 1);
    activeQuest.currentStep = nextStepVal;

    addLog(`✅ Quest Choice Processed!`);

    // Check if quest completed
    if (activeQuest.currentStep >= quest.steps.length) {
        completeQuest(questId);
    } else {
        updateUI();
        // Trigger new step immediately if it is a choice step
        triggerChoiceStepIfActive(questId);
    }

    // Trigger combat if specified
    if (triggerCombatData) {
        setTimeout(() => {
            if (triggerCombatData.boss && deps.combat && deps.combat.encounterBoss) {
                deps.combat.encounterBoss();
            } else if (deps.combat && deps.combat.encounterEnemy) {
                const enemyTemplate = deps.data.enemies.find(e => e.name === triggerCombatData.enemyName) || 
                                      deps.data.bosses.find(b => b.name === triggerCombatData.enemyName);
                
                if (enemyTemplate) {
                    const difficulty = deps.settings?.getDifficulty() || { enemyHpModifier: 1.0, enemyDmgModifier: 1.0 };
                    const levelScale = 1 + ((state.character.level - 1) * 0.15);
                    const enemy = { 
                        ...enemyTemplate,
                        hp: Math.floor(enemyTemplate.hp * difficulty.enemyHpModifier * levelScale),
                        attack: Math.floor(enemyTemplate.attack * difficulty.enemyDmgModifier * levelScale),
                        maxHp: Math.floor(enemyTemplate.hp * difficulty.enemyHpModifier * levelScale)
                    };
                    if (triggerCombatData.boss) {
                        enemy.isBoss = true;
                    }
                    state.enemy = enemy;
                    state.character.ap = state.character.maxAp || 3;
                    state.companionCooldown = 0;
                    state.playerStatusEffects = [];
                    state.enemyStatusEffects = [];
                    state.gameState = "combat";
                    
                    if (deps.ui && deps.ui.showScreen) {
                        deps.ui.showScreen("combat");
                    }
                    if (deps.combat && deps.combat.updateCombatUI) {
                        deps.combat.updateCombatUI();
                    }
                    addLog(`⚔️ COMBAT TRIGGERED: You are fighting ${state.enemy.name}!`);
                } else {
                    deps.combat.encounterEnemy();
                }
            }
        }, 150);
    }
}

/**
 * Get all available quests (filtered by planet/derelict/faction)
 */
export function getAvailableQuests() {
    if (!state.character) return [];

    return Object.values(quests).filter(q => {
        // Not active or completed
        if (state.character.activeQuests[q.id] || state.character.completedQuests.includes(q.id)) return false;

        // Planet Gating
        if (q.requiredPlanet && q.requiredPlanet !== state.currentLocation) return false;

        // Derelict Gating
        if (q.derelictOnly && (!state.derelict || !state.derelict.active)) return false;

        // Faction Standing Gating
        if (q.requiredFaction && state.character.factions) {
            const { faction, min } = q.requiredFaction;
            if ((state.character.factions[faction] || 0) < min) return false;
        }

        return true;
    });
}

/**
 * Apply a quest item to progress a quest
 */
export function applyQuestItem(itemName) {
    if (!state.character) return false;

    let itemUsed = false;

    Object.keys(state.character.activeQuests).forEach(questId => {
        if (itemUsed) return; // Only use for one quest at a time

        const quest = quests[questId];
        if (!quest) return;

        let targetType = quest.type;
        let targetTarget = quest.target;
        let targetAmount = quest.amount;

        // Handle multi-step
        const activeQuest = state.character.activeQuests[questId];
        if (quest.steps && quest.steps.length > 0) {
            const currentStepIndex = activeQuest.currentStep || 0;
            if (currentStepIndex < quest.steps.length) {
                const step = quest.steps[currentStepIndex];
                targetType = step.type;
                targetTarget = step.target;
                targetAmount = step.amount;
            }
        }

        // Check if item matches quest target
        if (targetTarget === itemName) {
            const currentProgress = activeQuest.progress;

            if (currentProgress < targetAmount) {
                // Use item
                checkQuestProgress(targetType, itemName, 1);

                // Remove from inventory
                const idx = state.inventory.indexOf(itemName);
                if (idx > -1) {
                    state.inventory.splice(idx, 1);
                }

                itemUsed = true;
                addLog(`Used ${itemName} for quest: ${quest.title}`);
            }
        }
    });

    return itemUsed;
}

/**
 * Generate a dynamic quest for a location
 */
export function generateDynamicQuest(locationId) {
    if (!state.character) return null;
    
    const id = `dynamic_${locationId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const level = state.character.level || 1;
    
    const targets = {
        terra_prime: {
            enemies: ["Xenobot"],
            items: ["Scrap Metal", "Rusty Pipe"]
        },
        xylo_delta: {
            enemies: ["Xenobot", "Plasmavore"],
            items: ["Sand Sample", "Ancient Shard"]
        },
        nebula_outpost: {
            enemies: ["Void Corsair Reaver"],
            items: ["Data Chip", "Alien Alloy"]
        },
        norkon_outpost: {
            enemies: ["Xenobot", "Void Corsair Reaver"],
            items: ["Data Chip", "Energy Cell"]
        }
    };
    
    const locData = targets[locationId] || { enemies: ["Xenobot"], items: ["Scrap Metal"] };
    const questType = Math.random() < 0.5 ? "kill" : "collect";
    
    let target, amount, title, description, rewards;
    
    if (questType === "kill") {
        target = locData.enemies[Math.floor(Math.random() * locData.enemies.length)];
        amount = 2 + Math.floor(Math.random() * 2); // 2-3
        title = `Bounty: ${target}s`;
        description = `Defeat ${amount} ${target}s in this sector to maintain regional safety.`;
        rewards = {
            xp: 40 * level,
            items: Math.random() < 0.5 ? ["Energy Cell"] : ["Nano Stimpack"]
        };
    } else {
        target = locData.items[Math.floor(Math.random() * locData.items.length)];
        amount = 1 + Math.floor(Math.random() * 2); // 1-2
        title = `Acquisition: ${target}`;
        description = `Collect and turn in ${amount} ${target}(s) for scientific analysis.`;
        rewards = {
            xp: 35 * level,
            items: Math.random() < 0.5 ? ["Energy Cell"] : ["Nano Stimpack"]
        };
    }
    
    const newQuest = {
        id,
        title,
        description,
        type: questType,
        target,
        amount,
        rewards,
        isMainStory: false,
        requiredPlanet: locationId,
        isDynamic: true
    };
    
    // Inject into global quests dataset
    quests[id] = newQuest;
    return newQuest;
}

/**
 * Get available quests for the Job Board on the current location
 */
export function getJobBoardQuests() {
    if (!state.character) return [];
    
    const currentLocation = state.currentLocation;
    
    // Find all non-active, non-completed quests for current planet
    let available = Object.values(quests).filter(q => {
        if (state.character.activeQuests[q.id] || state.character.completedQuests.includes(q.id)) return false;
        if (q.requiredPlanet && q.requiredPlanet !== currentLocation) return false;
        if (q.derelictOnly) return false;
        
        // Faction Standing Gating
        if (q.requiredFaction && state.character.factions) {
            const { faction, min } = q.requiredFaction;
            if ((state.character.factions[faction] || 0) < min) return false;
        }
        
        return true;
    });
    
    // If fewer than 3 available, generate dynamic quests to fill the board to 3
    while (available.length < 3) {
        const dynQuest = generateDynamicQuest(currentLocation);
        if (dynQuest) {
            available.push(dynQuest);
        } else {
            break;
        }
    }
    
    return available;
}



