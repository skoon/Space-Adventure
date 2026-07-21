import { initQuests, acceptQuest, checkQuestProgress, completeStep, completeQuest, getQuest, getAvailableQuests, applyQuestItem, checkChoiceRequirements, resolveVariantText, resolveDialogText, applyQuestFlagWrites } from '../../systems/quests.js';

// Mock dependencies
const mockState = {
    character: {
        activeQuests: {},
        completedQuests: [],
        xp: 0
    },
    inventory: []
};

const mockQuestsData = {
    quest_single: {
        id: "quest_single",
        title: "Single Step Quest",
        description: "Collect 2 Scrap Metal pieces.",
        type: "collect",
        target: "Scrap Metal",
        amount: 2,
        rewards: { xp: 30, items: ["Nano Stimpack"] }
    },
    quest_multi: {
        id: "quest_multi",
        title: "Multi Step Quest",
        description: "A long journey.",
        type: "kill",
        target: "Xenobot",
        amount: 1,
        rewards: { xp: 100, items: ["Plasma Rifle"] },
        steps: [
            {
                type: "kill",
                target: "Xenobot",
                amount: 1,
                rewards: { xp: 20 },
                dialog: { title: "Step 1 Done", text: "Nice job." }
            },
            {
                type: "collect",
                target: "Scrap Metal",
                amount: 1,
                rewards: { items: ["Energy Cell"] },
                dialog: { title: "Step 2 Done", text: "Finished." }
            }
        ]
    }
};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn(),
    showVictoryMessage: jest.fn(),
    showSaveMessage: jest.fn(),
    showDialog: jest.fn()
};

const deps = {
    state: mockState,
    data: { quests: mockQuestsData },
    ui: mockUi
};

describe('Quest System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character = {
            activeQuests: {},
            completedQuests: [],
            xp: 0
        };
        mockState.inventory = [];
        
        initQuests(deps);
    });

    test('acceptQuest adds quest to activeQuests and logs it', () => {
        acceptQuest('quest_single');

        expect(mockState.character.activeQuests['quest_single']).toBeDefined();
        expect(mockState.character.activeQuests['quest_single'].progress).toBe(0);
        expect(mockState.character.activeQuests['quest_single'].currentStep).toBe(0);
        expect(mockUi.addLog).toHaveBeenCalledWith('[!] Quest Accepted: Single Step Quest');
        expect(mockUi.showSaveMessage).toHaveBeenCalledWith('Quest Accepted: Single Step Quest');
    });

    test('acceptQuest does not accept already active or completed quests', () => {
        // Active
        mockState.character.activeQuests['quest_single'] = { progress: 0, currentStep: 0 };
        acceptQuest('quest_single');
        expect(mockUi.addLog).not.toHaveBeenCalled();

        // Completed
        mockState.character.activeQuests = {};
        mockState.character.completedQuests.push('quest_single');
        acceptQuest('quest_single');
        expect(mockUi.addLog).not.toHaveBeenCalled();
    });

    test('checkQuestProgress advances single-step quest and completes it', () => {
        acceptQuest('quest_single');
        
        // Progress 1
        checkQuestProgress('collect', 'Scrap Metal', 1);
        expect(mockState.character.activeQuests['quest_single'].progress).toBe(1);
        expect(mockState.character.completedQuests).not.toContain('quest_single');

        // Progress 2 (completes quest)
        checkQuestProgress('collect', 'Scrap Metal', 1);
        expect(mockState.character.activeQuests['quest_single']).toBeUndefined(); // deleted
        expect(mockState.character.completedQuests).toContain('quest_single');
        
        // Rewards
        expect(mockState.character.xp).toBe(30);
        expect(mockState.inventory).toContain('Nano Stimpack');
        
        expect(mockUi.showVictoryMessage).toHaveBeenCalledWith('Quest Completed: Single Step Quest');
        expect(mockUi.updateUI).toHaveBeenCalled();
    });

    test('checkQuestProgress advances steps in a multi-step quest', () => {
        acceptQuest('quest_multi');

        // Step 1: Kill 1 Xenobot
        checkQuestProgress('kill', 'Xenobot', 1);
        
        // Step 1 reward should be granted, dialog shown, and advanced to step 1 (0-indexed -> step 1 is the 2nd step)
        expect(mockState.character.xp).toBe(20); // Step 1 XP
        expect(mockUi.showDialog).toHaveBeenCalledWith('Step 1 Done', 'Nice job.');
        expect(mockState.character.activeQuests['quest_multi'].currentStep).toBe(1);
        expect(mockState.character.activeQuests['quest_multi'].progress).toBe(0);

        // Step 2: Collect 1 Scrap Metal
        checkQuestProgress('collect', 'Scrap Metal', 1);

        // Step 2 reward should be granted, dialog shown, and entire quest completed
        expect(mockState.inventory).toContain('Energy Cell'); // Step 2 Item
        expect(mockUi.showDialog).toHaveBeenCalledWith('Step 2 Done', 'Finished.');
        
        // Final quest rewards should also be granted!
        expect(mockState.character.xp).toBe(20 + 100); // 20 (step 1) + 100 (quest end)
        expect(mockState.inventory).toContain('Plasma Rifle'); // Quest end item
        expect(mockState.character.activeQuests['quest_multi']).toBeUndefined();
        expect(mockState.character.completedQuests).toContain('quest_multi');
        expect(mockUi.showVictoryMessage).toHaveBeenCalledWith('Quest Completed: Multi Step Quest');
    });

    test('getQuest and getAvailableQuests return correct queries', () => {
        expect(getQuest('quest_single')).toBe(mockQuestsData.quest_single);

        const available = getAvailableQuests();
        expect(available).toContain(mockQuestsData.quest_single);
        expect(available).toContain(mockQuestsData.quest_multi);

        acceptQuest('quest_single');
        const availableAfterAccept = getAvailableQuests();
        expect(availableAfterAccept).not.toContain(mockQuestsData.quest_single);
        expect(availableAfterAccept).toContain(mockQuestsData.quest_multi);
    });

    test('applyQuestItem progresses the quest and removes item from inventory', () => {
        acceptQuest('quest_single');
        mockState.inventory = ['Scrap Metal', 'Scrap Metal', 'Data Chip'];

        // Use Scrap Metal
        const used = applyQuestItem('Scrap Metal');
        expect(used).toBe(true);
        expect(mockState.character.activeQuests['quest_single'].progress).toBe(1);
        // Consumed one Scrap Metal
        expect(mockState.inventory.filter(i => i === 'Scrap Metal').length).toBe(1);

        // Use unmatched item
        const usedWrong = applyQuestItem('Data Chip');
        expect(usedWrong).toBe(false);
        expect(mockState.character.activeQuests['quest_single'].progress).toBe(1);
        expect(mockState.inventory).toContain('Data Chip'); // Not consumed
    });
});

