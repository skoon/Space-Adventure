import { initInventory, useCombatItem, openCombatItemMenu } from '../../systems/inventory.js';

const mockState = {
    inventory: ['Energy Cell', 'Scrap', 'Alien Crystal'],
    gameState: 'combat',
    character: { hp: 50, maxHp: 100 },
    enemy: { name: "Test Enemy", hp: 50, maxHp: 50 }
};

const mockUi = {
    addLog: jest.fn(),
    updateCombatLog: jest.fn(),
    updateUI: jest.fn()
};

const mockCombat = {
    updateCombatUI: jest.fn(),
    enemyTurn: jest.fn()
};

describe('Inventory System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockState.inventory = ['Energy Cell', 'Scrap', 'Alien Crystal'];
        mockState.character = { hp: 50, maxHp: 100, energy: 50, maxEnergy: 100 };
        mockState.enemy = { name: "Test Enemy", hp: 50, maxHp: 50 };

        initInventory({
            state: mockState,
            ui: mockUi,
            combat: mockCombat,
            data: {
                items: {
                    "Energy Cell": { type: "consumable", effect: "heal", value: 30 },
                    "Scrap": { type: "material" },
                    "Alien Crystal": { type: "material" }
                }
            },
            dom: { inventoryElement: document.createElement('div'), combatElements: { combatLog: document.createElement('div') } }
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('useCombatItem heals character and consumes item', () => {
        useCombatItem('Energy Cell');

        expect(mockState.character.hp).toBe(80);
        expect(mockState.inventory).not.toContain('Energy Cell');
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('recovered'));

        // Advance timers to trigger the setTimeout callback
        jest.runAllTimers();
        expect(mockCombat.enemyTurn).toHaveBeenCalled();
    });

    test('useCombatItem does nothing for non-consumables', () => {
        useCombatItem('Scrap');

        expect(mockState.character.hp).toBe(50);
        expect(mockState.inventory).toContain('Scrap');
        expect(mockUi.addLog).not.toHaveBeenCalled();
        jest.runAllTimers();
        expect(mockCombat.enemyTurn).not.toHaveBeenCalled();
    });
});
