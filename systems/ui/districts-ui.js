/**
 * Districts UI Module
 * Handles local sub-locations and NPC conversations.
 */

import { showDialogue, hideDialogue } from './dialogue-ui.js';
import { acceptQuest, completeQuest, getRoleQuestId, resolveVariantText } from '../quests.js';
import { t } from '../theme-engine.js';
import { npcReactions } from '../../data/npc_reactions.js';

let state;
let deps;
let updateUI;

const NPC_NAMES = {
    vance: "Captain Vance",
    nesta: "Envoy Nesta",
    thorne: "Dr. Elyse Thorne",
    mercer: "Jax 'Sparky' Mercer",
    delegates: "Summit Delegates"
};

/**
 * Initialize the Districts UI module
 */
export function initDistrictsUI(dependencies) {
    deps = dependencies;
    state = deps.state;
    updateUI = () => {
        if (deps.ui && deps.ui.updateUI) deps.ui.updateUI();
    };
}

/**
 * Show the districts modal
 */
export function showDistricts() {
    const modal = document.getElementById("districtsModal");
    if (!modal || !state.currentLocation || !deps.data.locations[state.currentLocation]) return;

    modal.classList.remove("hidden");
    modal.style.display = "flex";

    renderDistricts();
}

/**
 * Render the districts of the current location
 */
