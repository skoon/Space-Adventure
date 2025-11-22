/**
 * Quest System Module
 * Handles quest management, progress tracking, and completion
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI, showVictoryMessage, showSaveMessage;
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
}

/**
 * Accept a quest
 */
export function acceptQuest(questId) {
    if (!state.character || state.character.activeQuests[questId] || state.character.completedQuests.includes(questId)) return;

    const quest = quests[questId];
    if (!quest) return;

    state.character.activeQuests[questId] = { progress: 0 };
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

        if (quest.type === type && quest.target === target) {
            const currentProgress = state.character.activeQuests[questId].progress;
            if (currentProgress < quest.amount) {
                state.character.activeQuests[questId].progress += amount;

                if (state.character.activeQuests[questId].progress >= quest.amount) {
                    completeQuest(questId);
                }
            }
        }
    });
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
