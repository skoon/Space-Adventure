/**
 * Cybernetics System Module
 * Handles cybernetic slot initialization, augmentations, surgery operations,
 * and skinnable nanite mod chip slotting.
 */

import { CYBERNETICS_CONFIG, IMPLANTS, MODS } from '../data/cybernetics.js';

export { CYBERNETICS_CONFIG, IMPLANTS, MODS };

// State object reference
let state;
let addLog, updateUI;

/**
 * Initialize the Cybernetics system module
 */
export function initCybernetics(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;

    if (state && state.character) {
        if (!state.character.cybernetics) {
            state.character.cybernetics = {};
            CYBERNETICS_CONFIG.slots.forEach(slot => {
                state.character.cybernetics[slot.id] = null;
            });
        }
        if (!state.character.cyberneticsMods) {
            state.character.cyberneticsMods = {};
            CYBERNETICS_CONFIG.slots.forEach(slot => {
                state.character.cyberneticsMods[slot.id] = [null, null];
            });
        }
    }
}

/**
 * Install a cybernetic implant
 */
export function installImplant(implantId) {
    if (!state || !state.character) {
        return { success: false, message: "No active character profile." };
    }

    const implant = IMPLANTS[implantId];
    if (!implant) {
        return { success: false, message: "Implant type not found." };
    }

    const slot = implant.slot;
    state.character.cybernetics = state.character.cybernetics || {};
    state.character.cyberneticsMods = state.character.cyberneticsMods || {};

    if (state.character.cybernetics[slot] === implantId) {
        return { success: false, message: `${implant.name} is already installed in this slot.` };
    }

    // Check credits
    if (state.character.credits < implant.cost.credits) {
        return { success: false, message: `Insufficient credits. Need ${implant.cost.credits} CR.` };
    }

    // Check inventory materials
    const inventoryCounts = {};
    state.inventory.forEach(item => {
        inventoryCounts[item] = (inventoryCounts[item] || 0) + 1;
    });

    for (const [material, amount] of Object.entries(implant.cost.materials)) {
        if ((inventoryCounts[material] || 0) < amount) {
            return { success: false, message: `Missing material: ${material} (need ${amount}, have ${inventoryCounts[material] || 0})` };
        }
    }

    // Spend credits and materials
    state.character.credits -= implant.cost.credits;
    for (const [material, amount] of Object.entries(implant.cost.materials)) {
        for (let i = 0; i < amount; i++) {
            const idx = state.inventory.indexOf(material);
            if (idx > -1) {
                state.inventory.splice(idx, 1);
            }
        }
    }

    // Equip the implant
    state.character.cybernetics[slot] = implantId;
    state.character.cyberneticsMods[slot] = state.character.cyberneticsMods[slot] || [null, null];

    if (addLog) addLog(`🦾 CYBERNETICS: Installed ${implant.name} successfully into the ${slot.toUpperCase()} slot!`);
    if (updateUI) updateUI();

    return { success: true, message: `Installed ${implant.name} successfully.` };
}

/**
 * Uninstall a cybernetic implant
 */
