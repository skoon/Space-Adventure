/**
 * Cybernetics System Module
 * Handles cybernetic slot initialization, augmentations, and surgery operations
 */

let state;
let addLog, updateUI;

export const IMPLANTS = {
    targeting_matrix: {
        id: 'targeting_matrix',
        name: 'Targeting Matrix',
        slot: 'head',
        description: 'Increases standard critical damage multiplier by +0.5x (also increases Warrior Power Strike and Rogue Assassinate).',
        cost: { credits: 250, materials: { 'Quantum Chip': 1, 'Circuit Board': 2 } }
    },
    reflex_boosters: {
        id: 'reflex_boosters',
        name: 'Reflex Boosters',
        slot: 'arms',
        description: 'Grants a 35% chance to start combat with +1 initial Action Point (AP).',
        cost: { credits: 300, materials: { 'Robotic Arm': 2, 'Circuit Board': 2 } }
    },
    subdermal_plating: {
        id: 'subdermal_plating',
        name: 'Sub-dermal Plating',
        slot: 'torso',
        description: 'Converts 15% of incoming physical damage into energy drain instead of health loss.',
        cost: { credits: 400, materials: { 'Titanium Ingot': 2, 'Nanites': 4 } }
    },
    synaptic_accelerator: {
        id: 'synaptic_accelerator',
        name: 'Synaptic Accelerator',
        slot: 'nervous',
        description: 'Increases Dodge Action success chance by +15% (for a total of 45% dodge chance).',
        cost: { credits: 200, materials: { 'Bio-Gel': 3, 'Carbon Nanotubes': 2 } }
    }
};

/**
 * Initialize the Cybernetics system module
 */
export function initCybernetics(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;

    if (state && state.character) {
        if (!state.character.cybernetics) {
            state.character.cybernetics = {
                head: null,
                arms: null,
                torso: null,
                nervous: null
            };
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
    state.character.cybernetics = state.character.cybernetics || { head: null, arms: null, torso: null, nervous: null };

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

    // Clear the slot
    state.character.cybernetics[slot] = null;

    if (addLog) addLog(`🦾 CYBERNETICS: Removed implant from the ${slot.toUpperCase()} slot. Charged ${removalFee} CR fee.`);
    if (updateUI) updateUI();

    return { success: true, message: `Removed ${implant ? implant.name : 'implant'} successfully.` };
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
