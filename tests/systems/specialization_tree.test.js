import {
    initSkills,
    unlockSpecialization,
    hasSpecialization,
    getSpecializationPassiveBonus,
    SPECIALIZATION_TREES
} from '../../systems/skills.js';

import {
    initCharacter,
    gainXp,
    buySpecializationPoint
} from '../../systems/character.js';

import {
    initCombat,
    playerAttack,
    enemyTurn,
    processStatusEffects,
    useOverdriveStrikes,
    useSystemOverride,
    checkEmergencyNanites
} from '../../systems/combat.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockUpdateCombatLog = jest.fn();
const mockUpdateCombatUI = jest.fn();

const mockState = {
    character: {
        name: 'Specialist',
        credits: 1000,
        level: 1,
        xp: 0,
        hp: 100,
        maxHp: 100,
        energy: 50,
        maxEnergy: 100,
        ap: 3,
        maxAp: 3,
        role: 'Warrior',
        attack: 10,
        defense: 5,
        cybernetics: null,
        cyberneticsMods: null,
        unlockedSkills: [],
        unlockedSpecializations: [],
        specializationPoints: 0,
        skillPoints: 0,
        strength: 10,
        agility: 10,
        intelligence: 10,
        charisma: 10,
        equipment: { weapon: null, armor: null, accessory: null }
    },
    inventory: ['Quantum Chip', 'Quantum Chip'],
    enemy: {
        name: 'Space Raider',
        hp: 100,
        maxHp: 100,
        attack: 8,
        defense: 2,
        breakMax: 50,
        breakCurrent: 50
    },
    playerStatusEffects: [],
    enemyStatusEffects: [],
    gameState: 'exploring',
    currentLocation: 'terra_prime'
};

const mockCombatElements = {
    playerName: {}, playerHp: {}, playerMaxHp: {}, playerAtk: {}, playerDef: {},
    playerEnergy: {}, playerMaxEnergy: {}, playerHpBar: { style: {} }, playerEnergyBar: { style: {} },
    playerStatusEffects: { innerHTML: '', appendChild: jest.fn() }, playerAvatar: {},
    enemyName: {}, enemyHp: {}, enemyMaxHp: {}, enemyAtk: {}, enemyDef: {}, enemyHpBar: { style: {} },
    combatLog: {}
};

const mockUiDeps = {
    addLog: mockLog,
    updateUI: mockUpdateUI,
    updateCombatLog: mockUpdateCombatLog,
    showScreen: jest.fn(),
    getStatusEffectIcon: jest.fn().mockReturnValue('ICON'),
    showVictoryMessage: jest.fn(),
    showDialog: jest.fn(),
    showLevelUpNotification: jest.fn(),
    hideLevelUpNotification: jest.fn()
};

