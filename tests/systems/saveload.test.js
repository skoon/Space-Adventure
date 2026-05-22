import { initSaveLoad, saveGame, loadGame, exportGame, importGame, hasSaveGame, deleteSaveGame, autoSave, initializeSaveSystem } from '../../systems/saveload.js';

// Mock dependencies
const mockState = {
    gameState: 'exploring',
    character: null,
    inventory: [],
    enemy: null,
    log: [],
    playerStatusEffects: [],
    enemyStatusEffects: [],
    levelUpNotification: 'mock',
    victoryMessage: 'mock'
};

const mockUi = {
    addLog: jest.fn(),
    showSaveMessage: jest.fn(),
    showScreen: jest.fn(),
    updateUI: jest.fn()
};

const mockCombat = {
    updateCombatUI: jest.fn()
};

const deps = {
    state: mockState,
    ui: mockUi,
    combat: mockCombat
};

describe('Save/Load System', () => {
    let mockLocalStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup state
        mockState.gameState = 'exploring';
        mockState.character = {
            name: 'SaveHero',
            level: 3,
            xp: 20,
            hp: 100,
            maxHp: 100,
            skillPoints: 2,
            unlockedSkills: ['toughness'],
            ship: { engineLevel: 1, medbayLevel: 1, cargoLevel: 0, scannerLevel: 0 }
        };
        mockState.inventory = ['Scrap Metal', 'Energy Cell'];
        mockState.enemy = null;
        mockState.log = ['Started game'];
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];
        mockState.levelUpNotification = 'mock';
        mockState.victoryMessage = 'mock';

        // Mock window functions
        window.alert = jest.fn();
        window.confirm = jest.fn(() => true);

        // Mock localStorage
        let store = {};
        mockLocalStorage = {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, val) => { store[key] = val.toString(); }),
            removeItem: jest.fn(key => { delete store[key]; }),
            clear: jest.fn(() => { store = {}; })
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        initSaveLoad(deps);
        
        // Mock DOM elements
        const loadBtn = document.createElement('button');
        loadBtn.id = 'loadGameButton';
        document.body.appendChild(loadBtn);
    });

    afterEach(() => {
        const btn = document.getElementById('loadGameButton');
        if (btn) btn.remove();
    });

    test('saveGame successfully saves current state to localStorage', () => {
        const success = saveGame();
        
        expect(success).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'galacticOdyssey_save',
            expect.any(String)
        );

        // Verify serializable elements
        const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(savedData.character.name).toBe('SaveHero');
        expect(savedData.inventory).toContain('Scrap Metal');
        expect(mockUi.addLog).toHaveBeenCalledWith('💾 Game saved successfully!');
        expect(mockUi.showSaveMessage).toHaveBeenCalledWith('Game Saved!');
    });

    test('saveGame fails and alerts if no character exists', () => {
        mockState.character = null;
        const success = saveGame();

        expect(success).toBe(false);
        expect(window.alert).toHaveBeenCalledWith('No game to save! Please create a character first.');
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    test('loadGame successfully restores state from localStorage', () => {
        // Save first
        saveGame();
        
        // Clear runtime state
        mockState.character = null;
        mockState.inventory = [];
        mockState.gameState = 'start';

        // Load
        const success = loadGame();

        expect(success).toBe(true);
        expect(mockState.character.name).toBe('SaveHero');
        expect(mockState.inventory).toContain('Energy Cell');
        expect(mockState.gameState).toBe('exploring');
        
        // Verify UI hooks
        expect(mockUi.showScreen).toHaveBeenCalledWith('exploring');
        expect(mockUi.updateUI).toHaveBeenCalled();
        expect(mockUi.addLog).toHaveBeenCalledWith('📂 Game loaded successfully!');
        expect(mockUi.showSaveMessage).toHaveBeenCalledWith('Game Loaded!');
    });

    test('loadGame applies retroactive defaults for retro-compatibility', () => {
        // Prepare corrupted or legacy save data in localStorage
        const legacySave = {
            gameState: 'exploring',
            character: {
                name: 'LegacyHero',
                level: 5,
                // skillPoints missing!
                // ship missing!
            },
            inventory: []
        };
        mockLocalStorage.setItem('galacticOdyssey_save', JSON.stringify(legacySave));

        const success = loadGame();
        expect(success).toBe(true);
        
        // Retroactive skill points (level - 1 -> 5 - 1 = 4 points)
        expect(mockState.character.skillPoints).toBe(4);
        
        // Retroactive ship settings
        expect(mockState.character.ship).toBeDefined();
        expect(mockState.character.ship.engineLevel).toBe(1);
        expect(mockState.character.ship.medbayLevel).toBe(0);
    });

    test('hasSaveGame returns true if save exists in localStorage', () => {
        expect(hasSaveGame()).toBe(false);

        saveGame();
        expect(hasSaveGame()).toBe(true);
    });

    test('deleteSaveGame deletes save if confirmed by player', () => {
        saveGame();
        expect(hasSaveGame()).toBe(true);

        // User denies confirmation
        window.confirm.mockReturnValueOnce(false);
        deleteSaveGame();
        expect(hasSaveGame()).toBe(true); // Still there

        // User confirms
        window.confirm.mockReturnValueOnce(true);
        deleteSaveGame();
        expect(hasSaveGame()).toBe(false); // Deleted!
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('galacticOdyssey_save');
    });

    test('autoSave works only in active gameplay states', () => {
        saveGame();
        mockLocalStorage.setItem.mockClear();

        // Start screen: no auto-save
        mockState.gameState = 'start';
        autoSave();
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

        // Defeat screen: no auto-save
        mockState.gameState = 'defeat';
        autoSave();
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

        // Exploring state: triggers auto-save!
        mockState.gameState = 'exploring';
        autoSave();
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('initializeSaveSystem sets up start screen load button display', () => {
        const loadBtn = document.getElementById('loadGameButton');
        loadBtn.style.display = 'none';

        // Save exists
        saveGame();
        initializeSaveSystem();
        expect(loadBtn.style.display).toBe('block');
        expect(loadBtn.title).toContain('Last saved');
    });

    test('exportGame triggers browser JSON download file action', () => {
        // Mock Blob, URL, and DOM click interactions
        const mockBlobInstance = {};
        window.Blob = jest.fn(() => mockBlobInstance);
        
        window.URL.createObjectURL = jest.fn(() => 'blob:url');
        window.URL.revokeObjectURL = jest.fn();

        const mockAnchor = {
            href: '',
            download: '',
            click: jest.fn()
        };
        document.createElement = jest.fn(tagName => {
            if (tagName === 'a') return mockAnchor;
            return document.createElement.bind(document)(tagName);
        });
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();

        exportGame();

        expect(window.Blob).toHaveBeenCalled();
        expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlobInstance);
        expect(mockAnchor.download).toContain('galactic-odyssey-save');
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
});
