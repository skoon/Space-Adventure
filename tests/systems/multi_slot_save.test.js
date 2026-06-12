import { 
    initSaveLoad, 
    saveGame, 
    loadGame, 
    hasSaveGame, 
    deleteSaveGame, 
    autoSave, 
    getSlotInfo,
    exitToMainMenu
} from '../../systems/saveload.js';

const mockState = {
    gameState: 'exploring',
    character: null,
    inventory: [],
    enemy: null,
    log: [],
    playerStatusEffects: [],
    enemyStatusEffects: [],
    levelUpNotification: 'mock',
    victoryMessage: 'mock',
    activeSaveSlot: null,
    currentLocation: "terra_prime"
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

describe('Multi-Slot Save & Exit System', () => {
    let mockLocalStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockState.gameState = 'exploring';
        mockState.character = {
            name: 'OdysseyHero',
            level: 4,
            role: 'Warrior',
            xp: 50,
            hp: 120,
            maxHp: 120,
            skillPoints: 1,
            unlockedSkills: [],
            ship: { engineLevel: 1, medbayLevel: 0, cargoLevel: 0, scannerLevel: 0 }
        };
        mockState.inventory = ['Scrap Metal'];
        mockState.enemy = null;
        mockState.log = [];
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];
        mockState.levelUpNotification = 'mock';
        mockState.victoryMessage = 'mock';
        mockState.activeSaveSlot = null;
        mockState.currentLocation = "terra_prime";

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

        const missionLog = document.createElement('div');
        missionLog.id = 'missionLog';
        document.body.appendChild(missionLog);

        const nameInput = document.createElement('input');
        nameInput.id = 'nameInput';
        document.body.appendChild(nameInput);

        const exitBtn = document.createElement('button');
        exitBtn.id = 'exitHeaderBtn';
        document.body.appendChild(exitBtn);
    });

    afterEach(() => {
        ['loadGameButton', 'missionLog', 'nameInput', 'exitHeaderBtn'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    });

    test('getSlotInfo on an empty slot returns exists false', () => {
        const info = getSlotInfo(2);
        expect(info.exists).toBe(false);
    });

    test('saveGame saves to correct slots and getSlotInfo parses metadata correctly', () => {
        // Save to Slot 2
        const success = saveGame(2);
        expect(success).toBe(true);
        expect(mockState.activeSaveSlot).toBe(2);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('galacticOdyssey_save_slot_2', expect.any(String));

        // Get metadata for Slot 2
        const info = getSlotInfo(2);
        expect(info.exists).toBe(true);
        expect(info.name).toBe('OdysseyHero');
        expect(info.level).toBe(4);
        expect(info.role).toBe('Warrior');
        expect(info.locationName).toBe('Terra Prime');
        expect(info.timestamp).toBeDefined();

        // Get metadata for empty Slot 1
        expect(getSlotInfo(1).exists).toBe(false);
    });

    test('loadGame retrieves correct data from slot and sets active slot', () => {
        // Save to Slot 3
        mockState.character.name = 'Slot3Hero';
        saveGame(3);

        // Clear in-memory character
        mockState.character = null;

        // Load from Slot 3
        const success = loadGame(3);
        expect(success).toBe(true);
        expect(mockState.character.name).toBe('Slot3Hero');
        expect(mockState.activeSaveSlot).toBe(3);
    });

    test('autoSave automatically writes back to active slot', () => {
        // Load Slot 2
        mockLocalStorage.setItem('galacticOdyssey_save_slot_2', JSON.stringify({
            version: "1.0",
            timestamp: new Date().toISOString(),
            gameState: "exploring",
            character: { name: "ActiveSlotHero", level: 2 },
            inventory: []
        }));
        
        loadGame(2);
        expect(mockState.activeSaveSlot).toBe(2);

        // Perform autoSave
        autoSave();
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('galacticOdyssey_save_slot_2', expect.any(String));
    });

    test('exitToMainMenu cleans up state and navigates to start screen', () => {
        exitToMainMenu();

        expect(mockState.character).toBeNull();
        expect(mockState.enemy).toBeNull();
        expect(mockState.inventory).toHaveLength(0);
        expect(mockState.gameState).toBe('start');
        expect(mockUi.showScreen).toHaveBeenCalledWith('start');
        expect(mockUi.updateUI).toHaveBeenCalled();
        expect(document.getElementById('exitHeaderBtn').style.display).toBe('none');
    });
});
