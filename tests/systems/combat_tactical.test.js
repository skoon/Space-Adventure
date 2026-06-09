import { initCombat, playerAttack, playerBlock, playerDodge, useSpecialAbility, enemyTurn, winCombat, encounterEnemy, encounterBoss, selectStance, dealStaggerDamage, getPlayerDamageType, calculateDamageAndApplyCombos, updateCombatUI } from '../../systems/combat.js';
import { initEquipment, getEffectiveStats } from '../../systems/equipment.js';
import { initInventory, useCombatItem } from '../../systems/inventory.js';

// Mock state
const mockState = {
    character: {
        name: 'Hero',
        stats: { attack: 10, defense: 5 },
        hp: 100,
        maxHp: 100,
        energy: 50,
        maxEnergy: 50,
        role: 'Warrior',
        attack: 10,
        defense: 5,
        ap: 3,
        maxAp: 3,
        level: 5,
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        }
    },
    enemy: {
        name: 'Goblin',
        hp: 50,
        maxHp: 50,
        attack: 8,
        defense: 2,
        xp: 20,
        breakMax: 25,
        breakCurrent: 25
    },
    playerStatusEffects: [],
    enemyStatusEffects: [],
    gameState: 'combat',
    inventory: [],
    currentLocation: 'terra_prime',
    combatStance: 'Neutral',
    companionCooldown: 0,
    activeCompanion: null
};

const mockCombatElements = {
    playerName: {}, playerHp: {}, playerMaxHp: {}, playerAtk: {}, playerDef: {},
    playerEnergy: {}, playerMaxEnergy: {}, playerHpBar: { style: {} }, playerEnergyBar: { style: {} },
    playerStatusEffects: { innerHTML: '', appendChild: jest.fn() }, playerAvatar: {},
    enemyName: {}, enemyHp: {}, enemyMaxHp: {}, enemyAtk: {}, enemyDef: {}, enemyHpBar: { style: {} },
    enemyBreakCurrent: {}, enemyBreakMax: {}, enemyBreakBar: { style: {} },
    enemyStatusEffects: { innerHTML: '', appendChild: jest.fn() },
    combatLog: {}
};

const mockUi = {
    addLog: jest.fn(),
    updateCombatLog: jest.fn(),
    showScreen: jest.fn(),
    updateUI: jest.fn(),
    getStatusEffectIcon: jest.fn().mockReturnValue('ICON'),
    showVictoryMessage: jest.fn()
};

const mockCharacter = {
    getCharacterAvatar: jest.fn().mockReturnValue('AVATAR'),
    gainXp: jest.fn()
};

const mockQuests = {
    checkQuestProgress: jest.fn()
};

const mockExploration = {
    simulateExploration: jest.fn()
};

const mockItems = {
    "Frag Grenade": { type: "consumable", category: "consumable", effect: "damage", value: 30, stagger: 50, description: "Deals 30 damage.", price: 150, stackable: true },
    "EMP Grenade": { type: "consumable", category: "consumable", effect: "damage", value: 10, stagger: 80, damageType: "Plasma", applyStatus: "Electrified", description: "Deals 10 Plasma damage.", price: 200, stackable: true },
    "Plasma Rifle": { type: "weapon", category: "equipment", stats: { attack: 5 }, description: "Plasma", price: 500 },
    "Laser Blade": { type: "weapon", category: "equipment", stats: { attack: 7 }, description: "Laser", price: 750 },
    "Cryo Pistol": { type: "weapon", category: "equipment", stats: { attack: 4 }, description: "Cryo", price: 600 },
    "Acid Injector": { type: "weapon", category: "equipment", stats: { attack: 6 }, description: "Acid", price: 800 }
};

