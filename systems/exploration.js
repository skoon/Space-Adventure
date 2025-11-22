/**
 * Exploration System Module
 * Handles random events, NPC encounters, and exploration mechanics
 */

// State object reference
let state;

// Dependencies
let addLog, updateUI;
let encounterEnemy, gainXp, checkQuestProgress;
let quests;

/**
 * Initialize the exploration module with required dependencies
 */
export function initExploration(deps) {
    // Store state object reference
    state = deps.state;

    // Data
    quests = deps.data.quests;

    // Functions
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    encounterEnemy = deps.combat.encounterEnemy;
    gainXp = deps.character.gainXp;
    checkQuestProgress = deps.quests.checkQuestProgress;
}

/**
 * Simulate exploration events
 */
export function simulateExploration() {
    if (state.gameState !== "exploring") return;

    setTimeout(() => {
        // Check for NPC Quest Encounter (10% chance if quests < 2)
        if (Object.keys(state.character.activeQuests).length < 2 && Math.random() < 0.10) {
            triggerNPCEvent();
            return;
        }

        const eventChance = Math.random();

        if (eventChance < 0.25) {
            // 25% Chance: Enemy
            encounterEnemy();
        } else if (eventChance < 0.40) {
            // 15% Chance: Abandoned Outpost
            const outpostLoot = ["Energy Cell", "Data Chip", "Rusty Pipe"][Math.floor(Math.random() * 3)];
            addLog(`You discovered an Abandoned Outpost and found a ${outpostLoot}.`);
            state.inventory.push(outpostLoot);
        } else if (eventChance < 0.55) {
            // 15% Chance: Ancient Ruins
            const xpGain = 15;
            addLog(`You explored Ancient Ruins and deciphered glyphs, gaining ${xpGain} XP.`);
            gainXp(xpGain);
        } else if (eventChance < 0.65) {
            // 10% Chance: Strange Anomaly
            addLog("You encountered a Strange Anomaly. Your energy is restored.");
            state.character.energy = state.character.maxEnergy;
        } else if (eventChance < 0.80) {
            // 15% Chance: Scrap Metal
            addLog("You found some scrap metal.");
            state.inventory.push("Scrap Metal");
            checkQuestProgress("collect", "Scrap Metal", 1);
        } else {
            // 20% Chance: Quiet
            addLog("The landscape is quiet... for now.");
        }

        updateUI();
    }, 2000);
}

/**
 * Trigger an NPC event with quest offer
 */
export function triggerNPCEvent() {
    const availableQuests = Object.values(quests).filter(q =>
        !state.character.activeQuests[q.id] && !state.character.completedQuests.includes(q.id)
    );

    if (availableQuests.length === 0) {
        // Fallback if no quests available
        addLog("You met a traveler, but they had nothing for you.");
        updateUI();
        return;
    }

    const randomQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];

    const modal = document.getElementById("eventModal");
    const title = document.getElementById("eventTitle");
    const desc = document.getElementById("eventDescription");
    const acceptBtn = document.getElementById("eventAcceptBtn");

    if (modal && title && desc && acceptBtn) {
        title.textContent = "NPC Encounter";
        desc.innerHTML = `A mysterious figure approaches you.<br><br>"Greetings, traveler. I have a job for you if you're interested."<br><br><strong>Quest: ${randomQuest.title}</strong><br>${randomQuest.description}`;

        acceptBtn.onclick = () => {
            // Import acceptQuest dynamically to avoid circular dependency
            import('./quests.js').then(questModule => {
                questModule.acceptQuest(randomQuest.id);
                closeEventModal();
                addLog(`You accepted the quest: ${randomQuest.title}`);
                updateUI();
            });
        };

        modal.style.display = "flex";
    }
}

/**
 * Close the event modal
 */
export function closeEventModal() {
    const modal = document.getElementById("eventModal");
    if (modal) {
        modal.style.display = "none";
        addLog("You parted ways with the stranger.");
        updateUI();
    }
}

/**
 * Travel deeper into the world
 */
export function travelDeeper() {
    addLog("Venturing deeper into the unknown...");
    simulateExploration();
}
