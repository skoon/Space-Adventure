/**
 * Achievements UI Module
 * Handles displaying and rendering sector achievements log,
 * daily challenges, and local leaderboards.
 */

import {
    ACHIEVEMENTS,
    getDailyChallenges,
    ensureDailyChallengesState,
    claimDailyReward,
    getTodayDateKey
} from '../achievements.js';

import {
    calculateRunScore,
    submitScore,
    getLeaderboard,
    clearLeaderboard
} from '../network.js';

let state;
let currentTab = 'achievements'; // 'achievements' | 'daily' | 'leaderboard'

export function initAchievementsUI(deps) {
    state = deps.state;
}

export function getActiveTab() {
    return currentTab;
}

/**
 * Ensures tab navigation bar exists in DOM inside #achievementsModal
 */
function ensureTabsInDOM() {
    let tabsBar = document.getElementById("achievementsTabs");
    if (!tabsBar) {
        const list = document.getElementById("achievementsList");
        if (!list || !list.parentNode) return;

        tabsBar = document.createElement("div");
        tabsBar.id = "achievementsTabs";
        tabsBar.className = "flex gap-2 mb-4 border-b border-amber-800/60 pb-2";

        const tabs = [
            { id: 'achievements', label: '🏆 MILESTONES' },
            { id: 'daily', label: '🎯 DAILY CHALLENGES' },
            { id: 'leaderboard', label: '📊 LEADERBOARD' }
        ];

        tabs.forEach(t => {
            const btn = document.createElement("button");
            btn.id = `tab_${t.id}`;
            btn.dataset.tab = t.id;
            btn.textContent = t.label;
            btn.className = "px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider cursor-pointer transition-all";
            btn.addEventListener("click", () => switchTab(t.id));
            tabsBar.appendChild(btn);
        });

        list.parentNode.insertBefore(tabsBar, list);
    }
    updateTabButtonStyles();
}

/**
 * Updates tab button styles according to the currently active tab
 */
function updateTabButtonStyles() {
    const tabsBar = document.getElementById("achievementsTabs");
    if (!tabsBar) return;

    const buttons = tabsBar.querySelectorAll("button[data-tab]");
    buttons.forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === currentTab) {
            btn.className = "px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider cursor-pointer transition-all bg-amber-500 text-black border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]";
        } else {
            btn.className = "px-3 py-1.5 rounded text-xs font-mono font-semibold tracking-wider cursor-pointer transition-all bg-gray-800/70 text-amber-400/80 hover:bg-gray-700/80 hover:text-amber-300 border border-gray-700/60";
        }
    });
}

/**
 * Switch active modal tab and re-render contents
 */
export function switchTab(tabName) {
    currentTab = tabName;
    ensureTabsInDOM();
    updateTabButtonStyles();

    if (tabName === 'daily') {
        renderDailyChallengesTab();
    } else if (tabName === 'leaderboard') {
        renderLeaderboardTab();
    } else {
        renderAchievementsList();
    }
}

/**
 * Open the Achievements modal
 */
export function showAchievementsUI() {
    const modal = document.getElementById("achievementsModal");
    if (modal) {
        ensureTabsInDOM();
        switchTab(currentTab || 'achievements');
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    }
}

/**
 * Close the Achievements modal
 */
