const { initCombat, encounterEnemy } = require('../systems/combat.js');
const { initEvents, handleEvent } = require('../systems/events.js');
const { initSettings, setDifficulty, getDifficulty } = require('../systems/settings.js');

// Mock dependencies
const mockState = {
    character: { hp: 100, maxHp: 100, defense: 0, level: 1 },
    currentLocation: 'terra_prime',
    log: []
};
const mockData = {
    enemies: [{ name: "Test Enemy", hp: 100, attack: 10, locations: ["terra_prime"] }],
    locations: { terra_prime: { theme: 'theme-terra' } }
};
const mockUi = {
    addLog: jest.fn(),
    updateCombatLog: jest.fn(),
    showScreen: jest.fn(),
    updateUI: jest.fn(),
    getStatusEffectIcon: jest.fn(),
    showVictoryMessage: jest.fn(),
    showDialog: jest.fn()
};

const deps = {
    state: mockState,
    data: mockData,
    ui: mockUi,
    dom: { combatElements: { playerName: { textContent: '' } } }, // Mock DOM elements
    equipment: { getEffectiveStats: () => ({ attack: 0, defense: 0 }) },
    character: { getCharacterAvatar: () => '', gainXp: jest.fn() },
    quests: { checkQuestProgress: jest.fn() },
    exploration: { simulateExploration: jest.fn() },
    settings: { getDifficulty, setDifficulty },
    combat: { encounterEnemy }
};

describe('Difficulty Settings', () => {
    beforeAll(() => {
        initSettings();
        initCombat(deps);
        initEvents(deps);
    });

    beforeEach(() => {
        mockState.character.hp = 100;
        mockUi.addLog.mockClear();
        mockUi.updateUI.mockClear();
    });

    test('Easy Mode scales enemy stats down', () => {
        setDifficulty('easy');
        const diff = getDifficulty();
        expect(diff.id).toBe('easy');
        expect(diff.enemyHpModifier).toBe(0.7);

        // Run multiple times to average out randomness
        let totalHp = 0;
        const runs = 100;
        for (let i = 0; i < runs; i++) {
            encounterEnemy();
            totalHp += mockState.enemy.hp;
        }
        const avgHp = totalHp / runs;
        
        // Base HP 100 * 0.7 (diff) * ~1.0 (randomness center 0.8-1.2) -> ~70
        // Randomness is 0.8 + rand*0.4 -> avg 1.0.
        // So expected avg is 100 * 1.0 * 0.7 = 70.
        expect(avgHp).toBeGreaterThan(60);
        expect(avgHp).toBeLessThan(80);
    });

    test('Hard Mode scales enemy stats up', () => {
        setDifficulty('hard');
        const diff = getDifficulty();
        expect(diff.id).toBe('hard');
        expect(diff.enemyHpModifier).toBe(1.3);

        let totalHp = 0;
        const runs = 100;
        for (let i = 0; i < runs; i++) {
            encounterEnemy();
            totalHp += mockState.enemy.hp;
        }
        const avgHp = totalHp / runs;
        
        // Base HP 100 * 1.0 * 1.3 = 130.
        expect(avgHp).toBeGreaterThan(120);
        expect(avgHp).toBeLessThan(140);
    });

    test('Hazard Damage scales with difficulty', () => {
        const hazardEvent = { type: 'hazard', text: 'Ouch', damage: 20 };
        
        // Easy
        setDifficulty('easy');
        handleEvent(hazardEvent);
        // Damage 20 * 0.5 = 10.
        expect(mockState.character.hp).toBe(90);

        // Reset
        mockState.character.hp = 100;
        
        // Hard
        setDifficulty('hard');
        handleEvent(hazardEvent);
        // Damage 20 * 1.5 = 30.
        expect(mockState.character.hp).toBe(70);
    });
});