describe('Tactical Combat 2.0 Systems', () => {
    let globalRandom;

    beforeAll(() => {
        globalRandom = Math.random;
        Math.random = jest.fn(() => 0.5); // consistent 50% rolls (triggers 50% effects, non-crit)
    });

    afterAll(() => {
        Math.random = globalRandom;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockState.character.hp = 100;
        mockState.character.energy = 50;
        mockState.character.role = 'Warrior';
        mockState.character.ap = 3;
        mockState.character.equipment.weapon = null;
        mockState.combatStance = 'Neutral';
        mockState.enemy = {
            name: 'Goblin',
            hp: 50,
            maxHp: 50,
            attack: 8,
            defense: 2,
            xp: 20,
            breakMax: 25,
            breakCurrent: 25
        };
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];
        mockState.gameState = 'combat';
        mockState.inventory = [];
        mockState.companionCooldown = 0;
        mockState.activeCompanion = null;

        initCombat({
            state: mockState,
            data: { 
                enemies: [{ name: 'Goblin', hp: 50, attack: 8, defense: 2, locations: ['terra_prime'] }],
                bosses: [{ name: 'Test Boss', hp: 200, attack: 20, defense: 5, locations: ['terra_prime'] }]
            },
            dom: { combatElements: mockCombatElements },
            ui: mockUi,
            equipment: {
                getEffectiveStats: getEffectiveStats
            },
            character: mockCharacter,
            quests: mockQuests,
            exploration: mockExploration,
            settings: { getDifficulty: jest.fn().mockReturnValue({ enemyHpModifier: 1, enemyDmgModifier: 1 }) }
        });

        initEquipment({
            state: mockState,
            data: { items: mockItems },
            ui: mockUi
        });

        initInventory({
            state: mockState,
            data: { items: mockItems },
            ui: mockUi,
            combat: {
                updateCombatUI: jest.fn(),
                enemyTurn: jest.fn(),
                dealStaggerDamage: dealStaggerDamage,
                checkPhaseTransition: jest.fn(),
                winCombat: winCombat
            }
        });

        document.getElementById = jest.fn().mockReturnValue({
            disabled: false,
            className: '',
            textContent: '',
            style: {},
            classList: { add: jest.fn(), remove: jest.fn() },
            appendChild: jest.fn()
        });
        document.querySelector = jest.fn().mockReturnValue({
            disabled: false,
            className: '',
            style: {},
            classList: { add: jest.fn(), remove: jest.fn() }
        });
        document.createElement = jest.fn().mockReturnValue({ className: '', textContent: '', style: {} });
    });

    // 1. Role Stance switching and AP costs
    test('selectStance toggles role stances and consumes 1 AP', () => {
        mockState.character.role = 'Warrior';
        mockState.character.ap = 3;
        
        // Toggle Vanguard stance on
        selectStance(0);
        expect(mockState.combatStance).toBe('Vanguard');
        expect(mockState.character.ap).toBe(2);

        // Toggle Vanguard stance off
        selectStance(0);
        expect(mockState.combatStance).toBe('Neutral');
        expect(mockState.character.ap).toBe(1);

        // Switch to Berserker stance
        selectStance(1);
        expect(mockState.combatStance).toBe('Berserker');
        expect(mockState.character.ap).toBe(0);

        // Trying to switch stance with 0 AP fails
        selectStance(0);
        expect(mockState.combatStance).toBe('Berserker');
        expect(mockState.character.ap).toBe(0);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Not enough Action Points'));
    });

    // 2. Vanguard +5 DEF / Berserker -3 DEF and 2x stagger
    test('Vanguard and Berserker stances modify player stats correctly', () => {
        mockState.character.role = 'Warrior';
        mockState.character.defense = 5;

        // Neutral stance defense is base (5)
        expect(getEffectiveStats().defense).toBe(5);

        // Vanguard stance adds +5 DEF
        mockState.combatStance = 'Vanguard';
        expect(getEffectiveStats().defense).toBe(10);

        // Berserker stance subtracts -3 DEF
        mockState.combatStance = 'Berserker';
        expect(getEffectiveStats().defense).toBe(2);
    });

    test('Berserker stance doubles player attack stagger damage', () => {
        mockState.character.role = 'Warrior';
        mockState.character.ap = 3;
        mockState.combatStance = 'Berserker';

        // Basic attack in Berserker deals 20 stagger (instead of 10)
        playerAttack();
        expect(mockState.enemy.breakCurrent).toBe(5); // 25 - 20 = 5
    });

    // 3. Rogue Shadow stance guarantees crit, disables block/dodge, resets after attack
    test('Shadow stance disables block and dodge actions', () => {
        mockState.character.role = 'Rogue';
        mockState.combatStance = 'Shadow';
        mockState.character.ap = 3;

        // updateCombatUI should disable block/dodge or we check block/dodge return early
        // Wait, playerBlock() and playerDodge() should do nothing or fail if in Shadow stance
        // Let's call updateCombatUI to verify blockBtn/dodgeBtn get disabled classes
        const mockBlockBtn = { disabled: false, className: '' };
        const mockDodgeBtn = { disabled: false, className: '' };
        document.querySelector = jest.fn().mockImplementation((sel) => {
            if (sel === 'button[onclick="playerBlock()"]') return mockBlockBtn;
            if (sel === 'button[onclick="playerDodge()"]') return mockDodgeBtn;
            return { disabled: false, className: '' };
        });

        // Let's make sure we test the disabled UI property assignment
        initCombat({
            state: mockState,
            data: { enemies: [], bosses: [] },
            dom: { combatElements: mockCombatElements },
            ui: mockUi,
            equipment: { getEffectiveStats: getEffectiveStats },
            character: mockCharacter,
            quests: mockQuests,
            exploration: mockExploration,
            settings: { getDifficulty: jest.fn().mockReturnValue({ enemyHpModifier: 1, enemyDmgModifier: 1 }) }
        });
        
        updateCombatUI();
        expect(mockBlockBtn.disabled).toBe(true);
        expect(mockDodgeBtn.disabled).toBe(true);
    });

    test('Attacking in Shadow stance guarantees critical and reverts stance to Neutral', () => {
        mockState.character.role = 'Rogue';
        mockState.combatStance = 'Shadow';
        mockState.character.ap = 3;

        // Force critical roll to fail (Math.random() returns 0.5, crit is 0.25).
        // Since we are in Shadow stance, it should still be critical!
        playerAttack();
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('CRITICAL HIT'));
        expect(mockState.combatStance).toBe('Neutral');
    });

    // 4. Rogue Skirmisher 0 AP items
    test('Skirmisher stance reduces item AP cost to 0', () => {
        mockState.character.role = 'Rogue';
        mockState.combatStance = 'Skirmisher';
        mockState.character.ap = 2;
        mockState.inventory = ['Frag Grenade'];
        mockState.enemy.breakMax = 200;
        mockState.enemy.breakCurrent = 200;

        useCombatItem('Frag Grenade');
        expect(mockState.character.ap).toBe(2); // AP remains 2 instead of deducting 1
        expect(mockState.inventory.length).toBe(0);
    });

    // 5. Scientist Support Overclock starting AP bonus & companion cooldown reduction
    test('Support Overclock stance grants +1 starting AP and faster companion cooldown', () => {
        mockState.character.role = 'Scientist';
        mockState.combatStance = 'Support Overclock';
        mockState.companionCooldown = 3;

        // When enemyTurn ends and starts player turn, they get 4 AP and -2 companion cooldown
        enemyTurn();
        expect(mockState.character.ap).toBe(4);
        expect(mockState.companionCooldown).toBe(1); // 3 - 2 = 1 (1 from overclock stance, 1 standard)
    });

    // 6. Scientist Disruption stance applies random elemental status
    test('Scientist Disruption stance applies random elements on basic attack', () => {
        mockState.character.role = 'Scientist';
        mockState.combatStance = 'Disruption';
        mockState.character.ap = 2;

        playerAttack();
        expect(mockState.enemyStatusEffects.length).toBeGreaterThan(0);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringMatching(/Burning|Frozen|Electrified|Melted/));
    });

    // 7. Stagger & break posture: Broken status stunned, double damage taken
    test('Reducing enemy Break shield to 0 applies Broken status, stunning and doubling damage', () => {
        mockState.enemy.breakCurrent = 10;
        
        // Deal 10 stagger to break enemy
        dealStaggerDamage(10);
        expect(mockState.enemyStatusEffects).toContainEqual(expect.objectContaining({ type: 'broken' }));
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('posture is broken'));

        // Attacking broken enemy deals 2x damage
        const initialHp = mockState.enemy.hp; // 50
        // Base damage = 10 (Hero attack) - 2 (Goblin defense) = 8.
        // Broken multiplies it by 2 => 16.
        playerAttack();
        expect(mockState.enemy.hp).toBe(initialHp - 16);
    });

    test('Broken enemy skips their turn', () => {
        mockState.enemyStatusEffects = [{ type: 'broken', duration: 1 }];
        enemyTurn();
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('incapacitated and skips their turn'));
    });

    // 8. Elemental combos: Shatter (Frozen + Physical = 2x damage)
    test('Physical damage against Frozen enemy triggers Shatter combo', () => {
        mockState.enemyStatusEffects = [{ type: 'frozen', duration: 2 }];
        mockState.character.equipment.weapon = null; // deals physical
        mockState.character.ap = 2;

        const initialHp = mockState.enemy.hp; // 50
        // Base damage = 8. Shatter deals 2x => 16.
        playerAttack();
        expect(mockState.enemy.hp).toBe(initialHp - 16);
        expect(mockState.enemyStatusEffects).not.toContainEqual(expect.objectContaining({ type: 'frozen' }));
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('SHATTER'));
    });

    // 9. Elemental combos: Shock (Electrified + Plasma = 50% stun chance)
    test('Plasma damage against Electrified enemy triggers Shock combo stun', () => {
        mockState.enemyStatusEffects = [{ type: 'electrified', duration: 2 }];
        mockState.character.equipment.weapon = 'Plasma Rifle';
        mockState.character.ap = 3;

        // Override random mock for this test so that 50% stun triggers (0.3 < 0.5)
        const origRandom = Math.random;
        Math.random = jest.fn(() => 0.3);

        playerAttack();
        
        Math.random = origRandom;
        
        expect(mockState.enemyStatusEffects).toContainEqual(expect.objectContaining({ type: 'stunned' }));
        expect(mockState.enemyStatusEffects).not.toContainEqual(expect.objectContaining({ type: 'electrified' }));
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('SHOCK COMBO'));
    });

    // 10. Melted defense reduction
    test('Melted status reduces enemy defense by 5', () => {
        mockState.enemyStatusEffects = [{ type: 'melted', duration: 3 }];
        mockState.enemy.defense = 7;
        
        // Defense is 7. Melted reduces it by 5 => 2.
        // Base damage = 10 (Hero atk) - 2 (reduced def) = 8.
        playerAttack();
        // HP goes from 50 to 42.
        expect(mockState.enemy.hp).toBe(42);
    });

    // 11. Frozen starting AP penalty for player
    test('Frozen player starts their turn with 1 less AP', () => {
        mockState.playerStatusEffects = [{ type: 'frozen', duration: 2 }];
        enemyTurn();
        expect(mockState.character.ap).toBe(2); // 3 - 1 = 2
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('You are Frozen! Starting AP reduced by 1'));
    });

    // 12. Grenades usage
    test('Frag Grenade deals damage and high stagger', () => {
        mockState.inventory = ['Frag Grenade'];
        mockState.character.ap = 2;
        mockState.enemy.breakMax = 200;
        mockState.enemy.breakCurrent = 200;

        useCombatItem('Frag Grenade');
        expect(mockState.enemy.hp).toBe(20); // 50 - 30 = 20
        expect(mockState.enemy.breakCurrent).toBe(150); // 200 - 50 = 150
    });

    test('EMP Grenade deals Plasma damage, high stagger, and Electrifies', () => {
        mockState.inventory = ['EMP Grenade'];
        mockState.character.ap = 2;
        mockState.enemy.breakMax = 200;
        mockState.enemy.breakCurrent = 200;

        useCombatItem('EMP Grenade');
        expect(mockState.enemy.hp).toBe(40); // 50 - 10 = 40
        expect(mockState.enemy.breakCurrent).toBe(120); // 200 - 80 = 120
        expect(mockState.enemyStatusEffects).toContainEqual(expect.objectContaining({ type: 'electrified' }));
    });
});
