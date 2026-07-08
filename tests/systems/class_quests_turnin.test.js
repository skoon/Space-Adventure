import {
    initQuests,
    acceptQuest,
    completeQuest,
    getRoleQuestId,
    checkQuestProgress,
    getAvailableQuests
} from '../../systems/quests.js';

import {
    initDistrictsUI,
    talkToNPC
} from '../../systems/ui/districts-ui.js';

import {
    initDialogueUI,
    showDialogue,
    hideDialogue
} from '../../systems/ui/dialogue-ui.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockShowDialog = jest.fn();

const mockState = {
    character: {
        name: 'Spacer',
        role: 'Warrior',
        level: 1,
        activeQuests: {},
        completedQuests: [],
        storyline: { alignment: 'federation' },
        xp: 0
    },
    inventory: [],
    gameState: 'exploring',
    currentLocation: 'terra_prime'
};

const mockUiDeps = {
    addLog: mockLog,
    updateUI: mockUpdateUI,
    showDialog: mockShowDialog,
    showSaveMessage: jest.fn(),
    showVictoryMessage: jest.fn()
};

const mockData = {
    quests: {
        "quest_001": {
            id: "quest_001",
            title: "First Contact",
            type: "kill",
            target: "Xenobot",
            amount: 1,
            rewards: { xp: 50 },
            giver: { id: "vance", name: "Captain Vance", location: "HQ" }
        },
        "story_01": {
            id: "story_01",
            title: "The Awakening",
            type: "kill",
            target: "Xenobot",
            amount: 1,
            rewards: { xp: 100 },
            isMainStory: true,
            hasCustomTurnIn: true
        },
        "story_01_warrior": {
            id: "story_01_warrior",
            title: "The Awakening (Warrior)",
            type: "kill",
            target: "Xenobot",
            amount: 2,
            rewards: { xp: 100 },
            isMainStory: true,
            hasCustomTurnIn: true
        },
        "story_01_rogue": {
            id: "story_01_rogue",
            title: "The Awakening (Rogue)",
            type: "collect",
            target: "Scrap Metal",
            amount: 2,
            rewards: { xp: 100 },
            isMainStory: true,
            hasCustomTurnIn: true
        },
        "loyalty_vance": {
            id: "loyalty_vance",
            title: "Vance: The Lost Patrol",
            type: "collect",
            target: "Cybernetic Core",
            amount: 1,
            rewards: { xp: 100 },
            giver: { id: "vance", name: "Captain Vance", location: "HQ" }
        }
    }
};

describe('Quest Turn-In Gating & Class Story Paths', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.role = 'Warrior';
        mockState.character.activeQuests = {};
        mockState.character.completedQuests = [];
        mockState.character.xp = 0;
        mockState.inventory = [];

        // Mock document elements for districts/dialogue UI
        document.body.innerHTML = `
            <div id="districtsModal" class="hidden"></div>
            <div id="dialogueOverlay" class="hidden">
                <div id="dialogueNpcName"></div>
                <div id="dialogueTextBody"></div>
                <div id="dialogueChoicesList"></div>
            </div>
        `;

        initQuests({
            state: mockState,
            ui: mockUiDeps,
            data: mockData
        });

        initDialogueUI({
            state: mockState,
            ui: mockUiDeps
        });

        initDistrictsUI({
            state: mockState,
            ui: mockUiDeps,
            data: mockData
        });
    });

    test('getRoleQuestId returns the class-specific variant if configured', () => {
        // Warrior Role
        expect(getRoleQuestId('story_01')).toBe('story_01_warrior');

        // Rogue Role
        mockState.character.role = 'Rogue';
        expect(getRoleQuestId('story_01')).toBe('story_01_rogue');

        // Fallback for quests with no class variants
        expect(getRoleQuestId('quest_001')).toBe('quest_001');
    });

    test('acceptQuest automatically maps to the role-specific variant', () => {
        mockState.character.role = 'Rogue';
        acceptQuest('story_01');

        expect(mockState.character.activeQuests).toHaveProperty('story_01_rogue');
        expect(mockState.character.activeQuests).not.toHaveProperty('story_01');
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('The Awakening (Rogue)'));
    });

    test('quest with a giver enters readyToTurnIn state and does not auto-complete', () => {
        acceptQuest('quest_001'); // Giver Vance
        expect(mockState.character.activeQuests['quest_001'].progress).toBe(0);

        // Progress quest to target amount
        checkQuestProgress('kill', 'Xenobot', 1);

        // Should NOT be completed, but ready to turn in
        expect(mockState.character.activeQuests['quest_001']).toBeDefined();
        expect(mockState.character.activeQuests['quest_001'].readyToTurnIn).toBe(true);
        expect(mockState.character.completedQuests).not.toContain('quest_001');
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Return to Captain Vance'));
    });

    test('generic NPC dialogue handles turning in readyToTurnIn quests', () => {
        acceptQuest('quest_001');
        checkQuestProgress('kill', 'Xenobot', 1);

        // Talk to the correct NPC (Vance)
        talkToNPC('vance');

        // Check that generic dialogue was shown with the complete action
        const speaker = document.getElementById('dialogueNpcName').textContent;
        const text = document.getElementById('dialogueTextBody').textContent;
        expect(speaker).toBe('Vance');
        expect(text).toContain("completed all objectives for 'First Contact'");

        // Trigger the Complete action from the dialogue
        const choiceButtons = document.getElementById('dialogueChoicesList').getElementsByTagName('button');
        expect(choiceButtons.length).toBe(1);
        choiceButtons[0].click(); // Simulates turn-in button click

        // Quest should now be completed
        expect(mockState.character.activeQuests['quest_001']).toBeUndefined();
        expect(mockState.character.completedQuests).toContain('quest_001');
        expect(mockState.character.xp).toBe(50);
    });

    test('wrong NPC does not trigger generic turn-in', () => {
        acceptQuest('quest_001');
        checkQuestProgress('kill', 'Xenobot', 1);

        // Talk to wrong NPC (nesta)
        talkToNPC('nesta');

        // Should not show turn-in dialogue for First Contact
        const speaker = document.getElementById('dialogueNpcName').textContent;
        expect(speaker).not.toBe('Captain Vance');
    });

    test('available quests filter out base quests when role variants exist', () => {
        mockState.character.role = 'Warrior';
        const list = getAvailableQuests();
        
        const ids = list.map(q => q.id);
        expect(ids).toContain('story_01_warrior');
        expect(ids).not.toContain('story_01');
        expect(ids).not.toContain('story_01_rogue');
    });
});
