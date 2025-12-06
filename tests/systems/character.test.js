import { initCharacter, createCharacter, gainXp, getCharacterAvatar, useHealItem } from '../../systems/character.js';

const mockState = {
    character: null,
    inventory: [],
    gameState: 'start'
};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn(),
    showScreen: jest.fn(),
    showLevelUpNotification: jest.fn(),
    hideLevelUpNotification: jest.fn()
};

const mockExploration = {
    simulateExploration: jest.fn()
};

describe('Character System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character = null;
        mockState.inventory = [];
        mockState.gameState = 'start';

        initCharacter({
            state: mockState,
            ui: mockUi,
            exploration: mockExploration
        });

        // Mock document elements
        const originalGetElementById = document.getElementById;
        document.getElementById = jest.fn((id) => {
            if (id === 'nameInput') return { value: 'TestHero' };
            if (id === 'raceSelect') return { value: 'Human' };
            if (id === 'roleSelect') return { value: 'Warrior' };
            return {};
        });
    });

    test('createCharacter initializes character with correct stats', () => {
        const event = { preventDefault: jest.fn() };
        createCharacter(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockState.character).toBeDefined();
        expect(mockState.character.name).toBe('TestHero');
        expect(mockState.character.role).toBe('Warrior');
        expect(mockState.character.hp).toBe(120); // Warrior base HP
        expect(mockState.gameState).toBe('exploring');
        expect(mockUi.showScreen).toHaveBeenCalledWith('exploring');
    });

    test('gainXp increases XP and handles level up', () => {
        // Setup initial character
        mockState.character = {
            level: 1,
            xp: 0,
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 5,
            maxEnergy: 50,
            energy: 50
        };

        // Gain 50 XP (no level up)
        gainXp(50);
        expect(mockState.character.xp).toBe(50);
        expect(mockState.character.level).toBe(1);
        expect(mockUi.showLevelUpNotification).not.toHaveBeenCalled();

        // Gain 50 XP (reach 100 -> level up)
        gainXp(50);
        expect(mockState.character.level).toBe(2);
        expect(mockState.character.xp).toBe(0); // 100 absorbed
        expect(mockState.character.maxHp).toBe(110); // +10
        expect(mockUi.showLevelUpNotification).toHaveBeenCalled();
    });

    test('getCharacterAvatar returns correct emoji', () => {
        expect(getCharacterAvatar('Human', 'Warrior')).toBe('🛡️');
        expect(getCharacterAvatar('Android', 'Scientist')).toBe('💾');
        expect(getCharacterAvatar('Invalid', 'Role')).toBe('👤'); // fallback
    });

    test('useHealItem heals and consumes item', () => {
        // Setup
        mockState.character = { hp: 50, maxHp: 100 };
        mockState.inventory = ['Energy Cell', 'Scrap'];

        useHealItem();

        expect(mockState.character.hp).toBe(80); // 50 + 30
        expect(mockState.inventory).not.toContain('Energy Cell');
        expect(mockState.inventory).toContain('Scrap');
    });

    test('useHealItem does nothing if at max HP', () => {
        mockState.character = { hp: 100, maxHp: 100 };
        mockState.inventory = ['Energy Cell'];

        useHealItem();

        expect(mockState.character.hp).toBe(100);
        expect(mockState.inventory).toContain('Energy Cell'); // Not consumed
    });
});