export function renderDistricts() {
    const container = document.getElementById("districtsContainer");
    const titleEl = document.getElementById("districtsModalTitle");
    const subtitleEl = document.getElementById("districtsModalSubtitle");

    if (!container) return;
    container.innerHTML = "";

    const location = deps.data.locations[state.currentLocation];
    if (!location) return;

    if (titleEl) titleEl.textContent = `>> ${t(location.name)} Districts <<`;
    if (subtitleEl) subtitleEl.textContent = t(`Local sub-locations and installations in this sector.`);

    const districts = location.districts || [];

    if (districts.length === 0) {
        container.innerHTML = `<div class="text-gray-500 italic text-center p-6 font-mono text-xs">${t("No local districts mapped for this sector.")}</div>`;
        return;
    }

    districts.forEach(dist => {
        const card = document.createElement("div");
        card.className = "bg-gray-900/80 border border-cyan-950 hover:border-cyan-500/30 p-4 rounded flex justify-between items-center transition-all duration-300 shadow-inner";

        let actionBtnHtml = "";
        let badgeHtml = "";

        if (dist.npc) {
            let npcId = dist.npc;
            if (state.worldFlags && state.worldFlags.factionSway) {
                const sway = state.worldFlags.factionSway;
                if (sway === "federation") {
                    if (npcId === "nesta" || npcId === "thorne") npcId = "vance";
                } else if (sway === "corsairs") {
                    if (npcId === "vance" || npcId === "thorne") npcId = "nesta";
                } else if (sway === "syndicate") {
                    if (npcId === "vance" || npcId === "nesta") npcId = "thorne";
                }
            }
            const npcName = NPC_NAMES[npcId] || npcId;
            
            // Determine if NPC has any quest status
            let isStoryNpc = false;
            let statusText = "";
            let badgeClass = "";

            if (state.character) {
                const active = state.character.activeQuests;
                const completed = state.character.completedQuests;

                // Quest 1: The Awakening (Vance)
                if (npcId === "vance") {
                    if (!active["story_01"] && !completed.includes("story_01")) {
                        statusText = "STORY MISSION";
                        badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                    } else if (active["story_01"]) {
                        const q = active["story_01"];
                        if (q.readyToTurnIn) {
                            statusText = "READY TO TURN IN";
                            badgeClass = "bg-green-955/80 text-green-400 border-green-800/60 animate-pulse";
                        } else {
                            statusText = "ACTIVE QUEST";
                            badgeClass = "bg-cyan-955/80 text-cyan-400 border-cyan-800/60";
                        }
                    }
                    // Quest 2: The Diplomatic Crisis (Vance)
                    else if (completed.includes("story_01") && !active["quest_branch_01"] && !completed.includes("quest_branch_01")) {
                        statusText = "STORY MISSION";
                        badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                    } else if (active["quest_branch_01"]) {
                        const q = active["quest_branch_01"];
                        if (q.currentStep === 1) {
                            statusText = "READY TO TURN IN";
                            badgeClass = "bg-green-955/80 text-green-400 border-green-800/60 animate-pulse";
                        } else {
                            statusText = "ACTIVE QUEST";
                            badgeClass = "bg-cyan-955/80 text-cyan-400 border-cyan-800/60";
                        }
                    }
                    // Quest 3 (Fed Path): Act II Patrol (Vance)
                    else if (completed.includes("quest_branch_01") && state.character.storyline?.alignment === "federation") {
                        if (!active["story_act2_fed"] && !completed.includes("story_act2_fed")) {
                            statusText = "STORY MISSION";
                            badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                        } else if (active["story_act2_fed"]) {
                            const q = active["story_act2_fed"];
                            if (q.readyToTurnIn || q.currentStep === 4) {
                                statusText = "READY TO TURN IN";
                                badgeClass = "bg-green-955/80 text-green-400 border-green-800/60 animate-pulse";
                            } else {
                                statusText = "ACTIVE QUEST";
                                badgeClass = "bg-cyan-955/80 text-cyan-400 border-cyan-800/60";
                            }
                        } else if (completed.includes("story_act2_fed") && !active["story_act3"] && !completed.includes("story_act3")) {
                            statusText = "STORY MISSION";
                            badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                        }
                    }
                }
                // Quest 3 (Corsair Path): Act II Smuggler's Run (Nesta)
                else if (npcId === "nesta") {
                    if (completed.includes("quest_branch_01") && state.character.storyline?.alignment === "corsairs") {
                        if (!active["story_act2_cor"] && !completed.includes("story_act2_cor")) {
                            statusText = "STORY MISSION";
                            badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                        } else if (active["story_act2_cor"]) {
                            const q = active["story_act2_cor"];
                            if (q.readyToTurnIn || q.currentStep === 4) {
                                statusText = "READY TO TURN IN";
                                badgeClass = "bg-green-955/80 text-green-400 border-green-800/60 animate-pulse";
                            } else {
                                statusText = "ACTIVE QUEST";
                                badgeClass = "bg-cyan-955/80 text-cyan-400 border-cyan-800/60";
                            }
                        } else if (completed.includes("story_act2_cor") && !active["story_act3"] && !completed.includes("story_act3")) {
                            statusText = "STORY MISSION";
                            badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                        }
                    }
                }
                // Quest 3 (Syndicate Path): Act II Syndicate Contract (Thorne)
                else if (npcId === "thorne") {
                    if (completed.includes("quest_branch_01") && state.character.storyline?.alignment === "syndicate") {
                        if (!active["story_act2_syn"] && !completed.includes("story_act2_syn")) {
                            statusText = "STORY MISSION";
                            badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                        } else if (active["story_act2_syn"]) {
                            const q = active["story_act2_syn"];
                            if (q.readyToTurnIn || q.currentStep === 4) {
                                statusText = "READY TO TURN IN";
                                badgeClass = "bg-green-955/80 text-green-400 border-green-800/60 animate-pulse";
                            } else {
                                statusText = "ACTIVE QUEST";
                                badgeClass = "bg-cyan-955/80 text-cyan-400 border-cyan-800/60";
                            }
                        } else if (completed.includes("story_act2_syn") && !active["story_act3"] && !completed.includes("story_act3")) {
                            statusText = "STORY MISSION";
                            badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60";
                        }
                    }
                }
                // Quest 4: Act III Galactic Crucible (Delegates)
                else if (npcId === "delegates") {
                    const hasFinishedAct2 = completed.includes("story_act2_fed") || completed.includes("story_act2_cor") || completed.includes("story_act2_syn");
                    if (hasFinishedAct2) {
                        if (!active["story_act3"] && !completed.includes("story_act3")) {
                            statusText = "STORY SUMMIT";
                            badgeClass = "bg-yellow-955/80 text-yellow-400 border-yellow-800/60 animate-pulse";
                        } else if (active["story_act3"]) {
                            statusText = "ACTIVE SUMMIT";
                            badgeClass = "bg-cyan-955/80 text-cyan-400 border-cyan-800/60";
                        }
                    }
                }
            }

            if (statusText) {
                badgeHtml = `<span class="px-2 py-0.5 border text-3xs font-black rounded font-mono ${badgeClass}">${statusText}</span>`;
            }

            actionBtnHtml = `
                <button onclick="import('./systems/ui/districts-ui.js').then((m) => m.talkToNPC('${npcId}'))" 
                    class="py-1.5 px-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 rounded font-bold font-mono text-[10px] uppercase tracking-wider transition-all duration-250 shadow-[0_0_8px_rgba(6,182,212,0.15)] flex-shrink-0">
                    💬 Talk to ${npcName.split(' ').pop()}
                </button>
            `;
        } else {
            actionBtnHtml = `
                <button onclick="import('./systems/ui/districts-ui.js').then((m) => m.exploreDistrict('${dist.id}'))" 
                    class="py-1.5 px-3 bg-gray-800 hover:bg-gray-755 border border-gray-750 text-gray-300 rounded font-mono text-[10px] uppercase tracking-wider transition-all duration-250 flex-shrink-0">
                    🔍 Explore District
                </button>
            `;
        }

        card.innerHTML = `
            <div class="flex gap-3 items-center min-w-0 mr-4">
                <div class="text-3xl p-2 bg-black/40 rounded border border-gray-850/80 flex-shrink-0 w-12 h-12 flex items-center justify-center">${dist.icon || "🏢"}</div>
                <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <h3 class="text-sm font-bold text-white tracking-wide uppercase font-mono truncate">${t(dist.name)}</h3>
                        ${badgeHtml}
                    </div>
                    <p class="text-xs text-gray-400 leading-relaxed font-sans">${t(dist.description)}</p>
                </div>
            </div>
            ${actionBtnHtml}
        `;

        container.appendChild(card);
    });
}

