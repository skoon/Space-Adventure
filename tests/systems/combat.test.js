import { initCombat, playerAttack, playerBlock, playerDodge, useSpecialAbility, enemyTurn, winCombat } from '../../systems/combat.js';

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
        defense: 5
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
        // Return base stats for simplicity unless overridden
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
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset state deep copy logic (simplified reset)
        mockState.character.hp = 100;
        mockState.character.energy = 50;
        mockState.character.role = 'Warrior';
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

        // Re-inject dependencies
        initCombat({
            state: mockState,
            data: { enemies: [] },
            dom: { combatElements: mockCombatElements },
            ui: mockUi,
            equipment: mockEquipment,
            character: mockCharacter,
            quests: mockQuests,
            exploration: mockExploration
        });

        // Mock global document.getElementById (used for specialAbilityButton)
        document.getElementById = jest.fn().mockReturnValue({
            disabled: false,
            className: '',
            textContent: ''
        });
        document.createElement = jest.fn().mockReturnValue({ className: '', textContent: '' });
    });

    test('playerAttack deals damage to enemy', () => {
        // Given
        // calculate expected damage: (10 - 2) = 8.

        // When
        playerAttack();

        // Then
        // Enemy HP should decrease
        expect(mockState.enemy.hp).toBeLessThan(50);
        // Should log result
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('damage'));
    });

    test('playerAttack triggers victory when enemy dies', () => {
        // Given
        mockState.enemy.hp = 1; // 1 HP left

        // When
        playerAttack();

        // Then
        expect(mockState.enemy).toBeNull(); // Enemy cleared on victory
        expect(mockUi.showVictoryMessage).toHaveBeenCalled();
        expect(mockCharacter.gainXp).toHaveBeenCalled();
    });

    test('playerBlock reduces incoming damage', () => {
        // Given
        // normal damage: 8 (enemy atk) - 5 (player def) = 3

        // When
        playerBlock();

        // Then
        // Blocking flag should be set
        expect(mockState.playerStatusEffects).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'blocking' })]));

        // Enemy turn happens immediately in block logic?
        // Let's check the code: yes, playerBlock calls enemyTurn().
        // Enemy damage: ceil(3 * 0.5) = 1 (using floor in code: Math.floor(3 * 0.5) = 1)
        // or code: Math.floor(damage * 0.5)

        expect(mockState.character.hp).toBe(99); // 100 - 1
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('blocked'));
    });

    test('character uses Warrior special ability', () => {
        // Given
        mockState.character.role = 'Warrior';
        mockState.character.energy = 50;

        // When
        useSpecialAbility();

        // Then
        // Energy reduced by 30 => 20
        expect(mockState.character.energy).toBe(20);
        // Damage deal logic: (10 - 2) * 1.5 = 12
        expect(mockState.enemy.hp).toBe(38); // 50 - 12
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('POWER STRIKE'));
    });

    test('character cannot use special ability without enough energy', () => {
        // Given
        mockState.character.energy = 10;
        const initialHp = mockState.enemy.hp;

        // When
        useSpecialAbility();

        // Then
        expect(mockState.enemy.hp).toBe(initialHp); // No damage
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Not enough energy'));
    });
});
