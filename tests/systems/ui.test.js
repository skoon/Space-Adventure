
import { initUI, updateUI, switchOperationsTab, updateQuickCrewPanel, renderShipModules, switchShipTab } from '../../systems/ui.js';
import { initCompanions } from '../../systems/companions.js';
import { initSkills } from '../../systems/skills.js';
import { initShip } from '../../systems/ship.js';

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
            },
            settings: {
                getDifficulty: jest.fn().mockReturnValue({ id: 'normal', description: 'Normal' }),
                setDifficulty: jest.fn()
            }
        };

        initUI(mockDeps);
        initShip(mockDeps);
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

    test('switchOperationsTab toggles active classes and visibility', () => {
        // Create elements
        const tabCargo = document.createElement('button');
        tabCargo.id = 'tabCargoGear';
        const tabCrew = document.createElement('button');
        tabCrew.id = 'tabCrewSkills';
        const panelCargo = document.createElement('div');
        panelCargo.id = 'panelCargoGear';
        const panelCrew = document.createElement('div');
        panelCrew.id = 'panelCrewSkills';
        
        document.body.appendChild(tabCargo);
        document.body.appendChild(tabCrew);
        document.body.appendChild(panelCargo);
        document.body.appendChild(panelCrew);
        
        // Swapping to crew
        switchOperationsTab('crew');
        expect(panelCargo.classList.contains('hidden')).toBe(true);
        expect(panelCargo.style.display).toBe('none');
        expect(panelCrew.classList.contains('hidden')).toBe(false);
        expect(panelCrew.style.display).toBe('flex');
        expect(tabCrew.className).toContain('border-cyan-500');
        expect(tabCargo.className).toContain('border-transparent');
        
        // Swapping back to cargo
        switchOperationsTab('cargo');
        expect(panelCargo.classList.contains('hidden')).toBe(false);
        expect(panelCargo.style.display).toBe('flex');
        expect(panelCrew.classList.contains('hidden')).toBe(true);
        expect(panelCrew.style.display).toBe('none');
        expect(tabCargo.className).toContain('border-cyan-500');
        expect(tabCrew.className).toContain('border-transparent');
        
        // Cleanup
        document.body.removeChild(tabCargo);
        document.body.removeChild(tabCrew);
        document.body.removeChild(panelCargo);
        document.body.removeChild(panelCrew);
    });

    test('updateQuickCrewPanel renders active companion and skills correctly', async () => {
        // Initialize state dependencies for sub-modules
        mockDeps.ui = {
            addLog: jest.fn(),
            updateUI: jest.fn()
        };
        initCompanions(mockDeps);
        initSkills(mockDeps);

        // Create elements
        const avatarEl = document.createElement('div');
        avatarEl.id = 'quickCompanionAvatar';
        const nameEl = document.createElement('div');
        nameEl.id = 'quickCompanionName';
        const levelEl = document.createElement('div');
        levelEl.id = 'quickCompanionLevel';
        const skillEl = document.createElement('div');
        skillEl.id = 'quickCompanionSkill';
        const skillsListEl = document.createElement('div');
        skillsListEl.id = 'quickSkillsList';
        
        document.body.appendChild(avatarEl);
        document.body.appendChild(nameEl);
        document.body.appendChild(levelEl);
        document.body.appendChild(skillEl);
        document.body.appendChild(skillsListEl);
        
        // Setup mock companion and skill state
        mockState.activeCompanion = 'vance';
        mockState.companions = {
            vance: { unlocked: true, level: 2, trust: 50 }
        };
        mockState.character.unlockedSkills = ['warrior_toughness'];
        mockState.character.role = 'Warrior';
        
        await updateQuickCrewPanel();
        
        expect(avatarEl.textContent).toBe('🦾');
        expect(nameEl.textContent).toContain('Vance');
        expect(levelEl.textContent).toBe('LVL 2 (50 Trust)');
        expect(skillEl.textContent).toContain('Shield Generator');
        expect(skillsListEl.innerHTML).toContain('Toughness');
        
        // Setup mock companion to none
        mockState.activeCompanion = null;
        await updateQuickCrewPanel();
        
        expect(nameEl.textContent).toBe('No active crew deployed');
        
        // Cleanup
        document.body.removeChild(avatarEl);
        document.body.removeChild(nameEl);
        document.body.removeChild(levelEl);
        document.body.removeChild(skillEl);
        document.body.removeChild(skillsListEl);
    });

    test('renderShipModules renders ship modules and navigation card', async () => {
        // Setup ship state
        mockState.character.ship = {
            engineLevel: 1,
            medbayLevel: 0,
            cargoLevel: 0,
            scannerLevel: 0
        };

        // Create DOM elements
        const tabSystems = document.createElement('button');
        tabSystems.id = 'tabShipSystems';
        const tabCrew = document.createElement('button');
        tabCrew.id = 'tabCrewQuarter';
        const tabCybernetics = document.createElement('button');
        tabCybernetics.id = 'tabCybernetics';
        const systemsPanel = document.createElement('div');
        systemsPanel.id = 'shipSystemsPanel';
        const crewPanel = document.createElement('div');
        crewPanel.id = 'shipCrewPanel';
        const cyberneticsPanel = document.createElement('div');
        cyberneticsPanel.id = 'shipCyberneticsPanel';
        
        const container = document.createElement('div');
        container.id = 'shipModulesContainer';
        systemsPanel.appendChild(container);

        document.body.appendChild(tabSystems);
        document.body.appendChild(tabCrew);
        document.body.appendChild(tabCybernetics);
        document.body.appendChild(systemsPanel);
        document.body.appendChild(crewPanel);
        document.body.appendChild(cyberneticsPanel);

        // Run renderShipModules directly and await it
        await renderShipModules();

        // Check if modules were rendered
        expect(container.innerHTML).toContain('Engine');
        expect(container.innerHTML).toContain('Medical Bay');
        expect(container.innerHTML).toContain('Cargo Hold');
        expect(container.innerHTML).toContain('Scanner Array');
        expect(container.innerHTML).toContain('Deflector Shields');
        expect(container.innerHTML).toContain('Ship Weapon Systems');
        expect(container.innerHTML).toContain('Sector Navigation Map');

        // Cleanup
        document.body.removeChild(tabSystems);
        document.body.removeChild(tabCrew);
        document.body.removeChild(tabCybernetics);
        document.body.removeChild(systemsPanel);
        document.body.removeChild(crewPanel);
        document.body.removeChild(cyberneticsPanel);
    });
});
