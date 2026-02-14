
import { initUI, updateUI } from '../../systems/ui.js';

describe('UI System', () => {
    let mockState;
    let mockData;
    let mockDeps;
    let domElements;

    beforeEach(() => {
        // Mock State
        mockState = {
            character: {
                name: 'TestHero',
                level: 1,
                hp: 100,
                maxHp: 100,
                energy: 50,
                maxEnergy: 50,
                xp: 0,
                credits: 100,
                race: 'Human',
                role: 'Warrior',
                equipment: { weapon: null, armor: null, accessory: null },
                pendingOrders: []
            },
            inventory: ['Energy Cell'],
            log: [],
            currentLocation: 'terra_prime'
        };

        // Mock Data
        mockData = {
            items: {
                'Energy Cell': { category: 'consumable', description: 'Heals 30 HP' }
            },
            quests: {},
            locations: {
                'terra_prime': { theme: 'theme-terra' }
            }
        };

        // Mock DOM Elements
        domElements = {
            characterName: document.createElement('div'),
            characterLevel: document.createElement('div'),
            characterHp: document.createElement('div'),
            characterMaxHp: document.createElement('div'),
            characterEnergy: document.createElement('div'),
            characterMaxEnergy: document.createElement('div'),
            characterCredits: document.createElement('div'),
            characterAtk: document.createElement('div'),
            characterDef: document.createElement('div'),
            characterXp: document.createElement('div'),
            characterXpToNext: document.createElement('div'),
            characterAvatar: document.createElement('div'),
            characterRaceRole: document.createElement('div'),
        };
        
        // Inventory Container
        const inventoryElement = document.createElement('div');
        const missionLogElement = document.createElement('div');

        // Mock Dependencies
        mockDeps = {
            state: mockState,
            data: mockData,
            dom: {
                screens: {},
                elements: domElements,
                inventoryElement: inventoryElement,
                missionLogElement: missionLogElement,
                combatElements: {}
            },
            equipment: {
                getEffectiveStats: jest.fn().mockReturnValue({ attack: 10, defense: 5 })
            },
            character: {
                getCharacterAvatar: jest.fn().mockReturnValue('👤')
            },
            shop: {
                getItemPrice: jest.fn(),
                getItemSellPrice: jest.fn(),
                buyItem: jest.fn(),
                sellItem: jest.fn(),
                orderItem: jest.fn()
            }
        };

        initUI(mockDeps);
    });

    test('updateUI updates elements on first run', () => {
        updateUI();

        expect(domElements.characterName.textContent).toBe('TestHero');
        expect(domElements.characterHp.textContent).toBe('100');
        expect(mockDeps.dom.inventoryElement.innerHTML).toContain('Energy Cell');
    });

    test('updateUI does not update DOM if state implies no change (caching)', () => {
        // First run to populate cache
        updateUI();

        // Spy on textContent setter by observing mutations or wrapping the element?
        // Easier: Manually change the DOM content to something else.
        // If updateUI runs and writes to it, it will change back to 'TestHero'.
        // If updateUI uses cache, it will see state.name == cache.name ('TestHero') and SKIP the write.
        
        domElements.characterName.textContent = 'DirtyValue';
        
        // Run updateUI again with same state
        updateUI();
        
        // Should STILL be 'DirtyValue' because cache said "no change needed"
        expect(domElements.characterName.textContent).toBe('DirtyValue');
    });

    test('updateUI updates DOM if state changes', () => {
        updateUI();
        
        // Change State
        mockState.character.name = 'NewName';
        
        updateUI();
        
        expect(domElements.characterName.textContent).toBe('NewName');
    });

    test('inventory updates when item added', () => {
        updateUI();
        const initialHTML = mockDeps.dom.inventoryElement.innerHTML;
        
        // Add item
        mockState.inventory.push('Energy Cell'); // Now 2 items
        
        updateUI();
        
        expect(mockDeps.dom.inventoryElement.innerHTML).not.toBe(initialHTML);
        // Should have search count 2 or similar
        // Our implementation adds buttons.
    });
});