export function uninstallImplant(slot) {
    if (!state || !state.character || !state.character.cybernetics) {
        return { success: false, message: "No active character profile." };
    }

    const currentImplantId = state.character.cybernetics[slot];
    if (!currentImplantId) {
        return { success: false, message: `The ${slot.toUpperCase()} slot is already empty.` };
    }

    const implant = IMPLANTS[currentImplantId];
    const removalFee = 50; // credit fee

    if (state.character.credits < removalFee) {
        return { success: false, message: `Insufficient credits for surgery fee. Need ${removalFee} CR.` };
    }

    // Spend surgical removal fee
    state.character.credits -= removalFee;

    // Automatically recover mod chips in this implant and put back to inventory (no fee)
    if (state.character.cyberneticsMods && state.character.cyberneticsMods[slot]) {
        state.character.cyberneticsMods[slot].forEach((chipId, idx) => {
            if (chipId && MODS[chipId]) {
                const modConfig = MODS[chipId];
                state.inventory.push(modConfig.name);
                
                // Deduct HP/Energy stats if this chip granted them
                if (modConfig.stats) {
                    if (modConfig.stats.maxHp) {
                        state.character.maxHp -= modConfig.stats.maxHp;
                        state.character.hp = Math.min(state.character.hp, state.character.maxHp);
                    }
                    if (modConfig.stats.maxEnergy) {
                        state.character.maxEnergy -= modConfig.stats.maxEnergy;
                        state.character.energy = Math.min(state.character.energy, state.character.maxEnergy);
                    }
                }
                
                state.character.cyberneticsMods[slot][idx] = null;
                if (addLog) addLog(`🦾 CYBERNETICS: Recovered ${modConfig.name} from extracted implant.`);
            }
        });
    }

    // Clear the slot
    state.character.cybernetics[slot] = null;

    if (addLog) addLog(`🦾 CYBERNETICS: Removed implant from the ${slot.toUpperCase()} slot. Charged ${removalFee} CR fee.`);
    if (updateUI) updateUI();

    return { success: true, message: `Removed ${implant ? implant.name : 'implant'} successfully.` };
}

/**
 * Install a generic mod chip into a sub-slot
 */
export function installModChip(slot, index, chipItemName) {
    if (!state || !state.character) {
        return { success: false, message: "No active character profile." };
    }

    const equippedImplant = state.character.cybernetics?.[slot];
    if (!equippedImplant) {
        return { success: false, message: "No implant installed in this slot to modify." };
    }

    state.character.cyberneticsMods = state.character.cyberneticsMods || {};
    state.character.cyberneticsMods[slot] = state.character.cyberneticsMods[slot] || [null, null];

    if (state.character.cyberneticsMods[slot][index]) {
        return { success: false, message: "This mod sub-slot is already occupied." };
    }

    // Find mod configuration by mapping item name to ID
    const modConfig = Object.values(MODS).find(m => m.name === chipItemName);
    if (!modConfig) {
        return { success: false, message: "Invalid mod chip type." };
    }

    // Check inventory
    const chipIdx = state.inventory.indexOf(chipItemName);
    if (chipIdx === -1) {
        return { success: false, message: `Missing ${chipItemName} in inventory.` };
    }

    // Remove from inventory and slot it
    state.inventory.splice(chipIdx, 1);
    state.character.cyberneticsMods[slot][index] = modConfig.id;

    // Apply HP/Energy stat boosts immediately
    if (modConfig.stats) {
        if (modConfig.stats.maxHp) {
            state.character.maxHp += modConfig.stats.maxHp;
            state.character.hp += modConfig.stats.maxHp;
        }
        if (modConfig.stats.maxEnergy) {
            state.character.maxEnergy += modConfig.stats.maxEnergy;
            state.character.energy += modConfig.stats.maxEnergy;
        }
    }

    if (addLog) addLog(`🦾 CYBERNETICS: Slotted ${chipItemName} into ${slot.toUpperCase()} Slot ${index + 1}!`);
    if (updateUI) updateUI();

    return { success: true, message: `Slotted ${chipItemName} successfully.` };
}

/**
 * Extract a mod chip from a sub-slot for a fee, returning it to inventory
 */