/**
 * Explore a generic district without an NPC
 */
export function exploreDistrict(distId) {
    const modal = document.getElementById("districtsModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }

    const loc = deps.data.locations[state.currentLocation];
    const dist = loc?.districts?.find(d => d.id === distId);
    if (!dist) return;

    if (deps.ui && deps.ui.addLog) {
        deps.ui.addLog(t(`🔍 You explored the ${dist.name}. It is quiet and secure.`));
    }
}

/**
 * NPC Conversation State Machine
 */
export function talkToNPC(npcId) {
    // Hide districts modal first
    const modal = document.getElementById("districtsModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }

    if (!state.character) return;

    // Intercept conversations if NPCs are occupying other planets' districts
    if (state.worldFlags && state.worldFlags.factionSway) {
        const locId = state.currentLocation;
        if (npcId === "vance" && locId !== "terra_prime") {
            if (locId === "xylo_delta") {
                showDialogue("Captain Vance", "This sector is under Federation lockdown. Smuggling activities have been terminated.", [{ text: "Understood, Captain. (Close)", action: hideDialogue }]);
                return;
            }
            if (locId === "norkon_outpost") {
                showDialogue("Captain Vance", "Federation science officers have seized this laboratory to auditing quantum safety protocols.", [{ text: "Understood, Captain. (Close)", action: hideDialogue }]);
                return;
            }
        }
        if (npcId === "nesta" && locId !== "xylo_delta") {
            if (locId === "terra_prime") {
                showDialogue("Envoy Nesta", "Haha! The shiny boots are gone! This headquarters belongs to the free folk now.", [{ text: "Keep flying, Nesta. (Close)", action: hideDialogue }]);
                return;
            }
            if (locId === "norkon_outpost") {
                showDialogue("Envoy Nesta", "We've raided their high-tech toy drawer! Plenty of good salvage in here.", [{ text: "Awesome. (Close)", action: hideDialogue }]);
                return;
            }
        }
        if (npcId === "thorne" && locId !== "norkon_outpost") {
            if (locId === "terra_prime") {
                showDialogue("Dr. Elyse Thorne", "Federation military protocols were highly inefficient. This facility has been repurposed for quantum network research.", [{ text: "Fascinating. (Close)", action: hideDialogue }]);
                return;
            }
            if (locId === "xylo_delta") {
                showDialogue("Dr. Elyse Thorne", "Organic contraband is irrelevant. We have converted these caves into processing nodes for the Singularity.", [{ text: "Efficiency is key. (Close)", action: hideDialogue }]);
                return;
            }
        }
    }

    // Reactive greeting layer (optional; falls through to scripted greetings)
    const reactive = resolveVariantText(npcReactions[npcId], null);
    if (reactive) {
        const name = NPC_NAMES[npcId] || npcId;
        showDialogue(name, reactive, [{ text: "(Close)", action: hideDialogue }]);
        return;
    }

    const active = state.character.activeQuests;
    const completed = state.character.completedQuests;

    const story01Id = getRoleQuestId("story_01");
    const questBranch01Id = getRoleQuestId("quest_branch_01");
    const storyAct2FedId = getRoleQuestId("story_act2_fed");
    const storyAct2CorId = getRoleQuestId("story_act2_cor");
    const storyAct2SynId = getRoleQuestId("story_act2_syn");
    const storyAct3Id = getRoleQuestId("story_act3");
    const questBranch02Id = getRoleQuestId("quest_branch_02");

    // ============================================
    // GENERIC TURN-IN INTERCEPTOR
    // ============================================
    const questDb = (deps && deps.data && deps.data.quests) || {};
    const readyQuestId = Object.keys(active).find(qid => {
        const q = questDb[qid];
        return q && q.giver && q.giver.id === npcId && active[qid].readyToTurnIn && !q.hasCustomTurnIn;
    });

    if (readyQuestId) {
        const quest = questDb[readyQuestId];
        const npcName = NPC_NAMES[npcId] || npcId;
        showDialogue(
            npcName,
            `Ah, freelancer! You have completed all objectives for '${quest.title}'. Here is your reward, pleasure doing business with you.`,
            [
                {
                    text: "Complete Quest",
                    action: () => {
                        active[readyQuestId].turnedInByNpc = true;
                        completeQuest(readyQuestId);
                        hideDialogue();
                        updateUI();
                    }
                }
            ]
        );
        return;
    }

    // ============================================
    // CAPTAIN VANCE (FEDERATION)
    // ============================================
    if (npcId === "vance") {
        // State 1: Start Quest 1 (The Awakening)
        if (!active[story01Id] && !completed.includes(story01Id)) {
            showDialogue(
                "Captain Vance",
                "Welcome to Terra Prime, Captain. I am Captain Vance of the Federation garrison. We've detected an anomalous signal radiating from the sector, but local Xenobot activity has jammed our communications. I need a capable freelancer to clear the sector and salvage scrap metal so my engineers can restore the comms array.",
                [
                    {
                        text: "Accept Mission: The Awakening",
                        action: () => {
                            acceptQuest(story01Id);
                            hideDialogue();
                        }
                    },
                    {
                        text: "Maybe later.",
                        action: hideDialogue
                    }
                ]
            );
        }
        // State 2: Quest 1 Active (Not Complete)
        else if (active[story01Id] && !active[story01Id].readyToTurnIn) {
            showDialogue(
                "Captain Vance",
                "We need that comms array repaired, Captain. Have you neutralized the Xenobots and retrieved the scrap metal?",
                [
                    { text: "I am still working on it, Captain.", action: hideDialogue }
                ]
            );
        }
        // State 3: Quest 1 Ready to Turn In
        else if (active[story01Id] && active[story01Id].readyToTurnIn) {
            showDialogue(
                "Captain Vance",
                "Excellent work, Captain! The Xenobots have been cleared, and the scrap metal has allowed our engineers to restore the comms array. We've decoded the signal... it's a coordinates telemetry package to an ancient, sector-wide weapons cache left by the Precursors. This changes everything.",
                [
                    {
                        text: "Complete: The Awakening",
                        action: () => {
                            // Turn in quest
                            active[story01Id].turnedInByNpc = true;
                            completeQuest(story01Id);
                            
                            // Immediately offer next quest
                            setTimeout(() => {
                                talkToNPC("vance");
                            }, 500);
                        }
                    }
                ]
            );
        }
        // State 4: Start Quest 2 (The Diplomatic Crisis)
        else if (completed.includes(story01Id) && !active[questBranch01Id] && !completed.includes(questBranch01Id)) {
            showDialogue(
                "Captain Vance",
                "This ancient weapons cache could start a sector-wide war if it falls into the wrong hands. The Void Corsairs and the Photon Prime Syndicate are already scanning the sector for it. I need you to secure the encrypted data telemetry from the crashed probe before they do.",
                [
                    {
                        text: "Accept Mission: The Diplomatic Crisis",
                        action: () => {
                            acceptQuest(questBranch01Id);
                            hideDialogue();
                        }
                    },
                    { text: "I need to prepare first.", action: hideDialogue }
                ]
            );
        }
        // State 5: Quest 2 Active (Not Completed - Step 0: Killing Xenobots)
        else if (active[questBranch01Id] && active[questBranch01Id].currentStep === 0) {
            showDialogue(
                "Captain Vance",
                "Secure the telemetry from the crashed probe, Captain. We cannot let the Corsairs or Syndicate get their hands on it first.",
                [
                    { text: "Understood, Captain. I'll get it done.", action: hideDialogue }
                ]
            );
        }
        // State 6: Quest 2 Choice Step (Step 1 - Return to Vance to make decision)
        else if (active[questBranch01Id] && active[questBranch01Id].currentStep === 1) {
            // Flag that the player is at the NPC, so choices can be processed
            active[questBranch01Id].atNpc = true;
            active[questBranch01Id].turnedInByNpc = true;
            
            showDialogue(
                "Captain Vance",
                "You've secured the telemetry package, Captain! Outstanding. But my scanners indicate that Envoy Nesta of the Corsairs and Dr. Thorne of the Syndicate have intercepted our transmissions. They are both offering massive bounties for this package. What do you intend to do with it?",
                [
                    {
                        text: "[FEDERATION] Transmit the telemetry to Captain Vance.",
                        action: () => {
                            // Trigger the choice evaluation in the quest module
                            import('../quests.js').then(m => {
                                m.evaluateChoice(questBranch01Id, 0);
                            });
                        }
                    },
                    {
                        text: "[CORSAIRS] Refuse and sell the telemetry to Envoy Nesta.",
                        action: () => {
                            import('../quests.js').then(m => {
                                m.evaluateChoice(questBranch01Id, 1);
                            });
                        }
                    },
                    {
                        text: "[SYNDICATE] Refuse and decrypt the data for Dr. Elyse Thorne.",
                        disabled: state.character.role !== "Scientist",
                        action: () => {
                            import('../quests.js').then(m => {
                                m.evaluateChoice(questBranch01Id, 2);
                            });
                        }
                    }
                ]
            );
        }
        // State 7: Act II Federation - Eligible (Chose Fed in Act I)
        else if (completed.includes(questBranch01Id) && state.character.storyline?.alignment === "federation" && !active[storyAct2FedId] && !completed.includes(storyAct2FedId)) {
            showDialogue(
                "Captain Vance",
                "Your loyalty to the Federation is commendable, Captain. The telemetry has allowed us to locate the cache. However, Void Corsair reavers are smuggling blockades and organizing an interception. I need you to patrol the sector, intercept their smuggler fleets, and dismantle their networks.",
                [
                    {
                        text: "Accept Mission: Act II: Federation Patrol",
                        action: () => {
                            acceptQuest(storyAct2FedId);
                            hideDialogue();
                        }
                    },
                    { text: "I'll return shortly.", action: hideDialogue }
                ]
            );
        }
        // State 8: Act II Fed Active (Not Complete)
        else if (active[storyAct2FedId] && active[storyAct2FedId].currentStep < 4) {
            showDialogue(
                "Captain Vance",
                "Smuggler activity remains high in this sector. Intercept those Corsair reavers, Captain.",
                [
                    { text: "I am maintaining patrol parameters, Captain.", action: hideDialogue }
                ]
            );
        }
        // State 9: Act II Fed Ready to Turn In (Patrol done, at step 4)
        else if (active[storyAct2FedId] && (active[storyAct2FedId].currentStep === 4 || active[storyAct2FedId].readyToTurnIn)) {
            active[storyAct2FedId].atNpc = true;
            active[storyAct2FedId].turnedInByNpc = true;

            showDialogue(
                "Captain Vance",
                "Spectacular combat piloting, Captain! The pirate smuggling network has been completely dismantled. The sector is secure. However, a Galactic Peace Summit has been convened at Nebula Outpost. The delegates will decide the fate of the weapons cache. I want you to represent the Federation's interests at the summit.",
                [
                    {
                        text: "Complete Patrol & Report to Summit",
                        action: () => {
                            completeQuest(storyAct2FedId);
                            hideDialogue();
                        }
                    }
                ]
            );
        }
        // State 10: Act III Fed Eligible
        else if (completed.includes(storyAct2FedId) && !active[storyAct3Id] && !completed.includes(storyAct3Id)) {
            showDialogue(
                "Captain Vance",
                "Head to the Crucible Summit Hall at Nebula Outpost immediately. The summit delegates are waiting. Ensure that weapons cache is handed over to the Federation so we can establish ironclad order and security in this sector.",
                [
                    {
                        text: "Accept: Act III: The Galactic Crucible",
                        action: () => {
                            acceptQuest(storyAct3Id);
                            hideDialogue();
                        }
                    },
                    { text: "Readying hyperdrive. (Close)", action: hideDialogue }
                ]
            );
        }
        // State 11: General / Free Roam
        else {
            const hasFedEnding = completed.includes(storyAct3Id) && state.character.storyline?.alignment === "federation";
            const greeting = hasFedEnding 
                ? "Ah, hero of the Federation! Order has been established, and security reigns. Thank you for your service, Captain."
                : "The peace summit is over. Stay safe out there, Captain. Keep our trade routes clear.";

            showDialogue("Captain Vance", greeting, [{ text: "Understood, Captain. (Close)", action: hideDialogue }]);
        }
    }

    // ============================================
    // ENVOY NESTA (CORSAIRS)
    // ============================================
    else if (npcId === "nesta") {
        // State 1: Act II Corsair Eligible (Chose Corsair in Act I)
        if (completed.includes(questBranch01Id) && state.character.storyline?.alignment === "corsairs" && !active[storyAct2CorId] && !completed.includes(storyAct2CorId)) {
            showDialogue(
                "Envoy Nesta",
                "Haha! The freelancer who delivered the goods! Welcome to the Smuggler's Den. The Federation is crying about their lost telemetry and has set up customs blockades all over Xylo Delta. We need to secure cargo containers and breach their customs vault to steal their hyperdrive schematics. Are you in, mate?",
                [
                    {
                        text: "Accept Mission: Act II: The Smuggler's Run",
                        action: () => {
                            acceptQuest(storyAct2CorId);
                            hideDialogue();
                        }
                    },
                    { text: "Not just yet.", action: hideDialogue }
                ]
            );
        }
        // State 2: Act II Corsair Active (Not Complete)
        else if (active[storyAct2CorId] && active[storyAct2CorId].currentStep < 4) {
            showDialogue(
                "Envoy Nesta",
                "We need that cargo secured and the Federation keycards swiped. Don't let their patrol ships scan you, freelancer!",
                [
                    { text: "I'm on it.", action: hideDialogue }
                ]
            );
        }
        // State 3: Act II Corsair Ready to Turn In (at step 4)
        else if (active[storyAct2CorId] && (active[storyAct2CorId].currentStep === 4 || active[storyAct2CorId].readyToTurnIn)) {
            active[storyAct2CorId].atNpc = true;
            active[storyAct2CorId].turnedInByNpc = true;

            showDialogue(
                "Envoy Nesta",
                "Incredible! You actually cracked the Federation customs vault and snatched those hyperdrive schematics! The Corsairs are celebrating in every tavern. But listen, they're holding a Peace Summit at Nebula Outpost to divide our territory. I need you to fly there, represent the free folk, and secure our independence.",
                [
                    {
                        text: "Complete Smuggler's Run & Report to Summit",
                        action: () => {
                            completeQuest(storyAct2CorId);
                            hideDialogue();
                        }
                    }
                ]
            );
        }
        // State 4: Act III Corsair Eligible
        else if (completed.includes(storyAct2CorId) && !active[storyAct3Id] && !completed.includes(storyAct3Id)) {
            showDialogue(
                "Envoy Nesta",
                "Get over to the Crucible Summit Hall on Nebula Outpost, Captain. Disrupt their fancy summit, and make sure we keep our freedom from Federation tyrants and corporate suit-wearers!",
                [
                    {
                        text: "Accept: Act III: The Galactic Crucible",
                        action: () => {
                            acceptQuest(storyAct3Id);
                            hideDialogue();
                        }
                    },
                    { text: "I'm on my way.", action: hideDialogue }
                ]
            );
        }
        // State 5: General / Free Roam / Other Alignments
        else {
            const hasCorsairEnding = completed.includes(storyAct3Id) && state.character.storyline?.alignment === "corsairs";
            const greeting = hasCorsairEnding 
                ? "The galaxy is free, Captain! No Federation blockades, no corporate rules. Keep flying the skull flag, legend!"
                : "Welcome to Corsair space. Keep your weapons hot and your scanners sharp, freelancer.";

            showDialogue("Envoy Nesta", greeting, [{ text: "Fair winds, Nesta. (Close)", action: hideDialogue }]);
        }
    }

    // ============================================
    // DR. ELYSE THORNE (SYNDICATE)
    // ============================================
    else if (npcId === "thorne") {
        // State 1: Act II Syndicate Eligible (Chose Syndicate in Act I)
        if (completed.includes(questBranch01Id) && state.character.storyline?.alignment === "syndicate" && !active[storyAct2SynId] && !completed.includes(storyAct2SynId)) {
            showDialogue(
                "Dr. Elyse Thorne",
                "Ah, our scientific collaborator. Welcome to the Syndicate Singularity Lab. The telemetry data you decrypted has allowed us to finalize designs for our experimental reactor. However, we require quantum chips to stabilize the singularity core. Will you contract with us to retrieve them?",
                [
                    {
                        text: "Accept Mission: Act II: Syndicate Contract",
                        action: () => {
                            acceptQuest(storyAct2SynId);
                            hideDialogue();
                        }
                    },
                    { text: "I must decline for now.", action: hideDialogue }
                ]
            );
        }
        // State 2: Act II Syndicate Active (Not Complete)
        else if (active[storyAct2SynId] && active[storyAct2SynId].currentStep < 4) {
            showDialogue(
                "Dr. Elyse Thorne",
                "The singularity experiments are on standby. We require those quantum processors to begin core calibration.",
                [
                    { text: "I am securing them now, Doctor.", action: hideDialogue }
                ]
            );
        }
        // State 3: Act II Syndicate Ready to Turn In (at step 4)
        else if (active[storyAct2SynId] && (active[storyAct2SynId].currentStep === 4 || active[storyAct2SynId].readyToTurnIn)) {
            active[storyAct2SynId].atNpc = true;
            active[storyAct2SynId].turnedInByNpc = true;

            showDialogue(
                "Dr. Elyse Thorne",
                "Fascinating. The quantum array is online, and the singularity reactor is operating at 300% efficiency. Corporate is highly pleased with your contribution. However, the other factions have convened a Peace Summit at Nebula Outpost to restrict our research. You must represent the Syndicate and secure our technological sovereignty.",
                [
                    {
                        text: "Complete Syndicate Contract & Report to Summit",
                        action: () => {
                            completeQuest(storyAct2SynId);
                            hideDialogue();
                        }
                    }
                ]
            );
        }
        // State 4: Act III Syndicate Eligible
        else if (completed.includes(storyAct2SynId) && !active[storyAct3Id] && !completed.includes(storyAct3Id)) {
            showDialogue(
                "Dr. Elyse Thorne",
                "Navigate to the Crucible Summit Hall at Nebula Outpost. Present our thermal core calculations and secure the energy cache. It is vital to the next phase of human cybernetic evolution.",
                [
                    {
                        text: "Accept: Act III: The Galactic Crucible",
                        action: () => {
                            acceptQuest(storyAct3Id);
                            hideDialogue();
                        }
                    },
                    { text: "Calculations loaded. (Close)", action: hideDialogue }
                ]
            );
        }
        // State 5: General / Free Roam
        else {
            const hasSynEnding = completed.includes("story_act3") && state.character.storyline?.alignment === "syndicate";
            const greeting = hasSynEnding 
                ? "The Singularity is complete, Captain. Organic consciousness has merged with the cybernetic network. We are one. We are harmonious."
                : "The singularity is a delicate mathematical equation. Please do not touch the consoles.";

            showDialogue("Dr. Elyse Thorne", greeting, [{ text: "Understood, Doctor. (Close)", action: hideDialogue }]);
        }
    }

    // ============================================
    // SUMMIT DELEGATES (NEBULA OUTPOST)
    // ============================================
    else if (npcId === "delegates") {
        const hasFinishedAct2 = completed.includes(storyAct2FedId) || completed.includes(storyAct2CorId) || completed.includes(storyAct2SynId);

        // State 1: Summit Eligible
        if (hasFinishedAct2 && !active[storyAct3Id] && !completed.includes(storyAct3Id)) {
            showDialogue(
                "Summit Delegates",
                "The high assembly is in deadlock. The Federation, Corsairs, and Syndicate are on the brink of total war over the Precursor weapons cache. You hold the coordinates, Captain. Your presentation will tip the balance of power. Are you prepared to speak?",
                [
                    {
                        text: "Enter the Summit (Accept: Act III: The Galactic Crucible)",
                        action: () => {
                            acceptQuest(storyAct3Id);
                            hideDialogue();
                        }
                    },
                    { text: "I need a moment to prepare my statement.", action: hideDialogue }
                ]
            );
        }
        // State 2: Summit Active
        else if (active[storyAct3Id]) {
            // Force the choice dialogue to show immediately
            active[storyAct3Id].atNpc = true;
            active[storyAct3Id].turnedInByNpc = true;
            
            import('../quests.js').then(m => {
                m.triggerChoiceStepIfActive(storyAct3Id);
            });
        }
        // State 3: General / Free Roam
        else {
            showDialogue(
                "Summit Delegates",
                "The Summit has concluded, and the treaty is signed. The fate of the sector has been decided. Thank you for your historic service, Captain.",
                [
                    { text: "For the galaxy. (Close)", action: hideDialogue }
                ]
            );
        }
    }

    // ============================================
    // JAX 'SPARKY' MERCER (SCAVENGER - BONUS)
    // ============================================
    else if (npcId === "mercer") {
        // Sparky handles quest_branch_02
        if (active[questBranch02Id] && active[questBranch02Id].readyToTurnIn) {
            active[questBranch02Id].turnedInByNpc = true;
            showDialogue(
                "Jax 'Sparky' Mercer",
                "Hot diggity! You actually got that Plasma Core! The power grid in my workshop is humming. Here's your credits, spacer. Pleasure doing business!",
                [
                    {
                        text: "Turn in Plasma Core",
                        action: () => {
                            completeQuest(questBranch02Id);
                            hideDialogue();
                        }
                    }
                ]
            );
        } else if (active[questBranch02Id]) {
            showDialogue(
                "Jax 'Sparky' Mercer",
                "Any luck snatching that Plasma Core from the Federation depot? My tools are running on fumes here!",
                [
                    { text: "Still working on it, Sparky.", action: hideDialogue }
                ]
            );
        } else if (!active[questBranch02Id] && !completed.includes(questBranch02Id)) {
            showDialogue(
                "Jax 'Sparky' Mercer",
                "Hey there, spacer! Rusted hulls and electrical fires, that's my specialty. Say, you look like you can slip past Federation guards. I need a Plasma Core from their depot to power my heavy salvage laser. Willing to pay top credits. What do you say?",
                [
                    {
                        text: "Accept: Scavenger's Gamble",
                        action: () => {
                            acceptQuest(questBranch02Id);
                            hideDialogue();
                        }
                    },
                    { text: "No thanks, sounds illegal.", action: hideDialogue }
                ]
            );
        } else {
            showDialogue(
                "Jax 'Sparky' Mercer",
                "Hey, spacer! Rusted starships are treasure chests if you know where to cut. Keep flying!",
                [
                    { text: "Thanks, Sparky. (Close)", action: hideDialogue }
                ]
            );
        }
    }
}
