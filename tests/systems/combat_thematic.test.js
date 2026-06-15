import { initCombat, playerAttack, playerBlock, playerDodge, useSpecialAbility, enemyTurn, winCombat, getActiveEnvironment, calculateDamageAndApplyCombos } from '../../systems/combat.js';
import { initEquipment } from '../../systems/equipment.js';
import { initInventory } from '../../systems/inventory.js';

// Mock state
const mockState = {
    character: {
        name: 'Hero',
        stats: { attack: 10, defense: 5 },
        hp: 100,
        maxHp: 100,
        energy: 50,
        maxEnergy: 100,
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
    activeCompanion: null,
    derelict: {
        active: false,
        oxygen: 10,
        maxOxygen: 10
    }
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
    "Plasma Rifle": { type: "weapon", category: "equipment", stats: { attack: 5 }, description: "Plasma", price: 500 },
    "Laser Blade": { type: "weapon", category: "equipment", stats: { attack: 7 }, description: "Laser", price: 750 },
    "Cryo Pistol": { type: "weapon", category: "equipment", stats: { attack: 4 }, description: "Cryo", price: 600 },
    "Acid Injector": { type: "weapon", category: "equipment", stats: { attack: 6 }, description: "Acid", price: 800 }
};

const mockLocationsData = {
    "terra_prime": { id: "terra_prime", name: "Terra Prime", environment: null },
    "crio_prime": { id: "crio_prime", name: "Crio-Prime", environment: "High Gravity" },
    "inferno_ix": { id: "inferno_ix", name: "Inferno-IX", environment: "Solar Radiation" }
};

// Mock dependencies of derelict failRun
jest.mock('../../systems/derelict.js', () => ({
    failRun: jest.fn()
}));

describe('Thematic Combat & Environmental Hazards', () => {
    let globalRandom;
    let mockElementBanner;
    let mockElementText;

    beforeAll(() => {
        globalRandom = Math.random;
        Math.random = jest.fn(() => 0.5); // Fixed random output by default

        mockElementBanner = { classList: { remove: jest.fn(), add: jest.fn() }, className: '' };
        mockElementText = { textContent: '' };

        // Mock browser DOM API methods
        document.getElementById = jest.fn((id) => {
            if (id === 'combatEnvironmentBanner') return mockElementBanner;
            if (id === 'combatEnvironmentText') return mockElementText;
            if (id === 'combatPlayerAp') return { textContent: '' };
            if (id === 'combatPlayerMaxAp') return { textContent: '' };
            if (id === 'combatApBar') return { style: {} };
            if (id === 'specialAbilityButton') return { disabled: false, textContent: '', className: '' };
            if (id === 'combatCompanionBtn') return { disabled: false, textContent: '', className: '' };
            if (id === 'combatPlayerStance') return { textContent: '', className: '' };
            return null;
        });

        document.querySelector = jest.fn((sel) => {
            return { disabled: false, textContent: '', className: '', innerHTML: '' };
        });
    });

    afterAll(() => {
        Math.random = globalRandom;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockState.character.hp = 100;
        mockState.character.maxHp = 100;
        mockState.character.energy = 50;
        mockState.character.maxEnergy = 100;
        mockState.character.role = 'Warrior';
        mockState.character.ap = 3;
        mockState.character.maxAp = 3;
        mockState.character.equipment.weapon = null;
        mockState.character.cybernetics = null;
        mockState.combatStance = 'Neutral';
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];
        mockState.gameState = 'combat';
        mockState.inventory = [];
        mockState.companionCooldown = 0;
        mockState.activeCompanion = null;
        mockState.currentLocation = 'terra_prime';
        mockState.derelict = {
            active: false,
            oxygen: 10,
            maxOxygen: 10
        };

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

        initCombat({
            state: mockState,
            data: { 
                enemies: [{ name: 'Goblin', hp: 50, attack: 8, defense: 2, locations: ['terra_prime'] }],
                bosses: [],
                locations: mockLocationsData
            },
            dom: { combatElements: mockCombatElements },
            ui: mockUi,
            equipment: {
                getEffectiveStats: () => ({ attack: 10, defense: 5 })
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
                dealStaggerDamage: jest.fn(),
                checkPhaseTransition: jest.fn(),
                winCombat: jest.fn()
            }
        });
    });

    test('getActiveEnvironment returns null for normal planet, High Gravity for Crio-Prime, Vacuum for derelicts', () => {
        expect(getActiveEnvironment()).toBe(null);

        mockState.currentLocation = 'crio_prime';
        expect(getActiveEnvironment()).toBe('High Gravity');

        mockState.currentLocation = 'inferno_ix';
        expect(getActiveEnvironment()).toBe('Solar Radiation');

        mockState.derelict.active = true;
        expect(getActiveEnvironment()).toBe('Vacuum');
    });

    test('High Gravity increases Attack and Dodge AP costs', () => {
        mockState.currentLocation = 'crio_prime'; // High Gravity environment
        
        // Attack should cost 3 AP instead of 2.
        mockState.character.ap = 2;
        playerAttack();
        expect(mockState.character.ap).toBe(2); // Blocked, not enough AP
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Not enough Action Points'));

        // Start with 4 AP under High Gravity, playerAttack costs 3 AP, leaving 1 AP
        mockState.character.ap = 4;
        playerAttack();
        expect(mockState.character.ap).toBe(1); // Spent 3 AP

        // Dodge should cost 2 AP instead of 1.
        mockState.character.ap = 1;
        playerDodge();
        expect(mockState.character.ap).toBe(1); // Blocked, not enough AP

        // Start with 3 AP under High Gravity, playerDodge costs 2 AP, leaving 1 AP
        mockState.character.ap = 3;
        playerDodge();
        expect(mockState.character.ap).toBe(1); // Spent 2 AP
    });

    test('Solar Radiation drains 5 Energy at player turn end', () => {
        mockState.currentLocation = 'inferno_ix'; // Solar Radiation
        mockState.character.energy = 50;

        enemyTurn();
        // Drained 5 Energy (50 -> 45), then regenerated 5 at turn end (45 -> 50).
        expect(mockState.character.energy).toBe(50);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Solar Radiation: Drained 5 Energy'));
    });

    test('Vacuum environment drains 1 Oxygen per turn, and player suffocates when out of Oxygen', () => {
        mockState.derelict.active = true;
        mockState.derelict.oxygen = 2;
        mockState.enemy.attack = 0; // Prevent enemy dealing damage
        mockState.character.hp = 100;
        mockState.character.maxHp = 100;

        enemyTurn();
        expect(mockState.derelict.oxygen).toBe(1);
        expect(mockState.character.hp).toBe(99); // Has oxygen, but takes 1 min damage from enemy attack

        enemyTurn();
        expect(mockState.derelict.oxygen).toBe(0);
        expect(mockState.character.hp).toBe(88); // 10% max HP damage (10) + 1 min damage from enemy attack (99 -> 88)
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Out of Oxygen! Suffocating'));
    });

    test('Magma Elemental explodes on death, dealing 15 damage and applying Burn', () => {
        mockState.enemy.name = 'Magma Elemental';
        mockState.character.hp = 100;

        winCombat();
        expect(mockState.character.hp).toBe(85); // 15 damage
        expect(mockState.playerStatusEffects).toContainEqual(expect.objectContaining({ type: 'burn', damage: 8, duration: 2 }));
    });

    test('Magma Elemental explosion damage is halved if player is blocking', () => {
        mockState.enemy.name = 'Magma Elemental';
        mockState.character.hp = 100;
        mockState.playerStatusEffects.push({ type: 'blocking', duration: 1 });

        winCombat();
        expect(mockState.character.hp).toBe(93); // Halved (15 * 0.5 = 7.5, floor/ceil yields 7 damage)
    });

    test('Ashen Hulk resists Thermal/Plasma and is weak to Cryo', () => {
        mockState.enemy.name = 'Ashen Hulk';

        // Base damage is 10
        // Thermal attack -> 50% damage reduction -> 5
        let resThermal = calculateDamageAndApplyCombos(10, 'Thermal');
        expect(resThermal).toBe(5);

        // Plasma attack -> 50% damage reduction -> 5
        let resPlasma = calculateDamageAndApplyCombos(10, 'Plasma');
        expect(resPlasma).toBe(5);

        // Cryo attack -> +50% weakness -> 15
        let resCryo = calculateDamageAndApplyCombos(10, 'Cryo');
        expect(resCryo).toBe(15);
    });

    test('Frost parasite drains 1 AP on hit', () => {
        mockState.enemy.name = 'Frost parasite';
        mockState.character.hp = 100;
        mockState.enemy.attack = 0; // Prevent enemy dealing damage

        enemyTurn();
        // apDrained reduces starting AP from 3 to 2, then expires
        expect(mockState.character.ap).toBe(2);
    });

    test('Cryo Drake can critical strike and freeze the player', () => {
        mockState.enemy.name = 'Cryo Drake';
        mockState.enemy.attack = 10;
        mockState.character.hp = 100;

        Math.random = jest.fn()
            .mockReturnValueOnce(0.10) // Solar/vacuum (skip)
            .mockReturnValueOnce(0.10) // boss check/special (skip)
            .mockReturnValueOnce(0.10) // Cryo Drake 20% critical strike check triggers! (0.10 < 0.20)
            .mockReturnValueOnce(0.99) // status effect apply (skip)
            .mockReturnValueOnce(0.99); // status effect roll type (skip)

        enemyTurn();
        // The frozen effect duration was 2, decremented by 1 at turn end, so it is 1.
        expect(mockState.playerStatusEffects).toContainEqual(expect.objectContaining({ type: 'frozen', duration: 1 }));
    });

    test('Eldritch Shade has 90% physical attack evasion', () => {
        mockState.enemy.name = 'Eldritch Shade';
        mockState.character.equipment.weapon = null; // Physical type

        // Mock random to trigger evasion (< 0.90)
        Math.random = jest.fn().mockReturnValue(0.50);

        playerAttack();
        expect(mockState.enemy.hp).toBe(50); // Evasion triggered, no damage dealt!
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('phases out'));
    });

    test('Security Sentinel hacks player shield capacitors', () => {
        mockState.enemy.name = 'Security Sentinel';
        mockState.enemy.attack = 0; // Prevent enemy dealing damage
        mockState.character.energy = 50;
        mockState.playerStatusEffects.push({ type: 'defenseBoost', value: 15, duration: 2 });

        enemyTurn();
        // Drained 10 Energy (50 -> 40), then regenerated 5 at turn end (40 -> 45)
        expect(mockState.character.energy).toBe(45);
        const boost = mockState.playerStatusEffects.find(e => e.type === 'defenseBoost');
        expect(boost.value).toBe(5); // Drained 10 shield value (15 -> 5)
    });
});
