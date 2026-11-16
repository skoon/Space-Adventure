/**
 * Achievements System Module
 * Handles achievement registry, tracking, and rewards
 */

export const ACHIEVEMENTS = {
    first_blood: {
        id: "first_blood",
        title: "First Blood",
        description: "Defeat your first enemy.",
        reward: { credits: 100, text: "100 Credits" }
    },
    galaxy_gladiator: {
        id: "galaxy_gladiator",
        title: "Galaxy Gladiator",
        description: "Defeat 10 enemies.",
        reward: { credits: 300, text: "300 Credits" }
    },
    boss_slayer: {
        id: "boss_slayer",
        title: "Boss Slayer",
        description: "Defeat your first boss.",
        reward: { credits: 500, text: "500 Credits" }
    },
    wreckage_scavenger: {
        id: "wreckage_scavenger",
        title: "Wreckage Scavenger",
        description: "Complete a Derelict Ship run.",
        reward: { credits: 200, items: ["Scrap Metal", "Scrap Metal"], text: "200 Credits, 2x Scrap Metal" }
    },
    space_cadet: {
        id: "space_cadet",
        title: "Space Cadet",
        description: "Travel to Xylo Delta.",
        reward: { credits: 150, text: "150 Credits" }
    },
    deep_space_explorer: {
        id: "deep_space_explorer",
        title: "Deep Space Explorer",
        description: "Travel to Nebula Outpost.",
        reward: { credits: 300, items: ["Circuit Board"], text: "300 Credits, 1x Circuit Board" }
    },
    elite_soldier: {
        id: "elite_soldier",
        title: "Elite Soldier",
        description: "Reach Level 5.",
        reward: { credits: 250, text: "250 Credits" }
    },
    veteran_commander: {
        id: "veteran_commander",
        title: "Veteran Commander",
        description: "Reach Level 10.",
        reward: { credits: 600, items: ["Titanium Ingot"], text: "600 Credits, 1x Titanium Ingot" }
    },
    master_craftsman: {
        id: "master_craftsman",
        title: "Master Craftsman",
        description: "Craft 5 items.",
        reward: { credits: 150, text: "150 Credits" }
    },
    fully_loaded: {
        id: "fully_loaded",
        title: "Fully Loaded",
        description: "Upgrade any item to +5.",
        reward: { credits: 400, items: ["Plasma Core"], text: "400 Credits, 1x Plasma Core" }
    },
    legendary_gear: {
        id: "legendary_gear",
        title: "Legendary Gear",
        description: "Equip a Legendary item.",
        reward: { credits: 500, text: "500 Credits" }
    },
    galactic_tycoon: {
        id: "galactic_tycoon",
        title: "Galactic Tycoon",
        description: "Accumulate 1,000 credits in hand.",
        reward: { credits: 200, items: ["Titanium Ingot"], text: "200 Credits, 1x Titanium Ingot" }
    }
};

export const DAILY_CHALLENGES = [
    {
        id: "daily_enemies",
        title: "Combat Sweep",
        description: "Defeat 5 enemies in combat.",
        stat: "enemiesDefeated",
        target: 5,
        reward: { credits: 250, text: "250 Credits" }
    },
    {
        id: "daily_crafting",
        title: "Field Engineering",
        description: "Craft 2 items at the workshop.",
        stat: "itemsCrafted",
        target: 2,
        reward: { credits: 200, text: "200 Credits" }
    },
    {
        id: "daily_locations",
        title: "Sector Recon",
        description: "Visit or travel to 3 different destinations.",
        stat: "locationsVisited",
        target: 3,
        reward: { credits: 300, text: "300 Credits" }
    },
    {
        id: "daily_bosses",
        title: "Apex Threat",
        description: "Defeat 1 boss enemy.",
        stat: "bossesDefeated",
        target: 1,
        reward: { credits: 500, text: "500 Credits" }
    },
    {
        id: "daily_derelict",
        title: "Salvage Operation",
        description: "Complete 1 Derelict Ship exploration run.",
        stat: "derelictRuns",
        target: 1,
        reward: { credits: 350, text: "350 Credits" }
    },
    {
        id: "daily_credits",
        title: "Bounty Hunter",
        description: "Earn or collect 500 credits.",
        stat: "creditsEarned",
        target: 500,
        reward: { credits: 250, text: "250 Credits" }
    },
    {
        id: "daily_upgrades",
        title: "Arms Overhaul",
        description: "Upgrade any piece of equipment.",
        stat: "itemsUpgraded",
        target: 1,
        reward: { credits: 200, text: "200 Credits" }
    }
];

let state;
let addLog, updateUI, showDialog;

/**
 * Initialize the achievements module
 */
export function initAchievements(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showDialog = deps.ui.showDialog;
}

/**
 * Unlock an achievement and pay rewards
 */
export function unlockAchievement(id) {
    if (!state) return;
    state.achievements = state.achievements || [];
    
    if (state.achievements.includes(id)) return;

    const ach = ACHIEVEMENTS[id];
    if (!ach) return;

    state.achievements.push(id);

    // Apply rewards
    if (state.character && ach.reward) {
        if (ach.reward.credits) {
            state.character.credits = (state.character.credits || 0) + ach.reward.credits;
        }
        if (ach.reward.items) {
            ach.reward.items.forEach(item => {
                state.inventory.push(item);
            });
        }
    }

    const rewardText = ach.reward ? ach.reward.text : "None";
    addLog(`🏆 ACHIEVEMENT UNLOCKED: ${ach.title}! Reward: ${rewardText}`);

    // Show visual popup notification
    if (showDialog) {
        showDialog(
            "🏆 Achievement Unlocked!",
            `Congratulations! You unlocked:<br/><br/>
             <span class="text-xl font-bold text-yellow-400 cyber-glow-text">${ach.title}</span><br/>
             <span class="text-xs text-gray-300 italic">${ach.description}</span><br/><br/>
             <strong>Reward:</strong> <span class="text-green-400 font-bold">${rewardText}</span>`
        );
    }

    updateUI();

    // Trigger auto-save silently after 500ms
    setTimeout(() => {
        if (window.saveGame) {
            window.saveGame(true); // true means silent/autosave
        }
    }, 500);
}