describe('Tech Tree Specialization System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockState.character.credits = 1000;
        mockState.character.hp = 100;
        mockState.character.maxHp = 100;
        mockState.character.energy = 50;
        mockState.character.maxEnergy = 100;
        mockState.character.level = 1;
        mockState.character.xp = 0;
        mockState.character.cybernetics = null;
        mockState.character.cyberneticsMods = null;
        mockState.character.unlockedSkills = [];
        mockState.character.unlockedSpecializations = [];
        mockState.character.specializationPoints = 0;
        mockState.character.ap = 3;
        mockState.character.maxAp = 3;
        mockState.inventory = ['Quantum Chip', 'Quantum Chip'];
        mockState.gameState = 'exploring';
        mockState.enemy = {
            name: 'Space Raider',
            hp: 100,
            maxHp: 100,
            attack: 8,
            defense: 2,
            breakMax: 50,
            breakCurrent: 50
        };
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];

        initSkills({
            state: mockState,
            ui: mockUiDeps
        });

        initCharacter({
            state: mockState,
            ui: mockUiDeps,
            exploration: { simulateExploration: jest.fn() }
        });

        initCombat({
            state: mockState,
            data: {
                enemies: [{ name: 'Space Raider', hp: 50, attack: 20, defense: 2, locations: ['terra_prime'] }],
                bosses: []
            },
            dom: { combatElements: mockCombatElements },
            ui: mockUiDeps,
            equipment: {
                getEffectiveStats: () => ({ attack: 10, defense: 5 })
            },
            character: {
                getCharacterAvatar: () => 'AVATAR',
                gainXp: jest.fn()
            },
            quests: {
                checkQuestProgress: jest.fn()
            },
            exploration: {
                simulateExploration: jest.fn()
            },
            settings: {
                getDifficulty: () => ({ enemyHpModifier: 1.0, enemyDmgModifier: 1.0 })
            }
        });
    });

    test('Specialization Points are awarded on level-up', () => {
        expect(mockState.character.specializationPoints).toBe(0);
        
        // Gain enough XP to level up (level 1 to 2 needs 100 XP)
        gainXp(120);
        
        expect(mockState.character.level).toBe(2);
        expect(mockState.character.specializationPoints).toBe(1);
    });

    test('Specialization Points can be bought for 500 CR and 1 Quantum Chip', () => {
        expect(mockState.character.specializationPoints).toBe(0);
        
        const buyRes = buySpecializationPoint();
        expect(buyRes.success).toBe(true);
        expect(mockState.character.specializationPoints).toBe(1);
        expect(mockState.character.credits).toBe(500);
        expect(mockState.inventory).toEqual(['Quantum Chip']);
    });

    test('sequential unlocking and prerequisite gating in specialization trees', () => {
        mockState.character.specializationPoints = 4;

        // Try unlocking tier 2 without tier 1
        const lockRes = unlockSpecialization('spec_staggering_force');
        expect(lockRes.success).toBe(false);
        expect(lockRes.message).toContain('Prerequisite');

        // Unlock Tier 1 Colossus Plating
        const unlock1 = unlockSpecialization('spec_colossus_plating');
        expect(unlock1.success).toBe(true);
        expect(hasSpecialization('spec_colossus_plating')).toBe(true);

        // Unlock Tier 2 Staggering Force
        const unlock2 = unlockSpecialization('spec_staggering_force');
        expect(unlock2.success).toBe(true);
        expect(hasSpecialization('spec_staggering_force')).toBe(true);

        // Try unlocking Tier 3 active without enough points (needs 2 SP, has 2 left)
        const unlock3 = unlockSpecialization('spec_overdrive_strikes');
        expect(unlock3.success).toBe(true); // cost 2 SP, player had 4 - 1 - 1 = 2 left, so it should succeed!
        expect(hasSpecialization('spec_overdrive_strikes')).toBe(true);
    });

    test('Heavy Combat specializations boost defense and break stagger damage in combat', () => {
        mockState.character.specializationPoints = 2;
        unlockSpecialization('spec_colossus_plating');
        unlockSpecialization('spec_staggering_force');

        // Defense passive bonus should be active (+5)
        expect(getSpecializationPassiveBonus('defense')).toBe(5);

        // Basic attack stagger damage: base Berserker stagger is 20.
        // Staggering Force adds +20% break multiplier.
        // 20 * 1.20 = 24.
        mockState.combatStance = "Berserker";
        playerAttack(); // Performs basic attack
        
        // Raiders breakCurrent starts at 50, deals 24 stagger damage. 50 - 24 = 26.
        expect(mockState.enemy.breakCurrent).toBe(26);
    });

    test('Overdrive Strikes deals 1.8x damage and high stagger damage in combat', () => {
        mockState.character.specializationPoints = 4;
        unlockSpecialization('spec_colossus_plating');
        unlockSpecialization('spec_staggering_force');
        unlockSpecialization('spec_overdrive_strikes');

        mockState.character.energy = 50;
        mockState.character.ap = 3;

        // Execute Overdrive Strikes
        useOverdriveStrikes();

        expect(mockState.character.ap).toBe(1); // costs 2 AP
        expect(mockState.character.energy).toBe(20); // costs 30 energy
        
        // Raider defense is 2. Warrior attack stats is 10.
        // Base damage = 10 - 2 = 8.
        // Overdrive Strikes damage multiplier is 1.8x.
        // 8 * 1.8 = 14 damage.
        expect(mockState.enemy.hp).toBe(86); // 100 - 14 damage

        // Stagger damage: base stagger is 40. With Staggering Force (+20%), it deals 40 * 1.2 = 48 stagger damage.
        // Raider break current was 50. 50 - 48 = 2.
        expect(mockState.enemy.breakCurrent).toBe(2);
    });

    test('System Override stuns the enemy', () => {
        mockState.character.specializationPoints = 4;
        unlockSpecialization('spec_system_infiltrator');
        unlockSpecialization('spec_energy_siphon');
        unlockSpecialization('spec_system_override');

        mockState.character.energy = 60;
        mockState.character.ap = 3;

        useSystemOverride();

        expect(mockState.character.ap).toBe(1); // costs 2 AP
        expect(mockState.character.energy).toBe(20); // costs 40 energy
        expect(mockState.enemyStatusEffects).toContainEqual(expect.objectContaining({ type: "stunned", duration: 1 }));
    });

    test('Nano-Biotech passives regenerate HP and protect player at low health', () => {
        mockState.character.specializationPoints = 4;
        unlockSpecialization('spec_cellular_regen');
        unlockSpecialization('spec_immunology_overclock');
        unlockSpecialization('spec_emergency_nanites');

        // Test cellular regeneration on processStatusEffects tick
        mockState.character.hp = 50;
        processStatusEffects();
        expect(mockState.character.hp).toBe(53); // restores 3 HP

        // Test Emergency Nanites cheat-death/low HP trigger
        mockState.character.hp = 15; // below 20% threshold
        mockState.emergencyNanitesTriggered = false;

        checkEmergencyNanites();

        expect(mockState.character.hp).toBe(55); // 15 + 40 emergency heal
        expect(mockState.playerStatusEffects).toContainEqual(expect.objectContaining({ type: "defenseBoost", value: 20 }));
        expect(mockState.emergencyNanitesTriggered).toBe(true);
    });

    test('Energy Siphon drains energy on basic attacks', () => {
        mockState.character.specializationPoints = 2;
        unlockSpecialization('spec_system_infiltrator');
        unlockSpecialization('spec_energy_siphon');

        mockState.character.energy = 40;
        mockState.character.ap = 3;

        playerAttack(); // costs 2 AP

        expect(mockState.character.energy).toBe(45); // restored +5 energy
    });
});
