/**
 * Quest System Module
 * Handles quest management, progress tracking, and completion
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI, showVictoryMessage, showSaveMessage, showDialog;
let quests;

/**
 * Initialize the quest module with required dependencies
 */
export function initQuests(deps) {
    // Store state object reference
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
    addLog(`📜 Quest Accepted: ${quest.title}`);
    showSaveMessage(`Quest Accepted: ${quest.title}`);
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
            state.character.xp += step.rewards.xp;
            addLog(`Step Reward: +${step.rewards.xp} XP`);
        }
        if (step.rewards.items) {
            step.rewards.items.forEach(item => {
                state.inventory.push(item);
                addLog(`Step Reward: +1 ${item}`);
            });
        }
    }

    // Show Dialog
    if (step.dialog && showDialog) {
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
    }
}

/**
 * Complete a quest and grant rewards
 */
export function completeQuest(questId) {
    if (!state.character || !state.character.activeQuests[questId]) return;

    const quest = quests[questId];

    // Grant Rewards
    if (quest.rewards.xp) {
        state.character.xp += quest.rewards.xp;
        addLog(`Quest Reward: +${quest.rewards.xp} XP`);
    }

    if (quest.rewards.items) {
        quest.rewards.items.forEach(item => {
            state.inventory.push(item);
            addLog(`Quest Reward: +1 ${item}`);
        });
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
 * Get all available quests (not active or completed)
 */
export function getAvailableQuests() {
    if (!state.character) return [];

    return Object.values(quests).filter(q =>
        !state.character.activeQuests[q.id] && !state.character.completedQuests.includes(q.id)
    );
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
