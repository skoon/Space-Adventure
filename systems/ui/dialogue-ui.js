/**
 * Dialogue UI Module
 * Manages the high-fidelity Dialogue Overlay, NPC portrait panels,
 * and animated d20 virtual dice rolls.
 */

import { t } from '../theme-engine.js';

let state;
let updateUI;
let deps;

const NPCS = {
    vance: {
        name: "Vance",
        faction: "Federation",
        avatar: "🦾",
        factionClass: "text-blue-400 border-blue-900/50"
    },
    lyra: {
        name: "Dr. Lyra",
        faction: "Syndicate",
        avatar: "🔬",
        factionClass: "text-purple-400 border-purple-900/50"
    },
    apex: {
        name: "Apex",
        faction: "Void Corsairs",
        avatar: "🔫",
        factionClass: "text-red-400 border-red-900/50"
    },
    nesta: {
        name: "Envoy Nesta",
        faction: "Void Corsairs",
        avatar: "🦹",
        factionClass: "text-red-400 border-red-900/50"
    },
    thorne: {
        name: "Dr. Elyse Thorne",
        faction: "Syndicate",
        avatar: "👩‍🔬",
        factionClass: "text-purple-400 border-purple-900/50"
    },
    mercer: {
        name: "Jax 'Sparky' Mercer",
        faction: "Independent",
        avatar: "🔧",
        factionClass: "text-amber-400 border-amber-900/50"
    },
    delegates: {
        name: "Summit Delegates",
        faction: "Joint Council",
        avatar: "🏛️",
        factionClass: "text-teal-400 border-teal-900/50"
    },
    ai: {
        name: "Ship AI (S.A.M.)",
        faction: "Systems AI",
        avatar: "🤖",
        factionClass: "text-cyan-400 border-cyan-900/50"
    },
    terminal: {
        name: "Data Mainframe",
        faction: "Unknown",
        avatar: "💾",
        factionClass: "text-green-400 border-green-900/50"
    },
    generic: {
        name: "Sector Liaison",
        faction: "Independent",
        avatar: "🧑‍🚀",
        factionClass: "text-amber-400 border-amber-900/50"
    }
};

/**
 * Initialize the dialogue UI module
 */
export function initDialogueUI(dependencies) {
    deps = dependencies;
    state = deps.state;
    updateUI = deps.ui.updateUI;
}

/**
 * Automatically determine the speaker based on dialogue title and text
 */
function identifySpeaker(title, text) {
    const combined = `${title} ${text}`.toLowerCase();
    
    if (combined.includes("vance")) {
        return { ...NPCS.vance, key: "vance" };
    }
    if (combined.includes("lyra")) {
        return { ...NPCS.lyra, key: "lyra" };
    }
    if (combined.includes("apex")) {
        return { ...NPCS.apex, key: "apex" };
    }
    if (combined.includes("nesta")) {
        return { ...NPCS.nesta, key: "nesta" };
    }
    if (combined.includes("thorne") || combined.includes("elyse")) {
        return { ...NPCS.thorne, key: "thorne" };
    }
    if (combined.includes("mercer") || combined.includes("sparky")) {
        return { ...NPCS.mercer, key: "mercer" };
    }
    if (combined.includes("delegate") || combined.includes("summit") || combined.includes("assembly") || combined.includes("crucible")) {
        return { ...NPCS.delegates, key: "delegates" };
    }
    if (combined.includes("mainframe") || combined.includes("terminal") || combined.includes("encryption") || combined.includes("firewall") || combined.includes("signal")) {
        return { ...NPCS.terminal, key: "terminal" };
    }
    if (combined.includes("ai") || combined.includes("computer") || combined.includes("assistant") || combined.includes("s.a.m.")) {
        return { ...NPCS.ai, key: "ai" };
    }
    
    return { ...NPCS.generic, key: "generic" };
}

/**
 * Get mood based on disposition value
 */
function getMood(npcKey) {
    if (!state.character || !state.character.npcs || !state.character.npcs[npcKey]) {
        // Fallback check: retrieve from companions trust
        if (state.companions && state.companions[npcKey]) {
            const trust = state.companions[npcKey].trust || 0;
            if (trust >= 100) {
                return { label: "Loyal", emoji: "😇", colorClass: "mood-loyal" };
            } else if (trust >= 50) {
                return { label: "Friendly", emoji: "🙂", colorClass: "mood-friendly" };
            } else {
                return { label: "Neutral", emoji: "😐", colorClass: "mood-neutral" };
            }
        }
        return { label: "Neutral", emoji: "😐", colorClass: "mood-neutral" };
    }
    
    const disp = state.character.npcs[npcKey].disposition || 0;
    
    if (disp <= -30) {
        return { label: "Hostile", emoji: "😡", colorClass: "mood-hostile" };
    } else if (disp <= 15) {
        return { label: "Neutral", emoji: "😐", colorClass: "mood-neutral" };
    } else if (disp <= 50) {
        return { label: "Friendly", emoji: "🙂", colorClass: "mood-friendly" };
    } else {
        return { label: "Loyal", emoji: "😇", colorClass: "mood-loyal" };
    }
}

