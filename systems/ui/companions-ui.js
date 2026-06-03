/**
 * Companions UI Module
 * Coordinates UI rendering for companions inside the spacecraft hub
 */

import { COMPANIONS, getActiveCompanion, setActiveCompanion, recruitCompanion, talkToCompanion, giftToCompanion, giftCreditsToCompanion } from '../companions.js';

let state;
let updateUI, showDialog;

export function initCompanionsUI(deps) {
    state = deps.state;
    updateUI = deps.ui.updateUI;
    showDialog = deps.ui.showDialog;
}

/**
 * Render companions list inside the Crew Quarter panel
 */
export function renderCompanionsTab() {
    const container = document.getElementById('shipCrewPanel');
    if (!container) return;

    container.innerHTML = '';

    const credits = state.character.credits || 0;
    const activeId = state.activeCompanion;

    // Outer layout wrapper (terminal style)
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-4';

    // Roster grid
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';

    Object.keys(COMPANIONS).forEach(id => {
        const data = COMPANIONS[id];
        const record = state.companions[id];
        const isUnlocked = record.unlocked;

        const card = document.createElement('div');
        card.className = `p-4 rounded border flex flex-col justify-between h-full bg-black/40 ${
            isUnlocked 
                ? (activeId === id ? 'border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'border-gray-700') 
                : 'border-gray-800 opacity-60'
        }`;

        // Top section: Avatar & Basic info
        const topSec = document.createElement('div');
        topSec.className = 'mb-3';

        const header = document.createElement('div');
        header.className = 'flex items-center gap-3 mb-2';

        const avatar = document.createElement('div');
        avatar.className = 'text-3xl p-2 bg-gray-800 rounded border border-gray-700';
        avatar.textContent = data.avatar;

        const nameRole = document.createElement('div');
        nameRole.className = 'flex-grow';
        const name = document.createElement('div');
        name.className = 'font-bold text-white text-base';
        name.textContent = data.name;
        const role = document.createElement('div');
        role.className = 'text-xs text-cyan-400 font-mono';
        role.textContent = data.role;

        nameRole.appendChild(name);
        nameRole.appendChild(role);
        header.appendChild(avatar);
        header.appendChild(nameRole);
        topSec.appendChild(header);

        if (!isUnlocked) {
            // Locked companion info
            const recruitInfo = document.createElement('div');
            recruitInfo.className = 'text-xs text-gray-500 mt-2 space-y-2';
            recruitInfo.innerHTML = `
                <p>Ability: <strong>${data.abilityName}</strong></p>
                <p class="italic">"${data.dialogues.recruit}"</p>
                <div class="pt-2">
                    <span class="text-yellow-500 font-bold">Cost: ${data.dialogues.recruitCost} credits</span>
                </div>
            `;
            topSec.appendChild(recruitInfo);

            // Recruit button
            const recruitBtn = document.createElement('button');
            recruitBtn.textContent = `Hire ${data.name}`;
            recruitBtn.disabled = credits < data.dialogues.recruitCost;
            recruitBtn.className = `w-full py-2 px-3 mt-4 rounded font-bold text-xs transition-colors ${
                credits >= data.dialogues.recruitCost
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
            }`;
            recruitBtn.onclick = () => {
                const success = recruitCompanion(id);
                if (success) {
                    renderCompanionsTab();
                    if (updateUI) updateUI();
                }
            };

            card.appendChild(topSec);
            card.appendChild(recruitBtn);
        } else {
            // Unlocked companion stats & trust
            const trust = record.trust || 0;
            const level = record.level || 1;
            
            // Calculate next level thresholds
            let maxTrustVal = 100;
            let currentTrustVal = trust;
            let barPct = (trust / maxTrustVal) * 100;
            let levelLabel = `Trust Level ${level}`;
            if (level === 3) {
                levelLabel += " (Max)";
                barPct = 100;
                currentTrustVal = 100;
            }

            const trustSec = document.createElement('div');
            trustSec.className = 'space-y-2 text-xs mt-2';
            
            // Trust Progress
            const trustHeader = document.createElement('div');
            trustHeader.className = 'flex justify-between text-gray-400 font-mono';
            trustHeader.innerHTML = `<span>${levelLabel}</span><span>${currentTrustVal}/${maxTrustVal} XP</span>`;
            
            const progressBg = document.createElement('div');
            progressBg.className = 'w-full bg-gray-900 rounded-full h-2 border border-gray-800';
            const progressFill = document.createElement('div');
            progressFill.className = 'bg-cyan-500 h-1.5 rounded-full shadow-[0_0_5px_rgba(6,182,212,0.6)] transition-all';
            progressFill.style.width = `${barPct}%`;
            progressBg.appendChild(progressFill);

            // Ability Desc
            const abilityText = document.createElement('p');
            abilityText.className = 'text-gray-300 mt-2';
            abilityText.innerHTML = `Skill: <strong class="text-cyan-400">${data.abilityName}</strong><br><span class="text-gray-400">${data.abilityDesc}</span>`;

            trustSec.appendChild(trustHeader);
            trustSec.appendChild(progressBg);
            trustSec.appendChild(abilityText);
            topSec.appendChild(trustSec);

            // Gifting Options from Inventory
            const interactSec = document.createElement('div');
            interactSec.className = 'mt-3 pt-3 border-t border-gray-800 space-y-2';

            const talkBtn = document.createElement('button');
            talkBtn.className = 'w-full py-1 px-2 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700/50 rounded font-bold text-xs text-indigo-200 transition-colors';
            talkBtn.innerHTML = '💬 Chat';
            talkBtn.onclick = () => {
                const text = talkToCompanion(id);
                showDialog(`💬 Crew Comm: ${data.name}`, `"${text}"`, [{ text: "Close", action: () => {} }]);
                renderCompanionsTab();
            };
            interactSec.appendChild(talkBtn);

            // Gift materials
            const eligibleGifts = ["Data Chip", "Scrap Metal", "Bio-Gel", "Nanites", "Alien Crystal", "Quantum Chip"].filter(
                giftName => state.inventory.includes(giftName)
            );

            if (eligibleGifts.length > 0 && level < 3) {
                const giftWrapper = document.createElement('div');
                giftWrapper.className = 'flex flex-col gap-1';
                
                const giftLabel = document.createElement('div');
                giftLabel.className = 'text-[10px] text-gray-500 font-bold uppercase';
                giftLabel.textContent = 'Gift Items:';
                giftWrapper.appendChild(giftLabel);

                // Show up to 3 gift options to prevent overflow
                eligibleGifts.slice(0, 3).forEach(giftName => {
                    const isPreferred = data.preferredGifts.includes(giftName);
                    const giftBtn = document.createElement('button');
                    giftBtn.className = `w-full py-1 px-2 text-[10px] font-mono border rounded transition-colors text-left flex justify-between items-center ${
                        isPreferred 
                            ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-800 text-amber-200' 
                            : 'bg-gray-900/80 hover:bg-gray-800 border-gray-700 text-gray-300'
                    }`;
                    giftBtn.innerHTML = `<span>🎁 ${giftName}</span><span class="font-bold">${isPreferred ? '+25 XP 🔥' : '+10 XP'}</span>`;
                    giftBtn.onclick = () => {
                        giftToCompanion(id, giftName);
                        renderCompanionsTab();
                    };
                    giftWrapper.appendChild(giftBtn);
                });
                interactSec.appendChild(giftWrapper);
            }

            // Gift Credits (Enabled if level < 3)
            if (level < 3) {
                const creditsBtn = document.createElement('button');
                creditsBtn.className = `w-full py-1 px-2 text-[10px] font-mono bg-emerald-950/40 border border-emerald-800 text-emerald-200 hover:bg-emerald-900/50 rounded transition-colors text-left flex justify-between items-center ${
                    credits < 100 ? 'opacity-50 cursor-not-allowed' : ''
                }`;
                creditsBtn.innerHTML = `<span>💵 Fund Research (100 cr)</span><span class="font-bold">+10 XP</span>`;
                creditsBtn.disabled = credits < 100;
                creditsBtn.onclick = () => {
                    giftCreditsToCompanion(id, 100);
                    renderCompanionsTab();
                };
                interactSec.appendChild(creditsBtn);
            }

            // Active/Set Active Action
            const actionBtn = document.createElement('button');
            if (activeId === id) {
                actionBtn.textContent = 'Active Crew Member';
                actionBtn.className = 'w-full py-2 px-3 mt-4 rounded font-bold text-xs bg-cyan-950 border border-cyan-800 text-cyan-300 cursor-default';
            } else {
                actionBtn.textContent = 'Deploy Companion';
                actionBtn.className = 'w-full py-2 px-3 mt-4 rounded font-bold text-xs bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-colors';
                actionBtn.onclick = () => {
                    setActiveCompanion(id);
                    renderCompanionsTab();
                };
            }

            card.appendChild(topSec);
            card.appendChild(interactSec);
            card.appendChild(actionBtn);
        }

        grid.appendChild(card);
    });

    wrapper.appendChild(grid);
    container.appendChild(wrapper);
}
