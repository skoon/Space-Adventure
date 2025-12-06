import { initInventory, useCombatItem, openCombatItemMenu } from '../../systems/inventory.js';

const mockState = {
    inventory: ['Energy Cell', 'Scrap', 'Alien Crystal'],
    gameState: 'combat',
    character: { hp: 50, maxHp: 100 }
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
        mockState.inventory = ['Energy Cell', 'Scrap', 'Alien Crystal'];
        mockState.character.hp = 50;

        initInventory({
            state: mockState,
            ui: mockUi,
            combat: mockCombat,
            data: {
                items: {
                    "Energy Cell": { type: "consumable", effect: "heal", value: 30 },
                    "Scrap": { type: "material" }
                }
            },
            dom: { inventoryElement: document.createElement('div'), combatElements: { combatLog: document.createElement('div') } }
        });
    });

    test('useCombatItem heals character and consumes item', () => {
        useCombatItem('Energy Cell');

        expect(mockState.character.hp).toBe(80);
        expect(mockState.inventory).not.toContain('Energy Cell');
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('healed'));
        // used item in combat -> enemy turn
        expect(mockCombat.enemyTurn).toHaveBeenCalled();
    });

    test('useCombatItem does nothing for non-consumables', () => {
        useCombatItem('Scrap');

        expect(mockState.character.hp).toBe(50);
        expect(mockState.inventory).toContain('Scrap');
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('cannot use'));
        expect(mockCombat.enemyTurn).not.toHaveBeenCalled();
    });
});
