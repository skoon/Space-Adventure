import {
    initCybernetics,
    installImplant,
    uninstallImplant,
    installModChip,
    uninstallModChip,
    getSystemInstability,
    getModStatsBonus,
    IMPLANTS,
    MODS
} from '../../systems/cybernetics.js';

import {
    initCombat,
    playerAttack,
    enemyTurn,
    encounterEnemy,
    processStatusEffects
} from '../../systems/combat.js';

import { initSkills, getPassiveBonus } from '../../systems/skills.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockUpdateCombatLog = jest.fn();
const mockUpdateCombatUI = jest.fn();

const mockState = {
    character: {
        name: 'Cybersoldier',
        credits: 500,
        level: 1,
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
        skillPoints: 0
    },
    inventory: [
        'Quantum Chip', 'Circuit Board', 'Circuit Board',
        'Crit Mod Chip', 'Shield Mod Chip', 'HP Mod Chip', 'Energy Mod Chip', 'Dodge Mod Chip',
        'Crit Mod Chip', 'Crit Mod Chip', 'Crit Mod Chip'
    ],
    enemy: null,
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
    showDialog: jest.fn()
};

describe('Advanced Cybernetic Modding & Instability', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockState.character.credits = 500;
        mockState.character.hp = 100;
        mockState.character.maxHp = 100;
        mockState.character.energy = 50;
        mockState.character.maxEnergy = 100;
        mockState.character.cybernetics = null;
        mockState.character.cyberneticsMods = null;
        mockState.character.unlockedSkills = [];
        mockState.character.unlockedSpecializations = [];
        mockState.character.ap = 3;
        mockState.character.maxAp = 3;
        mockState.inventory = [
            'Quantum Chip', 'Circuit Board', 'Circuit Board', 'Circuit Board', 'Circuit Board',
            'Robotic Arm', 'Robotic Arm',
            'Crit Mod Chip', 'Shield Mod Chip', 'HP Mod Chip', 'Energy Mod Chip', 'Dodge Mod Chip',
            'Crit Mod Chip', 'Crit Mod Chip', 'Crit Mod Chip'
        ];
        mockState.gameState = 'exploring';
        mockState.enemy = null;
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];

        initCybernetics({
            state: mockState,
            ui: mockUiDeps
        });

        initSkills({
            state: mockState,
            ui: mockUiDeps
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

    test('cannot slot chip without an implant equipped', () => {
        const res = installModChip('head', 0, 'Crit Mod Chip');
        expect(res.success).toBe(false);
        expect(res.message).toContain('No implant installed');
    });

    test('slotting and extracting mod chips adjusts stats dynamically', () => {
        // First install base head implant
        const installRes = installImplant('targeting_matrix');
        expect(installRes.success).toBe(true);

        // Slot HP Mod Chip
        const slotRes = installModChip('head', 0, 'HP Mod Chip');
        expect(slotRes.success).toBe(true);
        expect(mockState.character.maxHp).toBe(110);
        expect(mockState.character.hp).toBe(110);

        // Slot Energy Mod Chip
        const slotRes2 = installModChip('head', 1, 'Energy Mod Chip');
        expect(slotRes2.success).toBe(true);
        expect(mockState.character.maxEnergy).toBe(115);
        expect(mockState.character.energy).toBe(65);

        // Instability sum should be 10
        expect(getSystemInstability()).toBe(10);

        // Extract HP Mod Chip
        const extractRes = uninstallModChip('head', 0);
        expect(extractRes.success).toBe(true);
        expect(mockState.character.maxHp).toBe(100);
        expect(mockState.character.hp).toBe(100);
        expect(mockState.character.credits).toBe(240); // 500 - 250 (implant) - 10 (extraction fee)
    });

    test('exceeding safe instability limit triggers Turn-Start feedback glitches', () => {
        // Install targeting matrix in head
        installImplant('targeting_matrix'); // cost 250 CR

        // Install reflex boosters in arms
        mockState.character.credits = 1000;
        installImplant('reflex_boosters');

        // Slot 4 chips to reach 20 Instability (Safe Limit is 15)
        installModChip('head', 0, 'Crit Mod Chip');
        installModChip('head', 1, 'Crit Mod Chip');
        installModChip('arms', 0, 'Crit Mod Chip');
        installModChip('arms', 1, 'Crit Mod Chip');

        expect(getSystemInstability()).toBe(20);

        // Glitch chance is (20 - 15) * 5% = 25%
        // Let's force Math.random to return 0.1 to guarantee a glitch trigger
        const originalRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.1);

        // Start player turn by processing status effects
        processStatusEffects();

        // AP should be reduced by 1, feedback damage dealt
        expect(mockState.character.ap).toBe(2);
        expect(mockState.character.hp).toBe(90); // 100 - 10 feedback damage
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Cybernetic Glitch detected"));

        // Restore random
        Math.random = originalRandom;
    });
});