export function uninstallModChip(slot, index) {
    if (!state || !state.character || !state.character.cyberneticsMods || !state.character.cyberneticsMods[slot]) {
        return { success: false, message: "No mods configuration found." };
    }

    const chipId = state.character.cyberneticsMods[slot][index];
    if (!chipId) {
        return { success: false, message: "Sub-slot is already vacant." };
    }

    const removalFee = 10;
    if (state.character.credits < removalFee) {
        return { success: false, message: `Insufficient credits for surgery fee. Need ${removalFee} CR.` };
    }

    const modConfig = MODS[chipId];
    if (!modConfig) {
        return { success: false, message: "Mod configuration not found." };
    }

    // Charge fee and return chip to inventory
    state.character.credits -= removalFee;
    state.inventory.push(modConfig.name);
    state.character.cyberneticsMods[slot][index] = null;

    // Deduct HP/Energy stat boosts
    if (modConfig.stats) {
        if (modConfig.stats.maxHp) {
            state.character.maxHp -= modConfig.stats.maxHp;
            state.character.hp = Math.min(state.character.hp, state.character.maxHp);
        }
        if (modConfig.stats.maxEnergy) {
            state.character.maxEnergy -= modConfig.stats.maxEnergy;
            state.character.energy = Math.min(state.character.energy, state.character.maxEnergy);
        }
    }

    if (addLog) addLog(`🦾 CYBERNETICS: Extracted ${modConfig.name} from ${slot.toUpperCase()} Slot ${index + 1}. Charged ${removalFee} CR fee.`);
    if (updateUI) updateUI();

    return { success: true, message: `Extracted ${modConfig.name} successfully.` };
}

/**
 * Get total system instability (sum of equipped chips instability)
 */
export function getSystemInstability() {
    if (!state || !state.character || !state.character.cyberneticsMods) return 0;
    let totalInstability = 0;
    Object.values(state.character.cyberneticsMods).forEach(slotsArr => {
        if (Array.isArray(slotsArr)) {
            slotsArr.forEach(chipId => {
                if (chipId && MODS[chipId]) {
                    totalInstability += MODS[chipId].instability || 0;
                }
            });
        }
    });
    return totalInstability;
}

/**
 * Get dynamic bonus from mod chips for a given stat name
 */
export function getModStatsBonus(statName) {
    if (!state || !state.character || !state.character.cyberneticsMods) return 0;
    let totalBonus = 0;
    Object.values(state.character.cyberneticsMods).forEach(slotsArr => {
        if (Array.isArray(slotsArr)) {
            slotsArr.forEach(chipId => {
                if (chipId && MODS[chipId] && MODS[chipId].stats && MODS[chipId].stats[statName] !== undefined) {
                    totalBonus += MODS[chipId].stats[statName];
                }
            });
        }
    });
    return totalBonus;
}

/**
 * Get active cybernetic synergies based on installed implants
 */
export function getActiveSynergies() {
    if (!state || !state.character || !state.character.cybernetics) return [];
    const cyb = state.character.cybernetics;
    const synergies = [];

    // Target Lock: head (targeting_matrix) + arms (reflex_boosters)
    if (cyb.head === 'targeting_matrix' && cyb.arms === 'reflex_boosters') {
        synergies.push({
            id: 'target_lock',
            name: 'Target Lock',
            description: 'In Berserker stance, each non-critical hit increases Crit Chance by +20% (stacks until next Critical Hit).'
        });
    }

    // Nanite Shielding: torso (subdermal_plating) + nervous (synaptic_accelerator)
    if (cyb.torso === 'subdermal_plating' && cyb.nervous === 'synaptic_accelerator') {
        synergies.push({
            id: 'nanite_shielding',
            name: 'Nanite Shielding',
            description: "Dr. Lyra's Nano-Heal also grants you a Shield Boost (+6 DEF) for 2 turns."
        });
    }

    // Cybernetic Overcharge: head (targeting_matrix) + torso (subdermal_plating)
    if (cyb.head === 'targeting_matrix' && cyb.torso === 'subdermal_plating') {
        synergies.push({
            id: 'cybernetic_overcharge',
            name: 'Cybernetic Overcharge',
            description: 'Reduces the Energy cost of all active abilities by 10.'
        });
    }

    // Neural Overdrive: arms (reflex_boosters) + nervous (synaptic_accelerator)
    if (cyb.arms === 'reflex_boosters' && cyb.nervous === 'synaptic_accelerator') {
        synergies.push({
            id: 'neural_overdrive',
            name: 'Neural Overdrive',
            description: 'Grants a 20% chance to refund 1 AP after using an active class ability.'
        });
    }

    return synergies;
}
