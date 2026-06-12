/**
 * Quest UI Module
 * Handles quest log rendering and interactions
 */

let state;
let quests;
let currentQuestTab = "active";

export function initQuestUI(deps) {
    state = deps.state;
    quests = deps.data.quests;
}

/**
 * Toggle quest log modal
 */
export function toggleQuestLog() {
    const modal = document.getElementById("questListModal"); // Wait, original was questLogModal?
    const modalReal = document.getElementById("questLogModal"); 
    
    // Check which ID is actually used in HTML. Based on ui.js line 519 it is "questLogModal"
    if (!modalReal) return;

    if (modalReal.style.display === "none" || modalReal.classList.contains("hidden")) {
        modalReal.classList.remove("hidden");
        modalReal.style.display = "flex";
        renderQuestList();
    } else {
        modalReal.classList.add("hidden");
        modalReal.style.display = "none";
    }
}

/**
 * Switch quest tab
 */
export function switchQuestTab(tab) {
    currentQuestTab = tab;

    // Update tab styles
    const activeBtn = document.getElementById("activeQuestsTab");
    const completedBtn = document.getElementById("completedQuestsTab");

    if (activeBtn && completedBtn) {
        if (tab === "active") {
            activeBtn.className = "flex-1 py-1 px-4 font-bold border-r border-yellow-900/50 crt-tab-active";
            completedBtn.className = "flex-1 py-1 px-4 font-bold crt-tab-inactive";
        } else {
            activeBtn.className = "flex-1 py-1 px-4 font-bold border-r border-yellow-900/50 crt-tab-inactive";
            completedBtn.className = "flex-1 py-1 px-4 font-bold crt-tab-active";
        }
    }

    renderQuestList();
}

/**
 * Render quest list
 */
export function renderQuestList() {
    const list = document.getElementById("questList");
    if (!list || !state.character) return;

    list.innerHTML = "";

    const questIds = currentQuestTab === "active"
        ? Object.keys(state.character.activeQuests)
        : state.character.completedQuests;

    if (questIds.length === 0) {
        list.innerHTML = `<div class="text-gray-400 text-center italic p-4">No ${currentQuestTab} quests.</div>`;
        return;
    }

    questIds.forEach(questId => {
        const quest = quests[questId];
        if (!quest) return;

        const div = document.createElement("div");
        div.className = "bg-gray-700 p-4 rounded border border-gray-600";

        let description = quest.description;
        let targetAmount = quest.amount;
        let targetTarget = quest.target;
        let progress = 0;
        let progressText = "";

        if (currentQuestTab === "active") {
            const activeQuest = state.character.activeQuests[questId];
            progress = activeQuest.progress;

            // Handle multi-step quests
            if (quest.steps && quest.steps.length > 0) {
                const currentStepIndex = activeQuest.currentStep || 0;
                if (currentStepIndex < quest.steps.length) {
                    const step = quest.steps[currentStepIndex];
                    if (step.description) description = step.description; 

                    targetAmount = step.amount;
                    targetTarget = step.target;
                }
            }

            const percentage = Math.min(100, (progress / targetAmount) * 100);
            progressText = `
                <div class="mt-2">
                    <div class="flex justify-between text-sm text-gray-300 mb-1">
                        <span>Progress: ${progress}/${targetAmount} ${targetTarget}s</span>
                        <span>${Math.round(percentage)}%</span>
                    </div>
                    <div class="w-full bg-gray-800 rounded-full h-2">
                        <div class="bg-yellow-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        } else {
            progressText = `<div class="mt-2 text-green-400 text-sm font-bold">✅ Completed</div>`;
        }

        div.innerHTML = `
            <h3 class="text-lg font-bold text-yellow-400">${quest.title}</h3>
            <p class="text-gray-300 text-sm mt-1">${description}</p>
            <div class="mt-2 text-xs text-gray-400">
                Rewards: ${quest.rewards.xp ? `${quest.rewards.xp} XP` : ""} ${quest.rewards.items ? `+ ${quest.rewards.items.join(", ")}` : ""}
            </div>
            ${progressText}
        `;

        list.appendChild(div);
    });
}

/**
 * Show Job Board Modal
 */
export function showJobBoard() {
    const modal = document.getElementById("jobBoardModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.style.display = "flex";
    renderJobBoardList();
}

/**
 * Render Job Board Postings
 */
export function renderJobBoardList() {
    const container = document.getElementById("jobBoardContainer");
    if (!container) return;

    container.innerHTML = "";

    import('../quests.js').then(m => {
        const boardQuests = m.getJobBoardQuests();

        if (boardQuests.length === 0) {
            container.innerHTML = `<div class="text-gray-400 text-center col-span-3 italic p-8">No contracts available in this sector.</div>`;
            return;
        }

        boardQuests.forEach(quest => {
            const card = document.createElement("div");
            card.className = "bg-gray-800/80 p-4 border border-cyan-900/40 rounded flex flex-col justify-between shadow-inner";

            let rewardsText = "";
            if (quest.rewards) {
                if (quest.rewards.xp) rewardsText += `${quest.rewards.xp} XP `;
                if (quest.rewards.items) rewardsText += `+ [${quest.rewards.items.join(", ")}]`;
            }

            card.innerHTML = `
                <div class="mb-4">
                    <h3 class="text-sm font-bold text-cyan-400 mb-2 font-mono uppercase tracking-wide">${quest.title}</h3>
                    <p class="text-xs text-gray-300 mb-2 font-sans leading-relaxed">${quest.description}</p>
                    <div class="text-[10px] text-yellow-500 font-mono mt-3">
                        Rewards: ${rewardsText}
                    </div>
                </div>
                <button
                    id="acceptBtn_${quest.id}"
                    class="w-full py-2 px-3 bg-cyan-950/60 hover:bg-cyan-900/85 border border-cyan-800 text-cyan-400 rounded font-bold font-mono text-[10px] uppercase tracking-widest transition-all shadow-[0_0_6px_rgba(6,182,212,0.15)]"
                >
                    Accept Contract
                </button>
            `;

            const btn = card.querySelector(`#acceptBtn_${quest.id}`);
            if (btn) {
                btn.onclick = () => {
                    m.acceptQuest(quest.id);
                    renderJobBoardList(); // Refresh board to replace accepted quest
                };
            }

            container.appendChild(card);
        });
    });
}
