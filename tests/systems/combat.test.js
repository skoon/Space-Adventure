import { initCombat, playerAttack, playerBlock, playerDodge, useSpecialAbility, enemyTurn, winCombat, encounterEnemy, encounterBoss, checkPhaseTransition } from '../../systems/combat.js';

// Mock dependencies
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
        level: 5
    },
    enemy: {
        name: 'Goblin',
        hp: 50,
        maxHp: 50,
        attack: 8,
        defense: 2,
        xp: 20
    },
    playerStatusEffects: [],
    enemyStatusEffects: [],
    gameState: 'combat',
    inventory: [],
    currentLocation: 'terra_prime'
};

const mockCombatElements = {
    playerName: {}, playerHp: {}, playerMaxHp: {}, playerAtk: {}, playerDef: {},
    playerEnergy: {}, playerMaxEnergy: {}, playerHpBar: { style: {} }, playerEnergyBar: { style: {} },
    playerStatusEffects: { innerHTML: '', appendChild: jest.fn() }, playerAvatar: {},
    enemyName: {}, enemyHp: {}, enemyMaxHp: {}, enemyAtk: {}, enemyDef: {}, enemyHpBar: { style: {} },
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

const mockEquipment = {
    getEffectiveStats: jest.fn().mockImplementation(() => {
        return {
            attack: mockState.character.attack,
            defense: mockState.character.defense
        };
    })
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

describe('Combat System', () => {
    let globalRandom;

    beforeAll(() => {
        globalRandom = Math.random;
        Math.random = jest.fn(() => 0.5); // Consistent non-critical, non-status-effect random value
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
        mockState.character.level = 5;
        mockState.enemy = {
            name: 'Goblin',
            hp: 50,
            maxHp: 50,
            attack: 8,
            defense: 2,
            xp: 20
        };
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];
        mockState.gameState = 'combat';
        mockState.inventory = [];

        initCombat({
            state: mockState,
            data: { 
                enemies: [{ name: 'Scaled Goblin', hp: 50, attack: 10, defense: 2, locations: ['terra_prime'] }],
                bosses: [{ 
                    name: 'Test Boss', hp: 200, attack: 20, defense: 5, locations: ['terra_prime'],
                    phases: [{ threshold: 0.5, attackBuff: 10, defenseBuff: 5, msg: "Phase 2!" }],
                    specialAttacks: [{ chance: 1.0, damageMultiplier: 2.0, msg: "Special!" }]
                }]
            },
            dom: { combatElements: mockCombatElements },
            ui: mockUi,
            equipment: mockEquipment,
            character: mockCharacter,
            quests: mockQuests,
            exploration: mockExploration,
            settings: { getDifficulty: jest.fn().mockReturnValue({ enemyHpModifier: 1, enemyDmgModifier: 1 }) }
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

    test('playerAttack deals damage to enemy', () => {
        playerAttack();
        expect(mockState.enemy.hp).toBeLessThan(50);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('damage'));
    });

    test('playerAttack triggers victory when enemy dies', () => {
        mockState.enemy.hp = 1;
        playerAttack();
        expect(mockState.enemy).toBeNull();
        expect(mockUi.showVictoryMessage).toHaveBeenCalled();
        expect(mockCharacter.gainXp).toHaveBeenCalled();
    });

    test('playerBlock applies blocking status effect', () => {
        mockState.character.ap = 2; // Keep AP > 0 so enemyTurn doesn't run
        playerBlock();
        expect(mockState.playerStatusEffects).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'blocking' })]));
        expect(mockState.character.hp).toBe(100); // HP hasn't changed yet
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('ready to block'));
    });

    test('blocking reduces incoming damage during enemy turn', () => {
        mockState.playerStatusEffects = [{ type: 'blocking', duration: 1 }];
        mockState.character.hp = 100;
        // enemy atk: 8, player def: 5 => 3 dmg. Block => 1 dmg.
        enemyTurn();
        expect(mockState.character.hp).toBe(99);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('reducing damage'));
    });

    test('character uses Warrior special ability', () => {
        mockState.character.role = 'Warrior';
        mockState.character.energy = 50;
        useSpecialAbility();
        expect(mockState.character.energy).toBe(25);
        expect(mockState.enemy.hp).toBe(38);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('POWER STRIKE'));
    });

    test('character cannot use special ability without enough energy', () => {
        mockState.character.energy = 10;
        const initialHp = mockState.enemy.hp;
        useSpecialAbility();
        expect(mockState.enemy.hp).toBe(initialHp);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Not enough energy'));
    });

    test('playerAttack consumes AP and deals damage', () => {
        mockState.character.ap = 3;
        playerAttack();
        expect(mockState.character.ap).toBe(1);
        expect(mockState.enemy.hp).toBeLessThan(50);
    });

    test('encounterEnemy scales enemy stats based on player level', () => {
        mockState.character.level = 10;
        encounterEnemy();
        expect(mockState.enemy.maxHp).toBeGreaterThan(60);
        expect(mockState.enemy.attack).toBeGreaterThan(15);
        expect(mockState.character.ap).toBe(3);
    });

    test('encounterBoss initializes boss state correctly', () => {
        encounterBoss();
        expect(mockState.enemy.isBoss).toBe(true);
        expect(mockState.enemy.currentPhase).toBe(0);
        expect(mockState.enemy.maxHp).toBeGreaterThan(100);
    });

    test('checkPhaseTransition buffs boss when threshold met', () => {
        mockState.enemy = {
            isBoss: true,
            hp: 40,
            maxHp: 100,
            attack: 20,
            defense: 5,
            currentPhase: 0,
            phases: [{ threshold: 0.5, attackBuff: 10, defenseBuff: 5, msg: "Phase 2!" }]
        };
        checkPhaseTransition();
        expect(mockState.enemy.currentPhase).toBe(1);
        expect(mockState.enemy.attack).toBe(30);
        expect(mockState.enemy.defense).toBe(10);
    });

    test('winCombat grants 3x rewards for bosses', () => {
        mockState.enemy = { name: "Test Boss", attack: 10, defense: 10, isBoss: true };
        winCombat();
        expect(mockCharacter.gainXp).toHaveBeenCalledWith(150);
        expect(mockUi.showVictoryMessage).toHaveBeenCalledWith(expect.stringContaining('Epic Victory'));
    });

    test('winCombat sets bossDefeated and drops blueprint on Void Sentinel Alpha defeat in derelict', () => {
        mockState.derelict = {
            active: true,
            currentLoot: []
        };
        mockState.enemy = {
            name: "Void Sentinel Alpha",
            attack: 20,
            defense: 10,
            isBoss: true,
            drops: ["Quantum Shield Core Recipe", "Plasma Targeting HUD Recipe"]
        };
        winCombat();
        expect(mockState.derelict.bossDefeated).toBe(true);
        expect(mockState.derelict.currentLoot.length).toBe(1);
        expect(mockState.derelict.currentLoot[0]).toMatch(/Recipe$/);
        expect(mockState.inventory).not.toContain(mockState.derelict.currentLoot[0]);
    });
});
