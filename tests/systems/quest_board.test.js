import { initQuests, getJobBoardQuests, generateDynamicQuest, acceptQuest } from '../../systems/quests.js';
import { scanForSignals, initEvents } from '../../systems/events.js';

// Mock dependencies
const mockState = {
    character: {
        activeQuests: {},
        completedQuests: [],
        xp: 0,
        level: 2,
        energy: 50,
        maxEnergy: 100,
        credits: 100
    },
    inventory: [],
    currentLocation: 'terra_prime'
};

const mockQuestsData = {};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn(),
    showVictoryMessage: jest.fn(),
    showSaveMessage: jest.fn(),
    showDialog: jest.fn()
};

const mockCombat = {
    encounterEnemy: jest.fn()
};

const deps = {
    state: mockState,
    data: { 
        quests: mockQuestsData,
        locations: {
            terra_prime: { id: "terra_prime", lootTable: ["Scrap Metal", "Energy Cell"] }
        }
    },
    ui: mockUi,
    combat: mockCombat,
    quests: { getJobBoardQuests, acceptQuest, checkQuestProgress: jest.fn() },
    character: { gainXp: jest.fn() }
};

describe('Quest Board & Signal Scanning System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character = {
            activeQuests: {},
            completedQuests: [],
            xp: 0,
            level: 2,
            energy: 50,
            maxEnergy: 100,
            credits: 100
        };
        mockState.inventory = [];
        mockState.currentLocation = 'terra_prime';
        
        // Reset quests registry
        for (const k in mockQuestsData) delete mockQuestsData[k];

        initQuests(deps);
        initEvents(deps);
    });

    test('job board hides class-specific quests that do not match the player role', () => {
        // Reproduces the reported bug: a Warrior seeing the rogue/scientist main-story variants.
        const mkStory = (id) => ({
            id, title: id, description: '', type: 'kill', target: 'X', amount: 1,
            isMainStory: true, requiredPlanet: 'terra_prime'
        });
        mockQuestsData.story_01 = mkStory('story_01');
        mockQuestsData.story_01_warrior = mkStory('story_01_warrior');
        mockQuestsData.story_01_rogue = mkStory('story_01_rogue');
        mockQuestsData.story_01_scientist = mkStory('story_01_scientist');

        mockState.character.role = 'Warrior';
        const ids = getJobBoardQuests().map(q => q.id);

        expect(ids).toContain('story_01_warrior');
        expect(ids).not.toContain('story_01');            // base hidden when a matching variant exists
        expect(ids).not.toContain('story_01_rogue');
        expect(ids).not.toContain('story_01_scientist');
    });

    test('job board shows the base quest when no variant matches the role', () => {
        // A Scientist should see the scientist variant, not the base or other classes.
        const mkStory = (id) => ({
            id, title: id, description: '', type: 'kill', target: 'X', amount: 1,
            isMainStory: true, requiredPlanet: 'terra_prime'
        });
        mockQuestsData.story_01 = mkStory('story_01');
        mockQuestsData.story_01_warrior = mkStory('story_01_warrior');
        mockQuestsData.story_01_rogue = mkStory('story_01_rogue');
        mockQuestsData.story_01_scientist = mkStory('story_01_scientist');

        mockState.character.role = 'Scientist';
        const ids = getJobBoardQuests().map(q => q.id);

        expect(ids).toContain('story_01_scientist');
        expect(ids).not.toContain('story_01');
        expect(ids).not.toContain('story_01_warrior');
        expect(ids).not.toContain('story_01_rogue');
    });

    test('generateDynamicQuest generates a valid formatted quest', () => {
        const quest = generateDynamicQuest('terra_prime');
        expect(quest).toBeDefined();
        expect(quest.id).toContain('dynamic_terra_prime_');
        expect(quest.requiredPlanet).toBe('terra_prime');
        expect(quest.rewards.xp).toBeGreaterThan(0);
        expect(mockQuestsData[quest.id]).toBe(quest);
    });

    test('getJobBoardQuests fills available slots up to 3', () => {
        const board = getJobBoardQuests();
        expect(board.length).toBe(3);
        
        // Accept one quest
        acceptQuest(board[0].id);

        // Fetching again should still yield 3 quests (since we generate replacement)
        const boardAfter = getJobBoardQuests();
        expect(boardAfter.length).toBe(3);
    });

    test('scanForSignals checks energy and triggers outcome', () => {
        // Test energy check failure
        mockState.character.energy = 5;
        scanForSignals();
        expect(mockUi.addLog).toHaveBeenCalledWith('⚠️ Not enough energy to scan for signals!');
        
        // Reset energy
        mockState.character.energy = 50;
        
        // Run scan (it will trigger either distress signal, cache search, or ambush)
        scanForSignals();
        expect(mockState.character.energy).toBe(40); // 50 - 10
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Scanning local frequencies'));
    });
});
