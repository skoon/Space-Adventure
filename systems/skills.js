/**
 * Skill Tree System Module
 * Handles character skills, abilities, and passive bonuses
 */

let state;
let addLog, updateUI;

// Define the skill trees for each role
export const SKILL_TREES = {
    Warrior: [
        {
            id: 'warrior_heavy_strikes',
            name: 'Heavy Strikes',
            type: 'passive',
            description: '+5 Base Attack.',
            cost: 1,
            icon: '⚔️',
            path: 'Berserker',
            tier: 1,
            bonus: { attack: 5 }
        },
        {
            id: 'warrior_bloodlust',
            name: 'Bloodlust',
            type: 'passive',
            description: 'Defeating an enemy restores 10 HP. +5 Base Attack.',
            cost: 1,
            icon: '🩸',
            path: 'Berserker',
            tier: 2,
            requires: 'warrior_heavy_strikes',
            bonus: { attack: 5, healOnKill: 10 }
        },
        {
            id: 'warrior_whirlwind',
            name: 'Whirlwind',
            type: 'active',
            description: 'Active: Deals 1.0x damage to enemy, but refunds 1 AP on hit. Costs 40 Energy.',
            cost: 1,
            icon: '🌪️',
            path: 'Berserker',
            tier: 3,
            requires: 'warrior_bloodlust'
        },
        {
            id: 'warrior_toughness',
            name: 'Toughness',
            type: 'passive',
            description: '+5 Base Defense.',
            cost: 1,
            icon: '🛡️',
            path: 'Vanguard',
            tier: 1,
            bonus: { defense: 5 }
        },
        {
            id: 'warrior_adrenaline',
            name: 'Adrenaline Surge',
            type: 'passive',
            description: '+1 Max Action Points (AP).',
            cost: 1,
            icon: '⚡',
            path: 'Vanguard',
            tier: 2,
            requires: 'warrior_toughness',
            bonus: { maxAp: 1 }
        },
        {
            id: 'warrior_shield_wall',
            name: 'Shield Wall',
            type: 'active',
            description: 'Active: Gain Shield Boost (+8 Defense) for 3 turns. Costs 20 Energy.',
            cost: 1,
            icon: '🔰',
            path: 'Vanguard',
            tier: 3,
            requires: 'warrior_adrenaline'
        }
    ],
    Rogue: [
        {
            id: 'rogue_lethality',
            name: 'Lethality',
            type: 'passive',
            description: '+15% Critical Hit Chance.',
            cost: 1,
            icon: '🎯',
            path: 'Assassin',
            tier: 1,
            bonus: { critChance: 0.15 }
        },
        {
            id: 'rogue_opportunist',
            name: 'Opportunist',
            type: 'passive',
            description: 'Deal +20% damage to poisoned or stunned enemies.',
            cost: 1,
            icon: '🗡️',
            path: 'Assassin',
            tier: 2,
            requires: 'rogue_lethality',
            bonus: { opportunistDmg: 0.20 }
        },
        {
            id: 'rogue_shadowstrike',
            name: 'Shadow Strike',
            type: 'active',
            description: 'Active: Deals 2.0x damage and poisons the enemy. Costs 45 Energy.',
            cost: 1,
            icon: '🌑',
            path: 'Assassin',
            tier: 3,
            requires: 'rogue_opportunist'
        },
        {
            id: 'rogue_evasion',
            name: 'Evasion',
            type: 'passive',
            description: '+10% Dodge Chance.',
            cost: 1,
            icon: '💨',
            path: 'Infiltrator',
            tier: 1,
            bonus: { dodgeChance: 0.10 }
        },
        {
            id: 'rogue_fleeting_shadow',
            name: 'Fleeting Shadow',
            type: 'passive',
            description: 'Whenever you dodge an attack, regain 10 Energy and 1 AP.',
            cost: 1,
            icon: '👻',
            path: 'Infiltrator',
            tier: 2,
            requires: 'rogue_evasion',
            bonus: { dodgeRefund: 1 }
        },
        {
            id: 'rogue_smoke_bomb',
            name: 'Smoke Bomb',
            type: 'active',
            description: 'Active: Gain +30% Dodge Chance for 2 turns. Costs 25 Energy.',
            cost: 1,
            icon: '🌫️',
            path: 'Infiltrator',
            tier: 3,
            requires: 'rogue_fleeting_shadow'
        }
    ],
    Scientist: [
        {
            id: 'sci_energymatrix',
            name: 'Energy Matrix',
            type: 'passive',
            description: '+20 Max Energy, +5 Energy Regen per turn.',
            cost: 1,
            icon: '🔋',
            path: 'Technomancer',
            tier: 1,
            bonus: { maxEnergy: 20, energyRegen: 5 }
        },
        {
            id: 'sci_overload_boost',
            name: 'Plasma Overcharge',
            type: 'passive',
            description: 'Plasma damage deals +20% extra damage.',
            cost: 1,
            icon: '⚡',
            path: 'Technomancer',
            tier: 2,
            requires: 'sci_energymatrix',
            bonus: { plasmaDmgMultiplier: 0.20 }
        },
        {
            id: 'sci_overload',
            name: 'Overload',
            type: 'active',
            description: 'Active: Deals 2.0x damage and applies Defense Break. Costs 50 Energy.',
            cost: 1,
            icon: '💥',
            path: 'Technomancer',
            tier: 3,
            requires: 'sci_overload_boost'
        },
        {
            id: 'sci_fieldmedic',
            name: 'Field Medic',
            type: 'passive',
            description: 'Healing items are 50% more effective.',
            cost: 1,
            icon: '⚕️',
            path: 'Biotech',
            tier: 1,
            bonus: { healMultiplier: 0.5 }
        },
        {
            id: 'sci_nanite_repair',
            name: 'Nanite Repair',
            type: 'active',
            description: 'Active: Restore 40 HP and purge all negative status effects. Costs 30 Energy.',
            cost: 1,
            icon: '🧪',
            path: 'Biotech',
            tier: 2,
            requires: 'sci_fieldmedic'
        },
        {
            id: 'sci_acid_spray',
            name: 'Acid Spray',
            type: 'active',
            description: 'Active: Deal 1.5x damage and apply Melted status (-5 enemy defense) for 3 turns. Costs 30 Energy.',
            cost: 1,
            icon: '💨',
            path: 'Biotech',
            tier: 3,
            requires: 'sci_nanite_repair'
        }
    ]
};

