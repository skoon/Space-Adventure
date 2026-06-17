import { initLocations, getUnlockedLocations, travelTo } from '../../systems/locations.js';
import { initQuests, completeQuest } from '../../systems/quests.js';
import { initCompanions, recruitCompanion, getRecruitCost, canRecruitCompanion } from '../../systems/companions.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockPlayTravelAnimation = jest.fn(cb => cb());
const mockShowVictoryMessage = jest.fn();
const mockShowSaveMessage = jest.fn();
const mockShowDialog = jest.fn();
const mockGainXp = jest.fn();

const mockLocations = {
    terra_prime: {
        id: "terra_prime",
        name: "Terra Prime",
        engineLevelReq: 1,
        controllingFaction: "federation"
    },
    xylo_delta: {
        id: "xylo_delta",
        name: "Xylo Delta",
        engineLevelReq: 2,
        controllingFaction: "corsairs"
    }
};

const mockQuests = {
    quest_fed_test: {
        id: "quest_fed_test",
        title: "Test Fed Quest",
        requiredPlanet: "terra_prime",
        rewards: { xp: 50 }
    }
};

const mockState = {
    character: {
        credits: 500,
        xp: 0,
        factions: {
            federation: 0,
            corsairs: 0,
            syndicate: 0
        },
        ship: {
            engineLevel: 1
        },
        activeQuests: {
            quest_fed_test: {}
        },
        completedQuests: []
    },
    companions: {
        vance: { unlocked: false },
        apex: { unlocked: false }
    },
    currentLocation: "terra_prime",
    gameState: "exploring"
};

const mockDeps = {
    state: mockState,
    data: {
        locations: mockLocations,
        quests: mockQuests
    },
    ui: {
        addLog: mockLog,
        updateUI: mockUpdateUI,
        playTravelAnimation: mockPlayTravelAnimation,
        showVictoryMessage: mockShowVictoryMessage,
        showSaveMessage: mockShowSaveMessage,
        showDialog: mockShowDialog
    },
    character: {
        gainXp: mockGainXp
    }
};

describe('Sector Reputation & Faction Influence Zone System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.credits = 500;
        mockState.character.xp = 0;
        mockState.character.factions.federation = 0;
        mockState.character.factions.corsairs = 0;
        mockState.character.ship.engineLevel = 1;
        mockState.character.activeQuests = { quest_fed_test: {} };
        mockState.character.completedQuests = [];
        mockState.currentLocation = "terra_prime";
        
        initLocations(mockDeps);
        initQuests(mockDeps);
        initCompanions({
            state: mockState,
            ui: { addLog: mockLog, updateUI: mockUpdateUI }
        });
    });

    test('getUnlockedLocations increases engine requirements for hostile sectors (blockade)', () => {
        // Player has Engine Lvl 1. Xylo Delta normally requires Engine Lvl 2.
        // Even if they are neutral, it does not show.
        let unlocked = getUnlockedLocations();
        expect(unlocked.map(l => l.id)).not.toContain("xylo_delta");

        // Set engine level to 2
        mockState.character.ship.engineLevel = 2;
        unlocked = getUnlockedLocations();
        expect(unlocked.map(l => l.id)).toContain("xylo_delta");

        // Now set Corsair reputation to -50 (hostile)
        // With blockade, Engine requirement for Xylo Delta escalates to 3!
        mockState.character.factions.corsairs = -50;
        unlocked = getUnlockedLocations();
        expect(unlocked.map(l => l.id)).not.toContain("xylo_delta"); // blocked
    });

    test('travelTo blocks travel if player does not meet blockade engine requirements', () => {
        mockState.character.ship.engineLevel = 2;
        mockState.character.factions.corsairs = -50; // hostile

        const success = travelTo("xylo_delta");
        expect(success).toBe(false);
        expect(mockLog).toHaveBeenCalledWith(
            expect.stringContaining("Hostile faction security blockades require Engine Level 3")
        );
    });

    test('completeQuest awards +15 faction reputation based on planet controller', () => {
        completeQuest("quest_fed_test");
        expect(mockState.character.factions.federation).toBe(15);
        expect(mockLog).toHaveBeenCalledWith(
            expect.stringContaining("Reputation: Completed work for the FEDERATION")
        );
    });

    test('getRecruitCost applies 50% discount for friendly standings', () => {
        // Vance default cost is 200 credits
        expect(getRecruitCost("vance")).toBe(200);

        // Friendly standing with federation
        mockState.character.factions.federation = 40;
        expect(getRecruitCost("vance")).toBe(100);
    });

    test('canRecruitCompanion blocks recruitment for hostile standing', () => {
        expect(canRecruitCompanion("vance")).toBe(true);

        // Hostile standing with federation
        mockState.character.factions.federation = -30;
        expect(canRecruitCompanion("vance")).toBe(false);

        // Try recruitCompanion
        const success = recruitCompanion("vance");
        expect(success).toBe(false);
        expect(mockLog).toHaveBeenCalledWith(
            expect.stringContaining("refuses to join you due to your hostile reputation")
        );
    });
});
