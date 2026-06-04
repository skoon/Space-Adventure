import {
    initCybernetics,
    installImplant,
    uninstallImplant,
    IMPLANTS
} from '../../systems/cybernetics.js';

import {
    initCombat,
    playerAttack,
    playerDodge,
    enemyTurn,
    useSpecialAbility,
    encounterEnemy
} from '../../systems/combat.js';

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
        cybernetics: null
    },
    inventory: [
        'Quantum Chip', 'Circuit Board', 'Circuit Board',
        'Robotic Arm', 'Robotic Arm', 'Circuit Board', 'Circuit Board',
        'Titanium Ingot', 'Titanium Ingot', 'Nanites', 'Nanites', 'Nanites', 'Nanites',
        'Bio-Gel', 'Bio-Gel', 'Bio-Gel', 'Carbon Nanotubes', 'Carbon Nanotubes'
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

describe('Cybernetics System Core Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset mockState
        mockState.character.credits = 500;
        mockState.character.hp = 100;
        mockState.character.energy = 50;
        mockState.character.cybernetics = null;
        mockState.inventory = [
            'Quantum Chip', 'Circuit Board', 'Circuit Board',
            'Robotic Arm', 'Robotic Arm', 'Circuit Board', 'Circuit Board',
            'Titanium Ingot', 'Titanium Ingot', 'Nanites', 'Nanites', 'Nanites', 'Nanites',
            'Bio-Gel', 'Bio-Gel', 'Bio-Gel', 'Carbon Nanotubes', 'Carbon Nanotubes'
        ];
        mockState.gameState = 'exploring';
        mockState.enemy = null;
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];

        initCybernetics({
            state: mockState,
            ui: mockUiDeps
        });
    });

    test('initCybernetics initializes slots', () => {
        expect(mockState.character.cybernetics).toEqual({
            head: null,
            arms: null,
            torso: null,
            nervous: null
        });
    });

    test('installImplant successfully installs targeting_matrix', () => {
        const res = installImplant('targeting_matrix');
        expect(res.success).toBe(true);
        expect(mockState.character.cybernetics.head).toBe('targeting_matrix');
        expect(mockState.character.credits).toBe(250); // 500 - 250
        // Inventory checks
        expect(mockState.inventory.filter(x => x === 'Quantum Chip').length).toBe(0);
        expect(mockState.inventory.filter(x => x === 'Circuit Board').length).toBe(2); // 4 initial - 2 used
    });

    test('installImplant fails with insufficient credits', () => {
        mockState.character.credits = 100;
        const res = installImplant('targeting_matrix');
        expect(res.success).toBe(false);
        expect(res.message).toContain('Insufficient credits');
        expect(mockState.character.cybernetics.head).toBeNull();
    });

    test('installImplant fails with insufficient materials', () => {
        mockState.inventory = []; // empty inventory
        const res = installImplant('targeting_matrix');
        expect(res.success).toBe(false);
        expect(res.message).toContain('Missing material');
        expect(mockState.character.cybernetics.head).toBeNull();
    });

    test('installImplant prevents double installation of same implant', () => {
        installImplant('targeting_matrix');
        const res = installImplant('targeting_matrix');
        expect(res.success).toBe(false);
        expect(res.message).toContain('already installed');
    });

    test('uninstallImplant successfully removes implant for a fee', () => {
        installImplant('targeting_matrix'); // costs 250 CR, leaves 250 CR
        expect(mockState.character.cybernetics.head).toBe('targeting_matrix');

        const res = uninstallImplant('head');
        expect(res.success).toBe(true);
        expect(mockState.character.cybernetics.head).toBeNull();
        expect(mockState.character.credits).toBe(200); // 250 - 50 CR surgical fee
    });

    test('uninstallImplant fails if slot is vacant', () => {
        const res = uninstallImplant('head');
        expect(res.success).toBe(false);
        expect(res.message).toContain('already empty');
    });

    test('uninstallImplant fails if character cannot afford extraction fee', () => {
        installImplant('targeting_matrix');
        mockState.character.credits = 10; // set low credits
        const res = uninstallImplant('head');
        expect(res.success).toBe(false);
        expect(res.message).toContain('Insufficient credits for surgery fee');
    });
});