export function closeAchievementsUI() {
    const modal = document.getElementById("achievementsModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
}

/**
 * Render the achievements list (Milestones tab)
 */
export function renderAchievementsList() {
    const list = document.getElementById("achievementsList");
    if (!list || !state) return;

    ensureTabsInDOM();
    currentTab = 'achievements';
    updateTabButtonStyles();

    list.className = "grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-amber";
    list.innerHTML = "";

    state.achievements = state.achievements || [];
    state.stats = state.stats || {};

    Object.values(ACHIEVEMENTS).forEach(ach => {
        const unlocked = state.achievements.includes(ach.id);

        // Calculate progress for measurable achievements
        let hasProgress = false;
        let progressVal = 0;
        let currentVal = 0;
        let maxVal = 0;

        if (!unlocked) {
            if (ach.id === "galaxy_gladiator") {
                hasProgress = true;
                currentVal = state.stats.enemiesDefeated || 0;
                maxVal = 10;
                progressVal = Math.min(maxVal, currentVal) / maxVal;
            } else if (ach.id === "master_craftsman") {
                hasProgress = true;
                currentVal = state.stats.itemsCrafted || 0;
                maxVal = 5;
                progressVal = Math.min(maxVal, currentVal) / maxVal;
            } else if (ach.id === "elite_soldier") {
                hasProgress = true;
                currentVal = state.character.level || 1;
                maxVal = 5;
                progressVal = Math.min(maxVal, currentVal) / maxVal;
            } else if (ach.id === "veteran_commander") {
                hasProgress = true;
                currentVal = state.character.level || 1;
                maxVal = 10;
                progressVal = Math.min(maxVal, currentVal) / maxVal;
            } else if (ach.id === "galactic_tycoon") {
                hasProgress = true;
                currentVal = state.character.credits || 0;
                maxVal = 1000;
                progressVal = Math.min(maxVal, currentVal) / maxVal;
            }
        }

        let progressHtml = "";
        if (unlocked) {
            progressHtml = `
                <div class="mt-3 text-xs text-amber-400 font-bold flex items-center gap-1.5 bg-amber-950/40 p-1.5 rounded border border-amber-900/30">
                    <span>🏆</span> UNLOCKED
                </div>
            `;
        } else if (hasProgress) {
            const pct = Math.round(progressVal * 100);
            progressHtml = `
                <div class="mt-3 bg-gray-800/60 p-2 rounded border border-gray-700/50">
                    <div class="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                        <span>Progress: ${currentVal}/${maxVal}</span>
                        <span>${pct}%</span>
                    </div>
                    <div class="w-full bg-gray-900 rounded-full h-1.5">
                        <div class="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        } else {
            progressHtml = `
                <div class="mt-3 text-xs text-gray-500 font-semibold flex items-center gap-1.5 bg-gray-800/40 p-1.5 rounded border border-gray-700/30">
                    <span>🔒</span> LOCKED
                </div>
            `;
        }

        const card = document.createElement("div");
        card.className = `p-4 rounded border transition-all duration-300 ${
            unlocked 
                ? 'bg-amber-950/20 border-amber-600/60 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                : 'bg-gray-800/30 border-gray-700/40 opacity-75'
        }`;

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <h3 class="font-bold text-base ${unlocked ? 'text-amber-400' : 'text-gray-400'} font-mono uppercase tracking-wider">${ach.title}</h3>
            </div>
            <p class="text-xs ${unlocked ? 'text-gray-300' : 'text-gray-500'} mt-1 leading-relaxed">${ach.description}</p>
            
            <div class="mt-2 text-[10px] ${unlocked ? 'text-green-400/80' : 'text-gray-500'} font-semibold">
                Reward: ${ach.reward.text}
            </div>
            
            ${progressHtml}
        `;

        list.appendChild(card);
    });
}

/**
 * Render the Daily Challenges tab
 */
export function renderDailyChallengesTab() {
    const list = document.getElementById("achievementsList");
    if (!list || !state) return;

    ensureTabsInDOM();
    currentTab = 'daily';
    updateTabButtonStyles();

    list.className = "flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-amber";
    list.innerHTML = "";

    const todayKey = getTodayDateKey();
    const dailyState = ensureDailyChallengesState(todayKey);
    const challenges = getDailyChallenges(todayKey);

    // Header card
    const header = document.createElement("div");
    header.className = "p-3 rounded bg-amber-950/20 border border-amber-800/40 flex justify-between items-center";
    header.innerHTML = `
        <div>
            <div class="text-xs text-amber-500 font-mono font-bold tracking-wider">DAILY DIRECTIVES // ${todayKey}</div>
            <div class="text-[11px] text-gray-400">Complete operations today for bonus credits. Rotates daily at midnight.</div>
        </div>
        <div class="text-xs font-mono text-amber-400 bg-amber-900/30 px-2 py-1 rounded border border-amber-800/50">
            COMPLETED: ${(dailyState?.claimed || []).length} / ${challenges.length}
        </div>
    `;
    list.appendChild(header);

    // Challenges list
    challenges.forEach(ch => {
        const progress = Math.min(ch.target, (dailyState?.progress?.[ch.stat] || 0));
        const pct = Math.min(100, Math.floor((progress / ch.target) * 100));
        const isComplete = progress >= ch.target;
        const isClaimed = Boolean(dailyState?.claimed?.includes(ch.id));

        const card = document.createElement("div");
        card.className = `p-4 rounded border transition-all duration-300 ${
            isClaimed
                ? 'bg-green-950/20 border-green-800/50'
                : isComplete
                    ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                    : 'bg-gray-800/30 border-gray-700/40'
        }`;

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-sm ${isClaimed ? 'text-green-400' : isComplete ? 'text-amber-400' : 'text-gray-300'} font-mono uppercase tracking-wider">${ch.title}</h3>
                    <p class="text-xs text-gray-400 mt-0.5">${ch.description}</p>
                </div>
                <div class="text-right">
                    <span class="text-xs font-mono font-bold text-green-400">+${ch.reward.credits} CR</span>
                </div>
            </div>

            <div class="mt-3 bg-gray-900/80 p-2 rounded border border-gray-800">
                <div class="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span>PROGRESS: ${progress} / ${ch.target}</span>
                    <span>${pct}%</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div class="${isClaimed ? 'bg-green-500' : 'bg-amber-500'} h-1.5 rounded-full transition-all duration-300" style="width: ${pct}%"></div>
                </div>
            </div>

            <div class="mt-3 flex justify-between items-center pt-2 border-t border-gray-800/60">
                <span class="text-[10px] text-gray-500 font-mono">REWARD: ${ch.reward.text}</span>
                <div class="action-slot"></div>
            </div>
        `;

        const actionSlot = card.querySelector(".action-slot");
        if (isClaimed) {
            const badge = document.createElement("span");
            badge.className = "text-xs font-mono font-bold text-green-400 flex items-center gap-1 bg-green-950/40 px-2.5 py-1 rounded border border-green-800/40";
            badge.textContent = "✓ CLAIMED";
            actionSlot.appendChild(badge);
        } else if (isComplete) {
            const claimBtn = document.createElement("button");
            claimBtn.className = "claim-daily-btn bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-3 py-1 rounded text-xs transition-all shadow-[0_0_8px_rgba(245,158,11,0.3)] cursor-pointer";
            claimBtn.textContent = "Claim Reward";
            claimBtn.addEventListener("click", () => {
                claimDailyReward(ch.id);
                renderDailyChallengesTab();
            });
            actionSlot.appendChild(claimBtn);
        } else {
            const incompleteBtn = document.createElement("button");
            incompleteBtn.disabled = true;
            incompleteBtn.className = "bg-gray-800/50 text-gray-500 font-mono text-xs px-2.5 py-1 rounded border border-gray-700/50 cursor-not-allowed";
            incompleteBtn.textContent = "Incomplete";
            actionSlot.appendChild(incompleteBtn);
        }

        list.appendChild(card);
    });
}

/**
 * Render the Local Leaderboard tab
 */
export function renderLeaderboardTab() {
    const list = document.getElementById("achievementsList");
    if (!list || !state) return;

    ensureTabsInDOM();
    currentTab = 'leaderboard';
    updateTabButtonStyles();

    list.className = "flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar-amber";
    list.innerHTML = "";

    const char = state.character || {};
    const currentScore = calculateRunScore(state);
    const entries = getLeaderboard(10);

    // Current expedition score panel
    const submitPanel = document.createElement("div");
    submitPanel.className = "p-3 rounded bg-amber-950/20 border border-amber-800/40 flex flex-wrap justify-between items-center gap-2";
    submitPanel.innerHTML = `
        <div>
            <div class="text-xs text-amber-500 font-mono font-bold tracking-wider">CURRENT EXPEDITION SCORE</div>
            <div class="text-sm font-mono font-bold text-white mt-0.5">
                <span class="text-amber-400">${currentScore.toLocaleString()}</span> PTS
                <span class="text-xs text-gray-400 font-normal ml-2">(${char.name || 'Commander'} - Lvl ${char.level || 1} ${char.role || 'Explorer'})</span>
            </div>
        </div>
        <button id="submitScoreBtn" class="bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-4 py-1.5 rounded text-xs transition-all shadow-[0_0_8px_rgba(245,158,11,0.3)] cursor-pointer">
            Submit Current Score
        </button>
    `;

    const submitBtn = submitPanel.querySelector("#submitScoreBtn");
    submitBtn.addEventListener("click", () => {
        submitScore({
            name: char.name || 'Commander',
            role: char.role || 'Explorer',
            level: char.level || 1,
            score: currentScore,
            kills: state.stats?.enemiesDefeated || 0,
            date: new Date().toISOString()
        });
        renderLeaderboardTab();
    });

    list.appendChild(submitPanel);

    // Leaderboard table container
    const tableContainer = document.createElement("div");
    tableContainer.className = "rounded border border-gray-700/60 overflow-hidden bg-gray-900/40";

    if (entries.length === 0) {
        tableContainer.innerHTML = `
            <div class="text-center py-8 text-gray-400 font-mono text-xs">
                No local leaderboard entries yet.<br/>
                Submit your current expedition score above!
            </div>
        `;
    } else {
        const table = document.createElement("table");
        table.className = "w-full text-left font-mono text-xs";
        table.innerHTML = `
            <thead class="bg-gray-800/80 text-amber-500 border-b border-gray-700 text-[10px] uppercase tracking-wider">
                <tr>
                    <th class="py-2 px-3">#</th>
                    <th class="py-2 px-3">Commander</th>
                    <th class="py-2 px-3">Role</th>
                    <th class="py-2 px-3 text-center">Lvl</th>
                    <th class="py-2 px-3 text-right">Score</th>
                    <th class="py-2 px-3 text-right">Kills</th>
                    <th class="py-2 px-3 text-right">Date</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/60 text-gray-300">
            </tbody>
        `;

        const tbody = table.querySelector("tbody");
        entries.forEach((e, idx) => {
            const tr = document.createElement("tr");
            tr.className = `hover:bg-amber-950/10 transition-colors ${idx === 0 ? 'text-amber-300 font-bold' : ''}`;

            const rankBadge = idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`;
            const dateStr = e.date ? String(e.date).split('T')[0] : '';

            tr.innerHTML = `
                <td class="py-2 px-3 font-bold">${rankBadge}</td>
                <td class="py-2 px-3 text-white font-semibold">${e.name || 'Commander'}</td>
                <td class="py-2 px-3 text-gray-400">${e.role || 'Explorer'}</td>
                <td class="py-2 px-3 text-center text-gray-400">${e.level || 1}</td>
                <td class="py-2 px-3 text-right font-bold text-amber-400">${(e.score || 0).toLocaleString()}</td>
                <td class="py-2 px-3 text-right text-gray-400">${e.kills || 0}</td>
                <td class="py-2 px-3 text-right text-[10px] text-gray-500">${dateStr}</td>
            `;
            tbody.appendChild(tr);
        });

        tableContainer.appendChild(table);
    }

    list.appendChild(tableContainer);
}
