/**
 * Cybernetics Clinic UI Module
 * Renders the Cybernetic Augmentation Clinic tab inside the Spacecraft Hub Modal
 */

import { IMPLANTS, getActiveSynergies } from '../cybernetics.js';

let state;
let deps;

export function initCyberneticsUI(dependencies) {
    deps = dependencies;
    state = deps.state;
}

/**
 * Render the Augmentation Clinic tab interface
 */
export function renderCyberneticsTab() {
    const container = document.getElementById('shipCyberneticsPanel');
    if (!container) return;

    if (!state || !state.character) {
        container.innerHTML = `<div class="text-center text-gray-500 py-6">No active character profile loaded.</div>`;
        return;
    }

    // Set default empty state for cybernetics if missing
    state.character.cybernetics = state.character.cybernetics || { head: null, arms: null, torso: null, nervous: null };

    // Get current material counts in inventory
    const inventoryCounts = {};
    state.inventory.forEach(item => {
        inventoryCounts[item] = (inventoryCounts[item] || 0) + 1;
    });

    let html = `
        <div class="p-2">
            <div class="flex justify-between items-center mb-4 pb-2 border-b border-cyan-900/60 font-mono">
                <span class="text-cyan-400 font-bold text-base">🔬 Cybernetic Augmentation Clinic</span>
                <span class="text-yellow-400 font-bold">Credits: ${state.character.credits} CR</span>
            </div>
            
            <p class="text-gray-400 text-xs mb-6 font-mono leading-relaxed">
                Welcome to the ship med-bay surgical suite. Below you can install specialized cybernetic augmentations. 
                Surgical installation consumes credits and rare components. Removal requires a <span class="text-yellow-500 font-bold">50 CR</span> surgical fee and destroys the implant.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;

    const slots = [
        { id: 'head', label: '🧠 Head Slot', icon: '🧠' },
        { id: 'arms', label: '🦾 Arms Slot', icon: '🦾' },
        { id: 'torso', label: '🛡️ Torso Slot', icon: '🛡️' },
        { id: 'nervous', label: '⚡ Nervous System Slot', icon: '⚡' }
    ];

    slots.forEach(slot => {
        const equippedId = state.character.cybernetics[slot.id];
        const equipped = equippedId ? IMPLANTS[equippedId] : null;

        html += `
            <!-- Slot Card -->
            <div class="p-4 border ${equipped ? 'border-cyan-500/80 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-gray-800/80 bg-black/20'} rounded-lg relative flex flex-col justify-between min-h-[190px]">
                <div>
                    <div class="flex justify-between items-center mb-2 font-mono text-xs border-b border-gray-800 pb-1.5">
                        <span class="font-bold uppercase tracking-wider ${equipped ? 'text-cyan-400' : 'text-gray-400'}">${slot.label}</span>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${equipped ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-gray-900 text-gray-500 border border-gray-800'}">
                            ${equipped ? 'AUGMENTED' : 'VACANT'}
                        </span>
                    </div>
        `;

        if (equipped) {
            html += `
                    <!-- Installed Implant Info -->
                    <div class="mb-4">
                        <h4 class="font-bold text-cyan-300 text-sm mb-1">${equipped.name}</h4>
                        <p class="text-gray-400 text-xs leading-normal font-mono">${equipped.description}</p>
                    </div>
                </div>
                <div>
                    <button onclick="window.uninstallCyberneticImplant('${slot.id}')"
                            class="w-full py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 rounded text-[10px] font-bold tracking-widest transition-colors uppercase font-mono shadow-[0_0_8px_rgba(239,68,68,0.1)]">
                        🪓 Surgical Extraction (50 CR)
                    </button>
                </div>
            </div>
            `;
        } else {
            // Vacant Slot - list options
            const options = Object.values(IMPLANTS).filter(impl => impl.slot === slot.id);
            
            html += `
                    <!-- Vacant Slot Options -->
                    <div class="space-y-4">
            `;

            options.forEach(option => {
                const canAffordCredits = state.character.credits >= option.cost.credits;
                let canAffordMaterials = true;
                
                let materialsHtml = '';
                const matEntries = Object.entries(option.cost.materials);
                
                matEntries.forEach(([material, amount]) => {
                    const count = inventoryCounts[material] || 0;
                    const isEnough = count >= amount;
                    if (!isEnough) canAffordMaterials = false;
                    
                    materialsHtml += `
                        <span class="inline-block text-[10px] px-1.5 py-0.5 rounded border font-mono ${isEnough ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/60' : 'bg-red-950/20 text-red-500 border-red-950/60'}" title="${material}">
                            ${material}: ${count}/${amount}
                        </span>
                    `;
                });

                const canInstall = canAffordCredits && canAffordMaterials;
                const buttonClass = canInstall 
                    ? "bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                    : "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed";

                html += `
                    <div class="p-3 bg-black/40 border border-gray-900 rounded-lg flex flex-col justify-between gap-2.5">
                        <div>
                            <div class="flex justify-between items-center mb-1">
                                <h4 class="font-bold text-cyan-400/90 text-[13px]">${option.name}</h4>
                                <span class="text-xs text-yellow-400 font-mono font-bold">${option.cost.credits} CR</span>
                            </div>
                            <p class="text-[11px] text-gray-500 leading-normal mb-2">${option.description}</p>
                            <div class="flex flex-wrap gap-1 mb-1">
                                ${materialsHtml}
                            </div>
                        </div>
                        <button onclick="window.installCyberneticImplant('${option.id}')"
                                class="w-full py-1.5 border rounded text-[10px] font-bold tracking-widest transition-all uppercase font-mono ${buttonClass}"
                                ${!canInstall ? 'disabled' : ''}>
                            🧬 Perform Implant surgery
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            </div>
            `;
        }
    });

    // Render Active Synergies section if there are any active synergies
    const activeSynergies = getActiveSynergies ? getActiveSynergies() : [];
    if (activeSynergies.length > 0) {
        html += `
            <div class="mt-6 p-4 border border-cyan-500/30 bg-cyan-950/5 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                <h3 class="font-mono text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-cyan-900/40 pb-1.5">
                    <span>⚡ Active Augmentation Synergies</span>
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                </h3>
                <div class="space-y-2.5 font-mono">
        `;
        activeSynergies.forEach(syn => {
            html += `
                    <div class="p-2.5 bg-black/40 border border-cyan-950 rounded flex flex-col gap-1">
                        <div class="flex justify-between items-center">
                            <span class="text-yellow-400 font-bold text-xs">» ${syn.name}</span>
                            <span class="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Active Synergy</span>
                        </div>
                        <p class="text-gray-400 text-[11px] leading-relaxed">${syn.description}</p>
                    </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Handle surgical installation of an implant
 */
export function handleInstallImplant(implantId) {
    import('../cybernetics.js').then(m => {
        const res = m.installImplant(implantId);
        if (res.success) {
            renderCyberneticsTab();
        } else {
            if (deps.ui.showDialog) {
                deps.ui.showDialog("Surgical Error", `<p class="text-red-500 font-bold">${res.message}</p>`);
            } else {
                alert(res.message);
            }
        }
    });
}

/**
 * Handle surgical extraction of an implant
 */
export function handleUninstallImplant(slot) {
    import('../cybernetics.js').then(m => {
        const res = m.uninstallImplant(slot);
        if (res.success) {
            renderCyberneticsTab();
        } else {
            if (deps.ui.showDialog) {
                deps.ui.showDialog("Extraction Failure", `<p class="text-red-500 font-bold">${res.message}</p>`);
            } else {
                alert(res.message);
            }
        }
    });
}
