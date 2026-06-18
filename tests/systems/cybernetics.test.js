import {
    initCybernetics,
    installImplant,
    uninstallImplant,
    IMPLANTS,
    getActiveSynergies
} from '../../systems/cybernetics.js';

import {
    initCombat,
    playerAttack,
    playerDodge,
    enemyTurn,
    useSpecialAbility,
    encounterEnemy,
    triggerCompanionAbility,
    useShieldWall
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

describe('Cybernetic Augmentation Synergies', () => {
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
        mockState.character.maxHp = 100;
        mockState.character.energy = 50;
        mockState.character.ap = 3;
        mockState.character.maxAp = 3;
        mockState.character.cybernetics = {
            head: null,
            arms: null,
            torso: null,
            nervous: null
        };
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];
        mockState.activeCompanion = null;
        mockState.combatStance = "Neutral";
        mockState.targetLockStacks = 0;
        
        mockState.enemy = {
            name: 'Alien Scourge',
            hp: 50,
            maxHp: 50,
            attack: 20,
            defense: 2,
            xp: 20
        };
    });

    test('getActiveSynergies returns empty array if no synergies active, and returns correct synergies when active', () => {
        expect(getActiveSynergies()).toEqual([]);

        // Target Lock: head (targeting_matrix) + arms (reflex_boosters)
        mockState.character.cybernetics.head = 'targeting_matrix';
        mockState.character.cybernetics.arms = 'reflex_boosters';
        let syns = getActiveSynergies();
        expect(syns.map(s => s.id)).toContain('target_lock');

        // Cybernetic Overcharge: head (targeting_matrix) + torso (subdermal_plating)
        mockState.character.cybernetics.torso = 'subdermal_plating';
        syns = getActiveSynergies();
        expect(syns.map(s => s.id)).toContain('cybernetic_overcharge');
    });

    test('Target Lock synergy increases crit chance in Berserker stance and resets on crit', () => {
        // Activate Target Lock
        mockState.character.cybernetics.head = 'targeting_matrix';
        mockState.character.cybernetics.arms = 'reflex_boosters';
        mockState.combatStance = "Berserker";
        mockState.targetLockStacks = 2; // +40% crit chance

        // Mock Math.random to return 0.50 (no crit if base was 15%, but with +40% = 55%, 0.50 < 0.55 triggers crit!)
        // In playerAttack, critChance = 0.15 (Warrior base) + 0.40 (stacks) = 0.55.
        // If Math.random returns 0.50, it is < 0.55, so it critical hits!
        Math.random = jest.fn().mockReturnValue(0.50);

        playerAttack();
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Target Lock critical hit achieved'));
        expect(mockState.targetLockStacks).toBe(0);

        // If not in Berserker stance, Target Lock has no effect
        mockState.combatStance = "Neutral";
        mockState.targetLockStacks = 2;
        Math.random = jest.fn().mockReturnValue(0.50); // 0.50 >= 0.15 (no crit)
        playerAttack();
        expect(mockState.targetLockStacks).toBe(2); // Stacks do not change
    });

    test('Nanite Shielding synergy applies defense boost on Lyra heal', () => {
        // Activate Nanite Shielding
        mockState.character.cybernetics.torso = 'subdermal_plating';
        mockState.character.cybernetics.nervous = 'synaptic_accelerator';
        mockState.activeCompanion = 'lyra';
        mockState.companions = {
            lyra: { level: 1 }
        };

        // Command companion (restores 25 HP)
        // AP costs 1
        triggerCompanionAbility();

        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Dr. Lyra uses Nano-Heal'));
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Nanite Shielding grants temporary defense'));
        const defBoost = mockState.playerStatusEffects.find(e => e.type === 'defenseBoost');
        expect(defBoost).toBeDefined();
        expect(defBoost.value).toBe(6);
        expect(defBoost.duration).toBe(2);
    });

    test('Cybernetic Overcharge synergy reduces active skills energy cost by 10', () => {
        // Activate Cybernetic Overcharge
        mockState.character.cybernetics.head = 'targeting_matrix';
        mockState.character.cybernetics.torso = 'subdermal_plating';
        mockState.character.energy = 10; // set low energy
        mockState.character.ap = 3;

        // Shield Wall costs 20, but with synergy it should cost 10.
        // We have 10 energy, so it should succeed.
        useShieldWall();

        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('SHIELD WALL'));
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Cybernetic Overcharge reduced Shield Wall energy cost'));
        expect(mockState.character.energy).toBe(0); // 10 - 10
    });

    test('Neural Overdrive synergy has a chance to refund 1 AP', () => {
        // Activate Neural Overdrive
        mockState.character.cybernetics.arms = 'reflex_boosters';
        mockState.character.cybernetics.nervous = 'synaptic_accelerator';
        mockState.character.energy = 50;
        mockState.character.ap = 3;

        // Mock Math.random to trigger AP refund (Math.random() < 0.20)
        // Let's mock it to return 0.10.
        Math.random = jest.fn().mockReturnValue(0.10);

        useShieldWall();

        // AP initially 3. Shield Wall costs 1 AP.
        // Without refund: 3 -> 2.
        // With refund: 2 -> 3.
        expect(mockState.character.ap).toBe(3);
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Neural Overdrive activated! Refunded 1 Action Point'));
    });
});