describe('Cybernetics Combat Behavior Hooks', () => {
    let globalRandom;

    beforeAll(() => {
        globalRandom = Math.random;
    });

    afterAll(() => {
        Math.random = globalRandom;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockState.character.credits = 1000;
        mockState.character.hp = 100;
        mockState.character.energy = 50;
        mockState.character.ap = 3;
        mockState.character.cybernetics = {
            head: null,
            arms: null,
            torso: null,
            nervous: null
        };
        mockState.inventory = [];
        mockState.enemy = {
            name: 'Alien Scourge',
            hp: 50,
            maxHp: 50,
            attack: 20,
            defense: 2,
            xp: 20
        };
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];

        initCybernetics({
            state: mockState,
            ui: mockUiDeps
        });

        initCombat({
            state: mockState,
            data: {
                enemies: [{ name: 'Alien Scourge', hp: 50, attack: 20, defense: 2, locations: ['terra_prime'] }],
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

        document.getElementById = jest.fn().mockReturnValue({
            disabled: false,
            className: '',
            textContent: '',
            style: {},
            classList: { add: jest.fn(), remove: jest.fn() }
        });
        document.querySelector = jest.fn().mockReturnValue({
            disabled: false,
            className: '',
            style: {},
            classList: { add: jest.fn(), remove: jest.fn() }
        });
        document.createElement = jest.fn().mockReturnValue({ className: '', textContent: '', style: {} });
    });

    test('Reflex Boosters (Arms) has 35% chance to start combat with +1 AP', () => {
        mockState.character.cybernetics.arms = 'reflex_boosters';
        
        // Mock random to succeed (roll < 0.35)
        Math.random = jest.fn().mockReturnValue(0.2);
        
        encounterEnemy();
        expect(mockState.character.ap).toBe(4);
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Reflex Boosters activated'));

        // Mock random to fail (roll >= 0.35)
        Math.random = jest.fn().mockReturnValue(0.5);
        encounterEnemy();
        expect(mockState.character.ap).toBe(3);
    });

    test('Targeting Matrix (Head) increases critical attack multiplier by +0.5x', () => {
        mockState.character.cybernetics.head = 'targeting_matrix';
        
        // Mock random so critical hits (crit chance is 15%, we return 0.05 so it crits)
        // Note: the base crit calculation is: Math.random() < critChance (0.15 + passiveCrit)
        Math.random = jest.fn().mockImplementation((() => {
            let count = 0;
            return () => {
                count++;
                if (count === 1) return 0.05; // isCritical = true
                return 0.5; // default fallback
            };
        })());

        // Player attack
        // stats.attack = 10, enemy.defense = 2. baseDamage = 10 - 2 = 8.
        // critical: standard is 2x multiplier, targeting matrix adds 0.5x, so 2.5x
        // damage = 8 * 2.5 = 20
        playerAttack();
        expect(mockState.enemy.hp).toBe(30); // 50 - 20
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('CRITICAL HIT'));
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('20 damage'));
    });

    test('Sub-dermal Plating (Torso) converts 15% physical damage to energy drain', () => {
        mockState.character.cybernetics.torso = 'subdermal_plating';
        mockState.character.energy = 50;

        // Enemy attack
        // enemy.attack = 20, player.defense = 5, base damage = 15.
        // 15% of 15 is Math.floor(15 * 0.15) = 2.
        // Net damage to HP: 15 - 2 = 13.
        // Energy drained: 2.
        enemyTurn();
        expect(mockState.character.hp).toBe(87); // 100 - 13
        expect(mockState.character.energy).toBe(48 + 5); // 50 - 2 + 5 (5 is standard turn energy gain)
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Sub-dermal Plating converted 2 damage'));
    });

    test('Synaptic Accelerator (Nervous) increases Dodge Action success chance by +15%', () => {
        mockState.character.cybernetics.nervous = 'synaptic_accelerator';

        playerDodge();
        const dodgingEffect = mockState.playerStatusEffects.find(e => e.type === 'dodging');
        expect(dodgingEffect).toBeDefined();
        expect(dodgingEffect.chance).toBeCloseTo(0.45); // 0.3 base + 0.15 modifier
    });
});
