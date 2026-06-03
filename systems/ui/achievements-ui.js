/**
 * Achievements UI Module
 * Handles displaying and rendering sector achievements log
 */

import { ACHIEVEMENTS } from '../achievements.js';

let state;

export function initAchievementsUI(deps) {
    state = deps.state;
}

/**
 * Open the Achievements modal
 */
export function showAchievementsUI() {
    const modal = document.getElementById("achievementsModal");
    if (modal) {
        renderAchievementsList();
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
 * Render the achievements list
 */
export function renderAchievementsList() {
    const list = document.getElementById("achievementsList");
    if (!list || !state) return;

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
