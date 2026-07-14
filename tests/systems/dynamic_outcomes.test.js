import { initQuests, completeQuest, evaluateChoice } from '../../systems/quests.js';
import { initShop, getLocalShopFaction, getItemPrice, getItemSellPrice } from '../../systems/shop.js';
import { initDistrictsUI, renderDistricts } from '../../systems/ui/districts-ui.js';

// Setup mock DOM elements for districts rendering
document.body.innerHTML = `
    <div id="districtsModal" class="hidden">
        <h2 id="districtsModalTitle"></h2>
        <div id="districtsModalSubtitle"></div>
        <div id="districtsContainer"></div>
    </div>
`;

describe('Dynamic Galactic Outcomes & Branching Endings (Option 3)', () => {
    let mockState;
    let mockUi;
    let mockQuestsData;
    let mockLocations;
    let mockItems;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            character: {
                credits: 100,
                activeQuests: {
                    "story_act2_fed": { progress: 0, currentStep: 0 },
                    "story_act3": { progress: 0, currentStep: 0 }
                },
                completedQuests: [],
                factions: { federation: 50, corsairs: -20, syndicate: 10 },
                storyline: { act: 2, alignment: "neutral" }
            },
            inventory: [],
            worldFlags: {},
            currentLocation: "terra_prime"
        };

        mockUi = {
            addLog: jest.fn(),
            updateUI: jest.fn(),
            showVictoryMessage: jest.fn(),
            showSaveMessage: jest.fn(),
            showDialog: jest.fn(),
            showEpilogueCrawl: jest.fn()
        };

        mockQuestsData = {
            "story_act2_fed": {
                id: "story_act2_fed",
                title: "Fed Patrol",
                isMainStory: true,
                steps: []
            },
            "story_act2_cor": {
                id: "story_act2_cor",
                title: "Smuggler Run",
                isMainStory: true,
                steps: []
            },
            "story_act2_syn": {
                id: "story_act2_syn",
                title: "Syndicate core",
                isMainStory: true,
                steps: []
            },
            "story_act3": {
                id: "story_act3",
                title: "Act III Peace Summit",
                steps: [
                    {
                        type: "choice",
                        choices: [
                            { text: "Option A", reputation: { federation: 30 }, nextStepIndex: 1 },
                            { text: "Option B", reputation: { corsairs: 30 }, nextStepIndex: 2 },
                            { text: "Option C", reputation: { syndicate: 30 }, nextStepIndex: 3 },
                            { text: "Option D", reputation: { federation: 20 }, nextStepIndex: 4 }
                        ]
                    }
                ]
            }
        };

        mockLocations = {
            "terra_prime": {
                id: "terra_prime",
                name: "Terra Prime",
                controllingFaction: "federation",
                districts: [
                    { id: "terra_prime_fed_hq", name: "HQ", npc: "vance", icon: "🏢", description: "Vance base" }
                ]
            },
            "xylo_delta": {
                id: "xylo_delta",
                name: "Xylo Delta",
                controllingFaction: "corsairs",
                districts: [
                    { id: "xylo_delta_smugglers_den", name: "Den", npc: "nesta", icon: "☠️", description: "Nesta base" }
                ]
            }
        };

        mockItems = {
            "Blaster": { price: 100 }
        };

        // Initialize systems with shared mockState
        initQuests({
            state: mockState,
            data: { quests: mockQuestsData, enemies: [], bosses: [] },
            ui: mockUi
        });

        initShop({
            state: mockState,
            data: { items: mockItems, locations: mockLocations },
            ui: mockUi
        });

        initDistrictsUI({
            state: mockState,
            data: { locations: mockLocations },
            ui: mockUi
        });
    });

    test('Quest completion sets correct worldFlags factionSway', () => {
        mockState.character.activeQuests["story_act2_fed"].turnedInByNpc = true;
        completeQuest("story_act2_fed");
        expect(mockState.worldFlags.factionSway).toBe("federation");

        mockState.character.activeQuests["story_act2_cor"] = { progress: 0, currentStep: 0, turnedInByNpc: true };
        completeQuest("story_act2_cor");
        expect(mockState.worldFlags.factionSway).toBe("corsairs");

        mockState.character.activeQuests["story_act2_syn"] = { progress: 0, currentStep: 0, turnedInByNpc: true };
        completeQuest("story_act2_syn");
        expect(mockState.worldFlags.factionSway).toBe("syndicate");
    });

    test('Quest choice index inside Act III Summit writes variables to worldFlags', () => {
        // Choice index 0 (Fed)
        evaluateChoice("story_act3", 0);
        expect(mockState.worldFlags.endingReached).toBe("federation");
        expect(mockState.worldFlags.factionSway).toBe("federation");
    });

    test('Shop prices dynamically adapt based on global factionSway', () => {
        // Baseline price: Blaster cost 100 cr.
        // On Terra Prime (controlled by Federation):
        // Rep is +50 -> 15% discount (cost = 85 cr)
        expect(getItemPrice("Blaster")).toBe(85);

        // Swap sway to Corsairs. Player rep with Corsairs is -20.
        // Markup is applied -> 1.1x multiplier (cost = 110 cr)
        mockState.worldFlags.factionSway = "corsairs";
        expect(getItemPrice("Blaster")).toBe(110);
    });

    test('Coalition factionSway applies flat 15% discount on top of pricing', () => {
        mockState.worldFlags.factionSway = "coalition";
        // Baseline price with Coalition discount = 85 (Federation reputation baseline) * 0.85 = 72
        expect(getItemPrice("Blaster")).toBe(72);
    });

    test('Districts UI swaps NPCs based on active factionSway', () => {
        // Without factionSway: Xylo Delta has Nesta
        mockState.currentLocation = "xylo_delta";
        renderDistricts();
        expect(document.getElementById("districtsContainer").innerHTML).toContain("talkToNPC('nesta')");

        // With Federation sway: Nesta swapped to Vance
        mockState.worldFlags.factionSway = "federation";
        renderDistricts();
        expect(document.getElementById("districtsContainer").innerHTML).toContain("talkToNPC('vance')");
        expect(document.getElementById("districtsContainer").innerHTML).not.toContain("talkToNPC('nesta')");
    });
});