describe('checkChoiceRequirements — flags', () => {
    beforeEach(() => {
        initQuests(deps);
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.npcs = {};
    });

    test('truthy shorthand: flag string', () => {
        expect(checkChoiceRequirements({ flag: 'spared_queen' })).toBe(false);
        mockState.character.storyline.variables.spared_queen = true;
        expect(checkChoiceRequirements({ flag: 'spared_queen' })).toBe(true);
    });

    test('equality when value present, op omitted', () => {
        mockState.character.storyline.variables.alliance = 'fed';
        expect(checkChoiceRequirements({ flag: { name: 'alliance', value: 'fed' } })).toBe(true);
        expect(checkChoiceRequirements({ flag: { name: 'alliance', value: 'cor' } })).toBe(false);
    });

    test('numeric operators', () => {
        mockState.character.storyline.variables.civ = 3;
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '>=', value: 3 } })).toBe(true);
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '>', value: 3 } })).toBe(false);
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '<=', value: 3 } })).toBe(true);
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '!=', value: 4 } })).toBe(true);
    });

    test('missing flag never throws, reads falsy', () => {
        expect(checkChoiceRequirements({ flag: { name: 'nope', op: '>=', value: 1 } })).toBe(false);
    });

    test('unknown op fails closed and warns', () => {
        mockState.character.storyline.variables.civ = 3;
        mockUi.addLog.mockClear();
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '<>', value: 3 } })).toBe(false);
        expect(mockUi.addLog).toHaveBeenCalled();
    });

    test('memoryFlag reads any NPC memoryFlags', () => {
        expect(checkChoiceRequirements({ memoryFlag: 'vance_betrayed' })).toBe(false);
        mockState.character.npcs.vance = { disposition: 0, memoryFlags: ['vance_betrayed'] };
        expect(checkChoiceRequirements({ memoryFlag: 'vance_betrayed' })).toBe(true);
    });
});

describe('resolveVariantText', () => {
    beforeEach(() => {
        initQuests(deps);
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.npcs = {};
    });

    test('first matching variant wins', () => {
        mockState.character.storyline.variables.killed_queen = true;
        const variants = [
            { showIf: { flag: 'spared_queen' }, text: 'bows' },
            { showIf: { flag: 'killed_queen' }, text: 'seethes' }
        ];
        expect(resolveVariantText(variants, 'silent')).toBe('seethes');
    });

    test('falls back when none match', () => {
        const variants = [{ showIf: { flag: 'spared_queen' }, text: 'bows' }];
        expect(resolveVariantText(variants, 'silent')).toBe('silent');
    });

    test('undefined / empty variants return fallback', () => {
        expect(resolveVariantText(undefined, 'silent')).toBe('silent');
        expect(resolveVariantText([], 'silent')).toBe('silent');
    });

    test('resolveDialogText wraps variants + text', () => {
        mockState.character.storyline.variables.spared_queen = true;
        const dialog = { variants: [{ showIf: { flag: 'spared_queen' }, text: 'bows' }], text: 'silent' };
        expect(resolveDialogText(dialog)).toBe('bows');
        expect(resolveDialogText({ text: 'plain' })).toBe('plain');
    });
});

describe('flag writes', () => {
    beforeEach(() => {
        initQuests(deps);
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.npcs = {};
    });

    test('setFlags assigns literals', () => {
        applyQuestFlagWrites({ setFlags: { spared_queen: true, alliance: 'fed' } });
        expect(mockState.character.storyline.variables.spared_queen).toBe(true);
        expect(mockState.character.storyline.variables.alliance).toBe('fed');
    });

    test('incFlags adds, initializing unset to 0', () => {
        applyQuestFlagWrites({ incFlags: { civ: 1 } });
        expect(mockState.character.storyline.variables.civ).toBe(1);
        applyQuestFlagWrites({ incFlags: { civ: 2 } });
        expect(mockState.character.storyline.variables.civ).toBe(3);
    });

    test('incFlags on non-numeric resets to 0 and warns', () => {
        mockState.character.storyline.variables.civ = 'oops';
        mockUi.addLog.mockClear();
        applyQuestFlagWrites({ incFlags: { civ: 1 } });
        expect(mockState.character.storyline.variables.civ).toBe(1);
        expect(mockUi.addLog).toHaveBeenCalled();
    });
});