/**
 * Initialize skills module
 */
export function initSkills(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

/**
 * Check if a skill is unlocked
 */
export function hasSkill(skillId) {
    if (!state || !state.character || !state.character.unlockedSkills) return false;
    return state.character.unlockedSkills.includes(skillId);
}

/**
 * Get the total passive bonus for a specific stat type
 */
export function getPassiveBonus(statName) {
    if (!state || !state.character || !state.character.unlockedSkills) return 0;
    
    let totalBonus = 0;
    const role = state.character.role;
    const tree = SKILL_TREES[role];
    
    if (!tree) return 0;
    
    for (const skill of tree) {
        if (skill.type === 'passive' && hasSkill(skill.id) && skill.bonus && skill.bonus[statName]) {
            totalBonus += skill.bonus[statName];
        }
    }
    
    return totalBonus;
}

/**
 * Attempt to unlock a skill
 */
export function unlockSkill(skillId) {
    if (!state || !state.character) return { success: false, message: "No character found." };
    if (state.character.skillPoints < 1) return { success: false, message: "Not enough Skill Points." };
    if (hasSkill(skillId)) return { success: false, message: "Skill already unlocked." };
    
    const role = state.character.role;
    const tree = SKILL_TREES[role];
    const skill = tree.find(s => s.id === skillId);
    
    if (!skill) return { success: false, message: "Skill not found." };
    
    if (skill.requires && !hasSkill(skill.requires)) {
        return { success: false, message: "Prerequisite skill not unlocked." };
    }
    
    // Unlock the skill
    state.character.skillPoints -= skill.cost;
    state.character.unlockedSkills.push(skillId);
    
    // Apply immediate passive stat boosts
    if (skill.bonus) {
        if (skill.bonus.maxAp) {
            state.character.maxAp += skill.bonus.maxAp;
            state.character.ap += skill.bonus.maxAp; // Give the AP immediately
        }
        if (skill.bonus.maxEnergy) {
            state.character.maxEnergy += skill.bonus.maxEnergy;
            state.character.energy += skill.bonus.maxEnergy; // Give the energy immediately
        }
    }
    
    addLog(`✨ You unlocked a new skill: ${skill.name}!`);
    updateUI();
    return { success: true };
}