/**
 * Show the immersive dialogue overlay
 */
export function showDialogue(title, text, options = []) {
    const overlay = document.getElementById("dialogueOverlay");
    if (!overlay) return;

    // Apply temporary hologram flicker animation on load
    const dialogueContainer = overlay.querySelector(".dialogue-container");
    if (dialogueContainer) {
        dialogueContainer.classList.add("hologram-flicker");
        setTimeout(() => {
            dialogueContainer.classList.remove("hologram-flicker");
        }, 300);
    }

    // Identify speaker and active mood
    const speaker = identifySpeaker(title, text);
    const mood = getMood(speaker.key);

    // Update left panel (NPC info)
    const npcAvatar = document.getElementById("dialogueAvatar");
    const npcName = document.getElementById("dialogueNpcName");
    const npcFaction = document.getElementById("dialogueNpcFaction");
    const npcMood = document.getElementById("dialogueNpcMood");
    
    if (npcAvatar) {
        if (deps && deps.ui && deps.ui.paintThumb) {
            deps.ui.paintThumb(npcAvatar, 'npc', speaker.key, speaker.avatar, speaker.name);
        } else {
            npcAvatar.textContent = speaker.avatar;
        }
    }
    if (deps && deps.ui && deps.ui.setScene) {
        deps.ui.setScene({ kind: 'npc', id: speaker.key, label: speaker.name, sub: speaker.faction, emoji: speaker.avatar });
    }
    if (npcName) npcName.textContent = t(speaker.name);
    
    if (npcFaction) {
        npcFaction.textContent = t(speaker.faction).toUpperCase();
        npcFaction.className = `dialogue-npc-faction border px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${speaker.factionClass}`;
    }
    
    if (npcMood) {
        npcMood.innerHTML = `<span class="mr-1">${mood.emoji}</span> ${mood.label.toUpperCase()}`;
        npcMood.className = `dialogue-npc-mood px-2 py-0.5 rounded text-xs font-bold ${mood.colorClass}`;
    }

    // Apply mood color class to the NPC panel for atmospheric lighting
    const npcPanel = document.getElementById("dialogueNpcPanel");
    if (npcPanel) {
        npcPanel.className = `dialogue-npc-panel flex flex-col items-center justify-center p-6 border-r border-gray-800/40 relative overflow-hidden bg-opacity-30 ${mood.colorClass}-bg`;
    }

    // Update right panel (Text body & Choices)
    const dialogueTitleText = document.getElementById("dialogueTitleText");
    const textBody = document.getElementById("dialogueTextBody");
    const choicesList = document.getElementById("dialogueChoicesList");
    const rollBox = document.getElementById("dialogueRollBox");

    if (dialogueTitleText) dialogueTitleText.textContent = t(title).toUpperCase();
    if (textBody) textBody.innerHTML = t(text);
    
    // Hide roll box by default
    if (rollBox) rollBox.style.display = "none";
    
    // Render options
    if (choicesList) {
        choicesList.innerHTML = "";
        
        let currentOptions = options;
        if (!currentOptions || currentOptions.length === 0) {
            currentOptions = [{ text: "Continue", action: hideDialogue }];
        }

        currentOptions.forEach(option => {
            const button = document.createElement("button");
            
            // Check if it's a skill check to format the badge nicely
            let buttonText = t(option.text);
            let checkClass = "dialogue-choice-btn";
            
            if (buttonText.startsWith("[")) {
                const badgeMatch = buttonText.match(/^\[(.*?)\]/);
                if (badgeMatch) {
                    const badgeContent = badgeMatch[1];
                    const cleanText = buttonText.replace(/^\[.*?\]\s*/, "");
                    
                    let badgeColor = "bg-gray-800 text-gray-400 border-gray-700";
                    if (badgeContent.includes("STR")) badgeColor = "bg-red-955/80 text-red-400 border-red-800/60";
                    else if (badgeContent.includes("AGI")) badgeColor = "bg-green-955/80 text-green-400 border-green-800/60";
                    else if (badgeContent.includes("INT")) badgeColor = "bg-cyan-955/80 text-cyan-400 border-cyan-800/60";
                    else if (badgeContent.includes("CHA")) badgeColor = "bg-purple-955/80 text-purple-400 border-purple-800/60";
                    
                    button.innerHTML = `<span class="dialogue-check-badge px-2 py-0.5 border text-2xs font-bold rounded mr-3 uppercase tracking-wider ${badgeColor}">${badgeContent}</span> <span class="flex-1 text-left">${cleanText}</span>`;
                } else {
                    button.textContent = buttonText;
                }
            } else {
                button.textContent = buttonText;
            }

            if (option.disabled) {
                button.className = `${checkClass} opacity-40 cursor-not-allowed border-dashed border-gray-800 text-gray-500`;
                button.disabled = true;
            } else {
                button.className = `${checkClass} border border-cyan-900/30 hover:border-cyan-400/50 text-white hover:text-cyan-200 transition-all duration-200`;
                button.onclick = () => {
                    if (option.action) option.action();
                };
            }
            choicesList.appendChild(button);
        });
    }

    // Display overlay
    overlay.style.display = "flex";
}

