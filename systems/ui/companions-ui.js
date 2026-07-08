/**
 * Companions UI Module
 * Coordinates UI rendering for companions inside the spacecraft hub
 */

import { 
    COMPANIONS, getActiveCompanion, setActiveCompanion, recruitCompanion, 
    talkToCompanion, giftToCompanion, giftCreditsToCompanion, getRecruitCost, 
    canRecruitCompanion, CREW_PASSIVES, setActiveCrewDirective 
} from '../companions.js';
import { acceptQuest } from '../quests.js';
import { t } from '../theme-engine.js';

let state;
let updateUI, showDialog;

export function initCompanionsUI(deps, callbacks = {}) {
    state = deps.state;
    updateUI = callbacks.updateUI || (deps.ui && deps.ui.updateUI) || window.updateUI;
    showDialog = callbacks.showDialog || (deps.ui && deps.ui.showDialog) || window.showDialog;
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
    wrapper.className = 'space-y-6';

    // ==========================================
    // 1. CAPTAIN'S CABIN DIRECTIVES & SYNERGIES PANEL
    // ==========================================
    const directivesPanel = document.createElement('div');
    directivesPanel.className = 'p-4 rounded border border-cyan-800 bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]';
    
    const directivesHeader = document.createElement('div');
    directivesHeader.className = 'border-b border-cyan-800 pb-2 mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2';
    
    const directivesTitle = document.createElement('h3');
    directivesTitle.className = 'text-base font-bold text-cyan-400 tracking-wider font-mono';
    directivesTitle.textContent = t('>> CABIN DIRECTIVES & SYNERGY MODULE <<');
    
    const activeDirectiveLabel = document.createElement('div');
    activeDirectiveLabel.className = 'text-xs font-mono bg-black/50 border border-cyan-800 px-3 py-1 rounded';
    const activeDirName = state.activeCrewDirective ? t(CREW_PASSIVES[state.activeCrewDirective].name) : t('NONE');
    activeDirectiveLabel.innerHTML = t(`Active Directive: <span class="text-cyan-400 font-bold">${activeDirName}</span>`);
    
    directivesHeader.appendChild(directivesTitle);
    directivesHeader.appendChild(activeDirectiveLabel);
    directivesPanel.appendChild(directivesHeader);

    // Scan for unlocked passives
    const vanceTrust = state.companions?.vance?.unlocked ? (state.companions.vance.trust || 0) : 0;
    const lyraTrust = state.companions?.lyra?.unlocked ? (state.companions.lyra.trust || 0) : 0;
    const apexTrust = state.companions?.apex?.unlocked ? (state.companions.apex.trust || 0) : 0;

    const unlockedDirectives = [];
    if (vanceTrust >= 50) unlockedDirectives.push("heavy_plating");
    if (vanceTrust >= 100) unlockedDirectives.push("overcharged_shield");
    if (lyraTrust >= 50) unlockedDirectives.push("nano_healer");
    if (lyraTrust >= 100) unlockedDirectives.push("emergency_protocol");
    if (apexTrust >= 50) unlockedDirectives.push("precision_focus");
    if (apexTrust >= 100) unlockedDirectives.push("weakpoint_analysis");

    // Synergies (requires both companion trusts >= 50)
    if (vanceTrust >= 50 && lyraTrust >= 50) unlockedDirectives.push("steel_fortress");
    if (vanceTrust >= 50 && apexTrust >= 50) unlockedDirectives.push("scrapper_smugglers");
    if (lyraTrust >= 50 && apexTrust >= 50) unlockedDirectives.push("tactical_doctor");

    if (unlockedDirectives.length === 0) {
        const noDirectivesMsg = document.createElement('div');
        noDirectivesMsg.className = 'text-xs text-gray-500 italic py-2';
        noDirectivesMsg.textContent = t('No Cabin Directives or Synergy Traits unlocked. (Build Trust with companions to Level 2+ to unlock.)');
        directivesPanel.appendChild(noDirectivesMsg);
    } else {
        const directivesGrid = document.createElement('div');
        directivesGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';
        
        unlockedDirectives.forEach(dirId => {
            const data = CREW_PASSIVES[dirId];
            const isActive = state.activeCrewDirective === dirId;
            
            const dirCard = document.createElement('div');
            dirCard.className = `p-3 rounded border text-xs flex flex-col justify-between transition-all bg-black/30 ${
                isActive 
                    ? 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)] bg-cyan-950/10' 
                    : 'border-gray-800 hover:border-gray-700'
            }`;
            
            const cardInfo = document.createElement('div');
            cardInfo.className = 'space-y-1';
            
            const cardTitle = document.createElement('div');
            cardTitle.className = `font-bold ${isActive ? 'text-cyan-400 font-mono' : 'text-gray-300'}`;
            cardTitle.textContent = t(data.name);
            
            const cardDesc = document.createElement('div');
            cardDesc.className = 'text-gray-400 text-[11px]';
            cardDesc.textContent = t(data.desc);
            
            cardInfo.appendChild(cardTitle);
            cardInfo.appendChild(cardDesc);
            
            const actionBtn = document.createElement('button');
            actionBtn.className = `mt-3 py-1.5 px-3 rounded font-mono font-bold text-[10px] w-full transition-all ${
                isActive 
                    ? 'bg-red-950/40 border border-red-800 text-red-400 hover:bg-red-900/50' 
                    : 'bg-cyan-950/40 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/50'
            }`;
            actionBtn.textContent = isActive ? t('DEACTIVATE DIRECTIVE') : t('ACTIVATE DIRECTIVE');
            actionBtn.onclick = () => {
                if (isActive) {
                    setActiveCrewDirective(null);
                } else {
                    setActiveCrewDirective(dirId);
                }
                renderCompanionsTab();
            };
            
            dirCard.appendChild(cardInfo);
            dirCard.appendChild(actionBtn);
            directivesGrid.appendChild(dirCard);
        });
        
        directivesPanel.appendChild(directivesGrid);
    }
    wrapper.appendChild(directivesPanel);

    // ==========================================
    // 2. CREW CABINS SECTION
    // ==========================================
    const cabinsTitle = document.createElement('h3');
    cabinsTitle.className = 'text-base font-bold text-gray-300 tracking-wider font-mono';
    cabinsTitle.textContent = t('>> CREW CABINS & HOUSING <<');
    wrapper.appendChild(cabinsTitle);

    // Roster grid
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-6';

    const cabinRooms = {
        vance: {
            title: "Vance's Heavy Scrap Workshop",
            desc: "The room is littered with copper wiring, half-dismantled weapon chassis, and a heavy scent of hydraulic oil. A makeshift workbench dominates the corner."
        },
        lyra: {
            title: "Dr. Lyra's Clinical Lab",
            desc: "Sterile and impeccably clean. Fluorescent tubes illuminate shelves of bio-gels, a neat surgical cot, and a terminal displaying DNA sequence graphs."
        },
        apex: {
            title: "Apex's Smuggler Holdout",
            desc: "Draped in dim amber lights. A Sabacc table sits in the center with holograms of playing cards. Crates of unlabeled contraband are piled against the wall."
        }
    };

    Object.keys(COMPANIONS).forEach(id => {
        const data = COMPANIONS[id];
        const record = state.companions[id];
        const isUnlocked = record.unlocked;

        const card = document.createElement('div');
        card.className = `p-4 rounded border flex flex-col justify-between h-full bg-black/40 ${
            isUnlocked 
                ? (activeId === id ? 'border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'border-gray-700') 
                : 'border-gray-900 opacity-50 bg-black/60 border-dashed'
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
        name.textContent = t(data.name);
        const role = document.createElement('div');
        role.className = 'text-xs text-cyan-400 font-mono';
        role.textContent = t(data.role);

        nameRole.appendChild(name);
        nameRole.appendChild(role);
        header.appendChild(avatar);
        header.appendChild(nameRole);
        topSec.appendChild(header);

        if (!isUnlocked) {
            // Locked companion info
            const cost = getRecruitCost(id);
            const canRecruit = canRecruitCompanion(id);
            const baseCost = data.dialogues.recruitCost;
            const discountText = cost < baseCost 
                ? `<span class="text-green-400 font-bold ml-2">(50% Allied Faction Discount!)</span>` 
                : "";
            
            const recruitInfo = document.createElement('div');
            recruitInfo.className = 'text-xs text-gray-500 mt-2 space-y-2';
            
            let standingMsg = "";
            if (!canRecruit) {
                standingMsg = `<p class="text-red-500 font-bold font-mono uppercase tracking-wide">⚠️ Hire Locked: Hostile standing with ${data.alliedFaction.toUpperCase()}</p>`;
            } else {
                standingMsg = `<p class="text-[10px] text-gray-400">Allied Faction: <span class="text-cyan-400 uppercase font-mono">${data.alliedFaction}</span> (Friendly standing: 50% off, Hostile: Locked)</p>`;
            }
            
            recruitInfo.innerHTML = t(`
                <p>Ability: <strong>${data.abilityName}</strong></p>
                <p class="italic">"${data.dialogues.recruit}"</p>
                ${standingMsg}
                <div class="pt-2">
                    <span class="text-yellow-500 font-bold">Cost: ${cost} credits</span> ${discountText}
                </div>
            `);
            topSec.appendChild(recruitInfo);

            // Recruit button
            const recruitBtn = document.createElement('button');
            recruitBtn.textContent = t(`Hire ${data.name}`);
            recruitBtn.disabled = !canRecruit || credits < cost;
            recruitBtn.className = `w-full py-2 px-3 mt-4 rounded font-bold text-xs transition-colors ${
                (canRecruit && credits >= cost)
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
            
            // Cabin Title & Inspect Text
            const roomData = cabinRooms[id] || { title: "Crew Cabin", desc: "A cozy crew cabin." };
            const cabinDescBox = document.createElement('div');
            cabinDescBox.className = 'p-2 rounded bg-black/30 border border-gray-800 text-[11px] text-gray-400 italic mb-2 line-clamp-3 leading-relaxed';
            cabinDescBox.innerHTML = t(`<strong>${roomData.title}</strong><br>${roomData.desc}`);
            topSec.appendChild(cabinDescBox);

            // Trust Progress
            const trustHeader = document.createElement('div');
            trustHeader.className = 'flex justify-between text-gray-400 font-mono';
            trustHeader.innerHTML = t(`<span>${levelLabel}</span><span>${currentTrustVal}/${maxTrustVal} XP</span>`);
            
            const progressBg = document.createElement('div');
            progressBg.className = 'w-full bg-gray-900 rounded-full h-2 border border-gray-800';
            const progressFill = document.createElement('div');
            progressFill.className = 'bg-cyan-500 h-1.5 rounded-full shadow-[0_0_5px_rgba(6,182,212,0.6)] transition-all';
            progressFill.style.width = `${barPct}%`;
            progressBg.appendChild(progressFill);

            // Ability Desc
            const abilityText = document.createElement('p');
            abilityText.className = 'text-gray-300 mt-2';
            abilityText.innerHTML = t(`Active Skill: <strong class="text-cyan-400">${data.abilityName}</strong><br><span class="text-gray-400">${data.abilityDesc}</span>`);

            trustSec.appendChild(trustHeader);
            trustSec.appendChild(progressBg);
            trustSec.appendChild(abilityText);
            topSec.appendChild(trustSec);

            // Loyalty Mission Status Area
            const loyaltyQuestId = `loyalty_${id}`;
            const loyaltySec = document.createElement('div');
            loyaltySec.className = 'mt-3 pt-2 border-t border-gray-800 text-xs';
            
            if (state.character.completedQuests && state.character.completedQuests.includes(loyaltyQuestId)) {
                const questCompleteMsg = document.createElement('div');
                questCompleteMsg.className = 'text-green-400 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5';
                questCompleteMsg.innerHTML = '<span>✅</span> Loyalty Mission Resolved';
                loyaltySec.appendChild(questCompleteMsg);
            } else if (state.character.activeQuests && state.character.activeQuests[loyaltyQuestId]) {
                const activeQuestInfo = document.createElement('div');
                activeQuestInfo.className = 'text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider animate-pulse flex items-center gap-1.5';
                activeQuestInfo.innerHTML = '<span>⭐</span> Mission Active: In Progress';
                loyaltySec.appendChild(activeQuestInfo);
            } else if (trust >= 50) {
                const loyaltyBtn = document.createElement('button');
                loyaltyBtn.className = 'w-full py-1.5 px-3 rounded font-mono font-bold text-[10px] bg-yellow-600/90 hover:bg-yellow-500 text-white border border-yellow-500/30 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(202,138,4,0.3)]';
                loyaltyBtn.innerHTML = '<span>⭐</span> HELP WITH LOYALTY MISSION';
                loyaltyBtn.onclick = () => {
                    acceptQuest(loyaltyQuestId);
                    renderCompanionsTab();
                    if (updateUI) updateUI();
                };
                loyaltySec.appendChild(loyaltyBtn);
            } else {
                const loyaltyLocked = document.createElement('div');
                loyaltyLocked.className = 'text-gray-600 font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5';
                loyaltyLocked.innerHTML = '<span>🔒</span> Loyalty Mission (Requires Trust 50)';
                loyaltySec.appendChild(loyaltyLocked);
            }
            topSec.appendChild(loyaltySec);

            // Gifting Options from Inventory
            const interactSec = document.createElement('div');
            interactSec.className = 'mt-3 pt-3 border-t border-gray-800 space-y-2';

            const talkBtn = document.createElement('button');
            talkBtn.className = 'w-full py-1 px-2 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700/50 rounded font-bold text-xs text-indigo-200 transition-colors';
            talkBtn.innerHTML = t('💬 Chat');
            talkBtn.onclick = () => {
                const loyaltyQuestId = `loyalty_${id}`;
                if (state.character.activeQuests && state.character.activeQuests[loyaltyQuestId] && state.character.activeQuests[loyaltyQuestId].readyToTurnIn) {
                    showDialog(
                        `💬 Crew Comm: ${data.name}`, 
                        `"Thank you, Captain! We secured the required core data telemetry. My full loyalty is yours."`, 
                        [
                            { 
                                text: "Complete Loyalty Mission", 
                                action: () => {
                                    state.character.activeQuests[loyaltyQuestId].turnedInByNpc = true;
                                    import('../quests.js').then(m => {
                                        m.completeQuest(loyaltyQuestId);
                                        renderCompanionsTab();
                                        if (updateUI) updateUI();
                                    });
                                } 
                            },
                            { text: "Close", action: () => {} }
                        ]
                    );
                } else {
                    const text = talkToCompanion(id);
                    showDialog(`💬 Crew Comm: ${data.name}`, `"${text}"`, [{ text: "Close", action: () => {} }]);
                    renderCompanionsTab();
                }
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
                    giftBtn.innerHTML = t(`<span>🎁 ${giftName}</span><span class="font-bold">${isPreferred ? '+25 XP 🔥' : '+10 XP'}</span>`);
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
                creditsBtn.innerHTML = t(`<span>💵 Fund Research (100 cr)</span><span class="font-bold">+10 XP</span>`);
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
                actionBtn.textContent = t('Active Crew Member');
                actionBtn.className = 'w-full py-2 px-3 mt-4 rounded font-bold text-xs bg-cyan-950 border border-cyan-800 text-cyan-300 cursor-default';
            } else {
                actionBtn.textContent = t('Deploy Companion');
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