/**
 * Check criteria and trigger achievements based on category updates
 */
export function checkAchievement(category, data) {
    if (!state || !state.character) return;
    
    state.stats = state.stats || {};
    state.achievements = state.achievements || [];

    switch (category) {
        case "combat":
            const defCount = state.stats.enemiesDefeated || 0;
            const bossCount = state.stats.bossesDefeated || 0;
            if (defCount >= 1) unlockAchievement("first_blood");
            if (defCount >= 10) unlockAchievement("galaxy_gladiator");
            if (bossCount >= 1) unlockAchievement("boss_slayer");
            break;

        case "derelict":
            if (data && data.completed) {
                unlockAchievement("wreckage_scavenger");
            }
            break;

        case "travel":
            if (data && data.locationId === "xylo_delta") unlockAchievement("space_cadet");
            if (data && data.locationId === "nebula_outpost") unlockAchievement("deep_space_explorer");
            break;

        case "level":
            const lvl = state.character.level || 1;
            if (lvl >= 5) unlockAchievement("elite_soldier");
            if (lvl >= 10) unlockAchievement("veteran_commander");
            break;

        case "craft":
            const craftCount = state.stats.itemsCrafted || 0;
            if (craftCount >= 5) unlockAchievement("master_craftsman");
            break;

        case "upgrade":
            if (data && data.level >= 5) {
                unlockAchievement("fully_loaded");
            }
            break;

        case "equip":
            if (data && data.rarity === "Legendary") {
                unlockAchievement("legendary_gear");
            }
            break;

        case "credits":
            const creds = state.character.credits || 0;
            if (creds >= 1000) {
                unlockAchievement("galactic_tycoon");
            }
            break;
    }
}

/**
 * Returns a date key formatted as 'YYYY-MM-DD'
 */
export function getTodayDateKey(date = new Date()) {
    const d = (date instanceof Date) ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Deterministically hash a string to a positive integer
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

/**
 * Deterministically pick 3 daily challenges for the given date
 */
export function getDailyChallenges(dateKey = getTodayDateKey()) {
    const seed = hashString(String(dateKey));
    const pool = [...DAILY_CHALLENGES];
    const selected = [];
    let currentSeed = seed;

    while (selected.length < 3 && pool.length > 0) {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        const index = Math.floor((currentSeed / 233280) * pool.length);
        selected.push(pool.splice(index, 1)[0]);
    }

    return selected;
}

/**
 * Initializes or rolls over state.dailyChallenges when the date changes
 */
export function ensureDailyChallengesState(dateKey = getTodayDateKey()) {
    if (!state) return null;

    if (!state.dailyChallenges || state.dailyChallenges.date !== dateKey) {
        state.dailyChallenges = {
            date: dateKey,
            progress: {},
            claimed: []
        };
    }

    state.dailyChallenges.progress = state.dailyChallenges.progress || {};
    state.dailyChallenges.claimed = state.dailyChallenges.claimed || [];
    return state.dailyChallenges;
}

/**
 * Increments progress for a given stat in today's daily challenges
 */
export function updateDailyProgress(statKey, amount = 1) {
    if (!state || !statKey) return;
    const daily = ensureDailyChallengesState();
    if (!daily) return;
    const current = daily.progress[statKey] || 0;
    daily.progress[statKey] = current + amount;
}

/**
 * Validates and claims a daily challenge reward
 */
export function claimDailyReward(challengeId) {
    if (!state || !state.character || !challengeId) return false;

    const todayState = ensureDailyChallengesState();
    if (!todayState) return false;

    // Check if already claimed
    if (todayState.claimed && todayState.claimed.includes(challengeId)) {
        return false;
    }

    // Check if challenge is in today's 3
    const todayChallenges = getDailyChallenges(todayState.date);
    const challenge = todayChallenges.find(c => c.id === challengeId);
    if (!challenge) return false;

    // Validate requirement met
    const currentProgress = (todayState.progress && todayState.progress[challenge.stat]) || 0;
    if (currentProgress < challenge.target) {
        return false;
    }

    // Award reward credits
    if (challenge.reward && challenge.reward.credits) {
        state.character.credits = (state.character.credits || 0) + challenge.reward.credits;
    }

    todayState.claimed.push(challengeId);

    const rewardText = challenge.reward ? challenge.reward.text : `${challenge.reward.credits} Credits`;
    if (addLog) {
        addLog(`🎯 DAILY CHALLENGE COMPLETED: ${challenge.title}! Reward: ${rewardText}`);
    }

    if (showDialog) {
        showDialog(
            "🎯 Daily Challenge Completed!",
            `You completed <strong>${challenge.title}</strong>!<br/><br/>
             Reward: <span class="text-green-400 font-bold">${rewardText}</span>`
        );
    }

    if (updateUI) {
        updateUI();
    }

    // Optional silent autosave trigger
    if (typeof window !== 'undefined' && window.saveGame) {
        window.saveGame(true);
    }

    return true;
}
