import { initQuests, acceptQuest, getJobBoardQuests } from '../../systems/quests.js';
import { initCombat, encounterEnemy } from '../../systems/combat.js';

describe('Quest Gating & Combat Scaling Safeguards', () => {
    let mockState;
    let mockUi;
    let mockQuestsData;
    let mockLocations;
    let mockEnemies;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            character: {
                level: 1,
                activeQuests: {},
                completedQuests: [],
                factions: { federation: 0, corsairs: 0, syndicate: 0 }
            },
            inventory: [],
            currentLocation: "terra_prime"
        };

        mockUi = {
            addLog: jest.fn(),
            updateUI: jest.fn(),
            showSaveMessage: jest.fn(),
            showVictoryMessage: jest.fn(),
            showScreen: jest.fn()
        };

        mockQuestsData = {
            "story_01": {
                id: "story_01",
                title: "The Awakening",
                isMainStory: true,
                requiredPlanet: "terra_prime"
            },
            "quest_branch_01": {
                id: "quest_branch_01",
                title: "The Diplomatic Crisis",
                isMainStory: true,
                requiredPlanet: "terra_prime"
            },
            "story_act2_fed": {
                id: "story_act2_fed",
                title: "Act II Fed Patrol",
                isMainStory: true,
                requiredPlanet: "terra_prime"
            },
            "story_act3": {
                id: "story_act3",
                title: "Act III Summit",
                isMainStory: true,
                requiredPlanet: "nebula_outpost"
            },
            "side_quest_01": {
                id: "side_quest_01",
                title: "Local Salvage",
                isMainStory: false,
                requiredPlanet: "terra_prime"
            }
        };

        mockLocations = {
            "terra_prime": {
                id: "terra_prime",
                name: "Terra Prime",
                controllingFaction: "federation",
                hazardLevel: 1,
                districts: []
            },
            "xylo_delta": {
                id: "xylo_delta",
                name: "Xylo Delta",
                controllingFaction: "corsairs",
                hazardLevel: 2,
                districts: []
            },
            "crio_prime": {
                id: "crio_prime",
                name: "Crio-Prime",
                controllingFaction: "federation",
                hazardLevel: 4,
                districts: []
            }
        };

        mockEnemies = [
            { name: "Xenobot", hp: 65, attack: 12, defense: 4, locations: ["terra_prime", "crio_prime"] }
        ];

        // Initialize Quest system
        initQuests({
            state: mockState,
            data: { quests: mockQuestsData },
            ui: mockUi
        });

        // Initialize Combat system
        initCombat({
            state: mockState,
            data: { enemies: mockEnemies, bosses: [], locations: mockLocations },
            dom: { combatElements: {} },
            ui: mockUi,
            equipment: { getEffectiveStats: () => ({}) },
            character: { getCharacterAvatar: () => "🤖", gainXp: jest.fn() },
            quests: { checkQuestProgress: jest.fn() },
            exploration: { simulateExploration: jest.fn() }
        });
    });

    test('Quest Gating: Blocks out-of-order storyline quests', () => {
        // Try to accept quest_branch_01 before story_01 is completed
        acceptQuest("quest_branch_01");
        expect(mockState.character.activeQuests["quest_branch_01"]).toBeUndefined();
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining("Must complete preceding main story quest"));

        // Complete story_01
        mockState.character.completedQuests.push("story_01");
        
        // Should now be able to accept
        acceptQuest("quest_branch_01");
        expect(mockState.character.activeQuests["quest_branch_01"]).toBeDefined();
    });

    test('getJobBoardQuests filters out chained main storyline quests', () => {
        const board = getJobBoardQuests();
        const ids = board.map(q => q.id);

        // story_01 can appear, side_quest_01 can appear
        // but quest_branch_01, story_act2_fed, story_act3 are excluded!
        expect(ids).toContain("story_01");
        expect(ids).toContain("side_quest_01");
        expect(ids).not.toContain("quest_branch_01");
        expect(ids).not.toContain("story_act2_fed");
        expect(ids).not.toContain("story_act3");
    });

    test('Combat Scaling: Scales regular enemies based on level and location hazard', () => {
        // Level 1 on Terra Prime (Hazard 1)
        mockState.character.level = 1;
        mockState.currentLocation = "terra_prime";
        encounterEnemy();

        // scale = 1.0 (level 1) * 1.0 (hazard 1) = 1.0
        // Variance factor is between 0.8 and 1.2
        const enemy1 = mockState.enemy;
        expect(enemy1.attack).toBe(12);
        expect(enemy1.defense).toBe(4);
        expect(enemy1.hp).toBeGreaterThanOrEqual(52);
        expect(enemy1.hp).toBeLessThanOrEqual(78);

        // Level 5 on Crio-Prime (Hazard 4)
        mockState.character.level = 5;
        mockState.currentLocation = "crio_prime";
        encounterEnemy();

        // levelScale = 1 + (4 * 0.28) = 2.12
        // hazardScale = 1 + (3 * 0.18) = 1.54
        // combinedScale = 2.12 * 1.54 = 3.2648
        // HP = 65 * combinedScale * randomness (approx 65 * 3.2648 = 212 HP)
        // Attack = 12 * combinedScale = 12 * 3.2648 = 39
        // Defense = 4 * combinedScale = 4 * 3.2648 = 13
        const enemy5 = mockState.enemy;
        expect(enemy5.attack).toBe(39);
        expect(enemy5.defense).toBe(13);
        expect(enemy5.hp).toBeGreaterThanOrEqual(169); // 212 * 0.8 = 169
        expect(enemy5.hp).toBeLessThanOrEqual(255);    // 212 * 1.2 = 254.4
    });
});
