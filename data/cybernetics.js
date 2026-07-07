/**
 * Cybernetics Configuration Data File
 * Fully skinnable and decoupled slot, implant, and mod chip data.
 */

export const CYBERNETICS_CONFIG = {
    safeLimit: 15,
    slots: [
        { id: 'head', label: '🧠 Head Slot', icon: '🧠' },
        { id: 'arms', label: '🦾 Arms Slot', icon: '🦾' },
        { id: 'torso', label: '🛡️ Torso Slot', icon: '🛡️' },
        { id: 'nervous', label: '⚡ Nervous System Slot', icon: '⚡' }
    ]
};

export const IMPLANTS = {
    targeting_matrix: {
        id: 'targeting_matrix',
        name: 'Targeting Matrix',
        slot: 'head',
        description: 'Increases standard critical damage multiplier by +0.5x. Grants +3 Intelligence.',
        stats: { intelligence: 3 },
        cost: { credits: 250, materials: { 'Quantum Chip': 1, 'Circuit Board': 2 } }
    },
    reflex_boosters: {
        id: 'reflex_boosters',
        name: 'Reflex Boosters',
        slot: 'arms',
        description: 'Grants a 35% chance to start combat with +1 initial Action Point (AP). Grants +3 Agility.',
        stats: { agility: 3 },
        cost: { credits: 300, materials: { 'Robotic Arm': 2, 'Circuit Board': 2 } }
    },
    subdermal_plating: {
        id: 'subdermal_plating',
        name: 'Sub-dermal Plating',
        slot: 'torso',
        description: 'Converts 15% of incoming physical damage into energy drain instead of health loss. Grants +3 Strength.',
        stats: { strength: 3 },
        cost: { credits: 400, materials: { 'Titanium Ingot': 2, 'Nanites': 4 } }
    },
    synaptic_accelerator: {
        id: 'synaptic_accelerator',
        name: 'Synaptic Accelerator',
        slot: 'nervous',
        description: 'Increases Dodge Action success chance by +15%. Grants +3 Agility.',
        stats: { agility: 3 },
        cost: { credits: 200, materials: { 'Bio-Gel': 3, 'Carbon Nanotubes': 2 } }
    }
};

export const MODS = {
    crit_mod_chip: {
        id: 'crit_mod_chip',
        name: 'Crit Mod Chip',
        description: 'Adds +5% Critical Strike Chance to the installed cybernetic implant.',
        instability: 5,
        stats: { critChance: 0.05 }
    },
    shield_mod_chip: {
        id: 'shield_mod_chip',
        name: 'Shield Mod Chip',
        description: 'Adds +5 Defense to the installed cybernetic implant.',
        instability: 5,
        stats: { defense: 5 }
    },
    hp_mod_chip: {
        id: 'hp_mod_chip',
        name: 'HP Mod Chip',
        description: 'Adds +10 Max HP to the installed cybernetic implant.',
        instability: 5,
        stats: { maxHp: 10 }
    },
    energy_mod_chip: {
        id: 'energy_mod_chip',
        name: 'Energy Mod Chip',
        description: 'Adds +15 Max Energy to the installed cybernetic implant.',
        instability: 5,
        stats: { maxEnergy: 15 }
    },
    dodge_mod_chip: {
        id: 'dodge_mod_chip',
        name: 'Dodge Mod Chip',
        description: 'Adds +5% Dodge Chance to the installed cybernetic implant.',
        instability: 5,
        stats: { dodgeChance: 0.05 }
    }
};