/**
 * Close the dialogue overlay
 */
export function hideDialogue() {
    const overlay = document.getElementById("dialogueOverlay");
    if (overlay) {
        overlay.style.display = "none";
    }
    if (deps && deps.ui && deps.ui.clearScene) deps.ui.clearScene('npc');
}

/**
 * Execute and animate a virtual d20 skill check roll
 */
export function showDialogueRoll({ attribute, dc, rollValue, modifier, total, isSuccess, onComplete }) {
    const rollBox = document.getElementById("dialogueRollBox");
    const choicesList = document.getElementById("dialogueChoicesList");
    
    if (!rollBox) {
        // Fallback if DOM element is missing
        onComplete();
        return;
    }

    // Disable all choice buttons during the roll animation to prevent double-click
    if (choicesList) {
        const buttons = choicesList.querySelectorAll("button");
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add("opacity-50", "pointer-events-none");
        });
    }

    // Set up the roll box content
    const rollAttr = document.getElementById("dialogueRollAttribute");
    const rollDc = document.getElementById("dialogueRollDc");
    const d20Display = document.getElementById("dialogueRollD20");
    const rollMath = document.getElementById("dialogueRollMath");
    const rollResult = document.getElementById("dialogueRollResult");

    if (rollAttr) rollAttr.textContent = attribute.toUpperCase();
    if (rollDc) rollDc.textContent = `DC ${dc}`;
    if (rollResult) {
        rollResult.textContent = "";
        rollResult.className = "dialogue-roll-result font-black tracking-widest text-center py-1 rounded text-xl uppercase opacity-0";
    }

    // Show the roll box with a smooth slide/fade-in
    rollBox.style.display = "block";
    rollBox.classList.remove("roll-success-glow", "roll-failure-glow");

    // Play d20 spinning scramble animation
    let duration = 1200; // ms
    let intervalTime = 50; // ms
    let elapsed = 0;

    const spinInterval = setInterval(() => {
        const tempRoll = Math.floor(Math.random() * 20) + 1;
        if (d20Display) {
            d20Display.textContent = tempRoll;
            d20Display.className = "dialogue-roll-d20 spinning-dice text-yellow-500/80";
        }
        elapsed += intervalTime;

        if (elapsed >= duration) {
            clearInterval(spinInterval);
            
            // Finalize roll values
            if (d20Display) {
                d20Display.textContent = rollValue;
                d20Display.className = `dialogue-roll-d20 font-black scale-125 transition-transform duration-300 ${isSuccess ? 'text-green-400' : 'text-red-400'}`;
            }

            // Display math formula
            const sign = modifier >= 0 ? "+" : "";
            if (rollMath) {
                rollMath.innerHTML = `Roll: <span class="font-bold">${rollValue}</span> ${sign} Mod: <span class="font-bold">${modifier}</span> = Total: <span class="font-bold text-lg ${isSuccess ? 'text-green-400' : 'text-red-400'}">${total}</span>`;
            }

            // Display success/failure banner
            if (rollResult) {
                if (isSuccess) {
                    rollResult.textContent = "SUCCESS";
                    rollResult.className = "dialogue-roll-result font-black tracking-widest text-center py-1 rounded text-xl bg-green-950/80 text-green-400 border border-green-700/50 glow-green animate-bounce";
                    rollBox.classList.add("roll-success-glow");
                } else {
                    rollResult.textContent = "FAILURE";
                    rollResult.className = "dialogue-roll-result font-black tracking-widest text-center py-1 rounded text-xl bg-red-950/80 text-red-400 border border-red-700/50 glow-red animate-pulse";
                    rollBox.classList.add("roll-failure-glow");
                }
            }

            // Advance after player sees outcome
            setTimeout(() => {
                rollBox.style.display = "none";
                hideDialogue();
                onComplete();
            }, 1800);
        }
    }, intervalTime);
}

