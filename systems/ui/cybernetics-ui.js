/**
 * Cybernetics Clinic UI Module
 * Renders the Cybernetic Augmentation Clinic tab inside the Spacecraft Hub Modal,
 * supporting generic slots, implants, and mod sub-slots with instability gauges.
 */

import { CYBERNETICS_CONFIG, IMPLANTS, MODS, getActiveSynergies, getSystemInstability } from '../cybernetics.js';
import { t } from '../theme-engine.js';

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
        container.innerHTML = t(`<div class="text-center text-gray-500 py-6">No active character profile loaded.</div>`);
        return;
    }

    // Default initialization
    state.character.cybernetics = state.character.cybernetics || {};
    state.character.cyberneticsMods = state.character.cyberneticsMods || {};
    CYBERNETICS_CONFIG.slots.forEach(slot => {
        if (state.character.cybernetics[slot.id] === undefined) {
            state.character.cybernetics[slot.id] = null;
        }
        if (!state.character.cyberneticsMods[slot.id]) {
            state.character.cyberneticsMods[slot.id] = [null, null];
        }
    });

    // Get current material counts in inventory
    const inventoryCounts = {};
    state.inventory.forEach(item => {
        inventoryCounts[item] = (inventoryCounts[item] || 0) + 1;
    });

    // Filter out chips available in inventory
    const inventoryChips = state.inventory.filter(itemName => {
        return Object.values(MODS).some(m => m.name === itemName);
    });

    // Calculate Instability
    const instability = getSystemInstability ? getSystemInstability() : 0;
    const safeLimit = CYBERNETICS_CONFIG.safeLimit || 15;
    const pct = Math.min(100, (instability / safeLimit) * 100);
    const instabilityColor = instability > safeLimit ? 'text-red-500 animate-pulse' : 'text-cyan-400';
    const gaugeBarColor = instability > safeLimit 
        ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' 
        : 'bg-gradient-to-r from-cyan-600 to-teal-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]';

    let html = `
        <div class="p-2">
            <div class="flex justify-between items-center mb-4 pb-2 border-b border-cyan-900/60 font-mono">
                <span class="text-cyan-400 font-bold text-base">🔬 Cybernetic Augmentation Clinic</span>
                <span class="text-yellow-400 font-bold">Credits: ${state.character.credits} CR</span>
            </div>
            
            <p class="text-gray-400 text-xs mb-4 font-mono leading-relaxed">
                Welcome to the ship med-bay surgical suite. Below you can install specialized cybernetic augmentations. 
                Surgical installation consumes credits and rare components. Removal requires a <span class="text-yellow-500 font-bold">50 CR</span> surgical fee.
            </p>

            <!-- Instability Panel -->
            <!-- Instability and SP purchase Panel -->
            <div class="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="p-4 border border-gray-800 bg-gray-950/40 rounded-lg flex justify-between items-center gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-gray-300 font-mono">System Instability:</span>
                            <span class="text-sm font-mono font-bold ${instabilityColor}">${instability} / ${safeLimit} Safe Limit</span>
                        </div>
                        <p class="text-[10px] text-gray-400 font-mono mt-1 mb-0">
                            ${instability > safeLimit 
                                ? '🚨 WARNING: Exceeding safe limit! Feedback glitch risk.' 
                                : '✓ Safe Limit: Cybernetic interfaces are functioning normally.'}
                        </p>
                    </div>
                    <div class="w-32 bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800">
                        <div class="h-full ${gaugeBarColor} rounded-full transition-all duration-300" style="width: ${pct}%"></div>
                    </div>
                </div>

                <div class="p-4 border border-cyan-900/40 bg-cyan-950/5 rounded-lg flex justify-between items-center gap-4">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono block">Neural Terminal</span>
                        <p class="text-[10px] text-gray-400 font-mono mt-1 mb-0">
                            Inject Neural Adaptors. Cost: <span class="text-yellow-500 font-bold">500 CR + 1 Quantum Chip</span>
                        </p>
                    </div>
                    <button onclick="window.purchaseSpecializationPoint()"
                            class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 border border-cyan-500 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all font-mono shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                        Acquire SP
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;

    CYBERNETICS_CONFIG.slots.forEach(slot => {
        const equippedId = state.character.cybernetics[slot.id];
        const equipped = equippedId ? IMPLANTS[equippedId] : null;

        html += `
            <!-- Slot Card -->
            <div class="p-4 border ${equipped ? 'border-cyan-500/80 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'border-gray-800/80 bg-black/20'} rounded-lg relative flex flex-col justify-between min-h-[260px]">
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
                    <div class="mb-3">
                        <h4 class="font-bold text-cyan-300 text-sm mb-1">${equipped.name}</h4>
                        <p class="text-gray-400 text-xs leading-normal font-mono mb-2">${equipped.description}</p>
                    </div>

                    <!-- Mod Chip Sub-slots -->
                    <div class="mt-3 border-t border-cyan-950/40 pt-2.5">
                        <span class="text-[10px] uppercase font-bold text-gray-400 font-mono block mb-2">Nanite Mod Slots:</span>
            `;

            for (let idx = 0; idx < 2; idx++) {
                const chipId = state.character.cyberneticsMods[slot.id]?.[idx];
                const chip = chipId ? MODS[chipId] : null;

                if (chip) {
                    html += `
                        <div class="flex justify-between items-center bg-cyan-950/20 border border-cyan-800/40 p-2 rounded mb-2 text-[11px] font-mono">
                            <div class="pr-2">
                                <span class="text-cyan-400 font-bold text-xs">${chip.name}</span>
                                <p class="text-[9px] text-gray-500 leading-normal">${chip.description} (+${chip.instability} Instability)</p>
                            </div>
                            <button onclick="window.uninstallModChip('${slot.id}', ${idx})" 
                                    class="flex-shrink-0 px-2 py-1 bg-red-950/40 hover:bg-red-900 border border-red-900 text-red-400 rounded text-[9px] uppercase font-bold tracking-widest transition-colors font-mono">
                                Extract (10 CR)
                            </button>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="flex gap-2 items-center bg-black/30 border border-gray-900 p-2 rounded mb-2 text-[11px] font-mono">
                            <span class="text-gray-500 font-bold uppercase text-[9px] px-1 bg-gray-900 border border-gray-800 rounded">Slot ${idx + 1} Empty</span>
                            ${inventoryChips.length > 0 ? `
                                <select id="modChipSelect_${slot.id}_${idx}" class="bg-gray-850 border border-cyan-900/60 rounded text-[10px] text-gray-300 font-mono py-0.5 px-1.5 flex-grow">
                                    ${inventoryChips.map(chipName => `<option value="${chipName}">${chipName}</option>`).join('')}
                                </select>
                                <button onclick="window.installModChip('${slot.id}', ${idx})" 
                                        class="px-2.5 py-0.5 bg-cyan-900/50 hover:bg-cyan-850 border border-cyan-800 text-cyan-400 rounded text-[10px] uppercase font-bold tracking-wider transition-colors font-mono">
                                    Slot
                                </button>
                            ` : `
                                <span class="text-gray-500 italic text-[10px] flex-grow text-center">No chips in inventory</span>
                            `}
                        </div>
                    `;
                }
            }

            html += `
                    </div>
                </div>
                <div class="mt-4">
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

    container.innerHTML = t(html);
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

/**
 * Handle surgical installation of a mod chip
 */
export function handleInstallModChip(slot, index) {
    const select = document.getElementById(`modChipSelect_${slot}_${index}`);
    if (!select) return;
    const chipName = select.value;
    if (!chipName) return;

    import('../cybernetics.js').then(m => {
        const res = m.installModChip(slot, index, chipName);
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
 * Handle surgical extraction of a mod chip
 */
export function handleUninstallModChip(slot, index) {
    import('../cybernetics.js').then(m => {
        const res = m.uninstallModChip(slot, index);
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

/**
 * Handle purchasing a Specialization Point
 */
export function handleBuySpecializationPoint() {
    import('../character.js').then(m => {
        const res = m.buySpecializationPoint();
        if (res.success) {
            renderCyberneticsTab();
        } else {
            if (deps.ui.showDialog) {
                deps.ui.showDialog("Terminal Error", `<p class="text-red-500 font-bold">${res.message}</p>`);
            } else {
                alert(res.message);
            }
        }
    });
}
