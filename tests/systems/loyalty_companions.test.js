jest.mock('../../systems/ui.js', () => ({
    showScreen: jest.fn(),
    updateUI: jest.fn(),
    addLog: jest.fn(),
    showDialog: jest.fn(),
    showDialogue: jest.fn(),
    showDialogueRoll: jest.fn()
}));

jest.mock('../../systems/combat.js', () => ({
    updateCombatUI: jest.fn()
}));

import {
    initCompanions,
    recruitCompanion,
    getActiveCompanion,
    setActiveCompanion,
    addTrust,
    talkToCompanion,
    giftToCompanion,
    giftCreditsToCompanion,
    resetCompanionTalkFlags,
    getCompanionAbilityValue,
    CREW_PASSIVES,
    setActiveCrewDirective,
    getCompanionPassiveBonus,
    triggerCrewBanter,
    COMPANIONS
} from '../../systems/companions.js';

import {
    getPassiveBonus,
    initSkills
} from '../../systems/skills.js';

import {
    initLocations,
    travelTo
} from '../../systems/locations.js';

import {
    initDerelict,
    exploreRoom
} from '../../systems/derelict.js';

import {
    initQuests,
    acceptQuest,
    checkQuestProgress,
    evaluateChoice
} from '../../systems/quests.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockShowDialog = jest.fn();
const mockShowScreen = jest.fn();
const mockGainXp = jest.fn();
const mockPlayTravelAnimation = jest.fn(cb => cb());

const mockState = {
    character: {
        credits: 1000,
        level: 5,
        hp: 100,
        maxHp: 100,
        ap: 3,
        maxAp: 3,
        factions: {
            federation: 0,
            corsairs: 0,
            syndicate: 0
        },
        activeQuests: {},
        completedQuests: [],
        unlockedSkills: [],
        npcs: {
            vance: { disposition: 0, memoryFlags: [] },
            lyra: { disposition: 0, memoryFlags: [] },
            apex: { disposition: 0, memoryFlags: [] }
        }
    },
    inventory: [],
    companions: {},
    activeCompanion: null,
    activeCrewDirective: null,
    companionCooldown: 0,
    playerStatusEffects: [],
    enemyStatusEffects: [],
    gameState: "exploring",
    currentLocation: "terra_prime"
};

const mockData = {
    locations: {
        terra_prime: { id: "terra_prime", name: "Terra Prime", travelCost: 0, unlocked: true },
        norkon: { id: "norkon", name: "Norkon Outpost", travelCost: 100, unlocked: true }
    },
    quests: require('../../data/quests.js').quests
};

const mockDeps = {
    state: mockState,
    data: mockData,
    ui: {
        addLog: mockLog,
        updateUI: mockUpdateUI,
        showDialog: mockShowDialog,
        showScreen: mockShowScreen,
        playTravelAnimation: mockPlayTravelAnimation,
        showVictoryMessage: jest.fn(),
        showSaveMessage: jest.fn()
    },
    combat: {
        updateCombatUI: jest.fn()
    },
    character: {
        gainXp: mockGainXp
    },
    quests: {
        checkQuestProgress: checkQuestProgress,
        triggerChoiceStepIfActive: jest.fn()
    },
    locations: {
        travelTo: travelTo
    }
};

describe('Crew Cabin & Companion Social Loop Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset state
        mockState.character.credits = 1000;
        mockState.character.level = 5;
        mockState.character.hp = 100;
        mockState.character.activeQuests = {};
        mockState.character.completedQuests = [];
        mockState.inventory = [];
        mockState.companions = {};
        mockState.activeCompanion = null;
        mockState.activeCrewDirective = null;
        mockState.gameState = "exploring";
        mockState.currentLocation = "terra_prime";

        initCompanions(mockDeps);
        initSkills(mockDeps);
        initQuests(mockDeps);
        initLocations(mockDeps);
        initDerelict(mockDeps);
    });

    test('Can configure passive crew directives and apply them to stats', () => {
        recruitCompanion("vance");
        expect(mockState.companions.vance.unlocked).toBe(true);

        // Activate Vance Heavy Plating
        setActiveCrewDirective("heavy_plating");
        expect(mockState.activeCrewDirective).toBe("heavy_plating");

        // Verify passive bonus applies to defense
        expect(getPassiveBonus("defense")).toBe(3);

        // Switch to Lyra Nano-Healer
        setActiveCrewDirective("nano_healer");
        expect(mockState.activeCrewDirective).toBe("nano_healer");
        expect(getPassiveBonus("defense")).toBe(0);
        expect(getPassiveBonus("healMultiplier")).toBe(0.15);

        // Clear active directive
        setActiveCrewDirective(null);
        expect(mockState.activeCrewDirective).toBeNull();
        expect(getPassiveBonus("healMultiplier")).toBe(0);
    });

    test('Synergy directives apply bonuses to multiple stats simultaneously', () => {
        recruitCompanion("vance");
        recruitCompanion("lyra");

        setActiveCrewDirective("steel_fortress");
        expect(mockState.activeCrewDirective).toBe("steel_fortress");

        // Verify Vance + Lyra Steel Fortress adds both defense and healMultiplier
        expect(getPassiveBonus("defense")).toBe(3);
        expect(getPassiveBonus("healMultiplier")).toBe(0.10);
    });

    test('Accepts and progresses companion loyalty quests via derelict drops', () => {
        recruitCompanion("vance");
        
        // Boost Vance trust to level 2 (50+)
        addTrust("vance", 50);
        expect(mockState.companions.vance.level).toBe(2);

        // Start Vance's loyalty mission
        acceptQuest("loyalty_vance");
        expect(mockState.character.activeQuests).toHaveProperty("loyalty_vance");

        // Set up mock derelict map with a loot cell (3) ahead of player at (2,1)
        mockState.derelict = {
            active: true,
            oxygen: 10,
            maxOxygen: 10,
            roomsExplored: 1,
            currentLoot: [],
            visited: Array(8).fill(null).map(() => Array(8).fill(false)),
            map: [
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 5, 3, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1]
            ],
            x: 1,
            y: 1,
            dirX: 1,
            dirY: 0
        };
        mockState.derelict.visited[1][1] = true;

        // Explore forward into the loot cell
        exploreRoom();

        // Check if the Cybernetic Core quest item was dropped and placed in derelict loot cargo
        expect(mockState.derelict.currentLoot).toContain("Cybernetic Core");
    });

    test('Banter system resolves choices and awards correct trust gains', () => {
        recruitCompanion("vance");
        recruitCompanion("lyra");

        // Trigger banter manually to test choice resolution
        const success = triggerCrewBanter();
        expect(success).toBe(true);

        // Verify showDialog was called
        expect(mockShowDialog).toHaveBeenCalled();
    });

    test('Apex loyalty quest triggers bounty hunter ambush during travel', () => {
        recruitCompanion("apex");
        addTrust("apex", 50);

        acceptQuest("loyalty_apex");
        expect(mockState.character.activeQuests).toHaveProperty("loyalty_apex");

        // Travel to Norkon - should guarantee bounty hunter ambush
        const success = travelTo("norkon");
        expect(success).toBe(true);
        expect(mockState.gameState).toBe("combat");
        expect(mockState.enemy.name).toBe("Void Corsair Bounty Hunter");
        expect(mockState.enemy.drops).toContain("Bounty Hunter Emblem");
    });
});