/**
 * Show the theatrical ending epilogue text crawl
 */
export function showEpilogueCrawl(endingType, onComplete) {
    const overlay = document.getElementById("epilogueCrawlOverlay");
    const content = document.getElementById("crawlContent");
    const skipBtn = document.getElementById("skipCrawlBtn");
    
    if (!overlay || !content) {
        onComplete();
        return;
    }

    // Crawl texts based on endingType
    const texts = {
        federation: `
            <h2>EPILOGUE: THE IRON ORDER</h2>
            <p>With the activation of the ancient orbital weapons network, Captain Vance and the Galactic Federation establish absolute control over the sector.</p>
            <p>The Corsair fleets are systematically dismantled, their crews arrested or scattered to the outer rim. Fearing the unstoppable orbital batteries, the Syndicate locks its research vaults and pledges allegiance to Federation authority.</p>
            <p>A lasting peace descends upon the star systems, bought at the cost of absolute surveillance and military rule.</p>
            <p>As the iron grip of the Federation tightens, you are recognized as a Hero of the Order, though the quiet whisper of freedom still echoes in the dark corridors of space...</p>
        `,
        corsairs: `
            <h2>EPILOGUE: THE LAWLESS EDGE</h2>
            <p>Envoy Nesta detonates the weapons cache, unleashing a localized EMP shockwave that permanently disables the Federation's regional hubs.</p>
            <p>Without central coordinates and communications, the Federation forces withdraw from the sector. The star systems dissolve into a vibrant, chaotic sanctuary of smugglers, independent traders, and pirate alliances.</p>
            <p>The Syndicate retreats into cloaked space, trading advanced cybernetics to the highest bidder in lawless shipyards.</p>
            <p>A golden era of anarchy and exploration begins. You are celebrated as a pirate legend, sailing a sector where the only rule is the range of your laser cannons...</p>
        `,
        syndicate: `
            <h2>EPILOGUE: THE TECHNO-SINGULARITY</h2>
            <p>Dr. Thorne channels the ultimate weapons energy directly into the Syndicate's experimental Singularity Core on Norkon Outpost.</p>
            <p>The resulting digital cascade ripples across the sector. Organic minds are uploaded and merged with the planetary networks. Physical bodies are enhanced with seamless, self-replicating cybernetics.</p>
            <p>The old political squabbles of the Federation and Corsairs vanish, replaced by the silent, absolute harmony of the Hive Mind.</p>
            <p>You transcend your organic limitations, becoming a prime node in the new cosmic network. A new era of post-biological evolution begins...</p>
        `,
        coalition: `
            <h2>EPILOGUE: THE UNIFIED COALITION</h2>
            <p>Using supreme diplomatic persuasion, you force all three factions to sign the historic Coalition Treaty, locking the weapon cache in a neutral vault.</p>
            <p>A joint council is formed, representing the Federation, Corsairs, and Syndicate equally. Trade blockades are lifted, piracy declines, and joint scientific initiatives flourish.</p>
            <p>The sector enters a legendary golden age of cooperative progress and prosperity, proving that cooperation can triumph over division.</p>
            <p>Your name is written in the stars as the Great Peacemaker, a beacon of hope in a dark universe...</p>
        `
    };

    const crawlHtml = t(texts[endingType] || texts.coalition);
    content.innerHTML = crawlHtml;

    // Show the overlay
    overlay.style.display = "flex";

    // Set up cleanup and transition
    let completed = false;
    
    const cleanupAndProceed = () => {
        if (completed) return;
        completed = true;
        
        // Hide overlay
        overlay.style.display = "none";
        
        // Call callback
        onComplete();
    };

    // Auto-complete when the 45-second animation finishes
    const autoTimer = setTimeout(cleanupAndProceed, 45000);

    // Click to skip
    if (skipBtn) {
        skipBtn.onclick = () => {
            clearTimeout(autoTimer);
            cleanupAndProceed();
        };
    }
}
