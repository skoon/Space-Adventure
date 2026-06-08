jest.mock('../../systems/ui.js', () => ({
    showScreen: jest.fn(),
    updateUI: jest.fn(),
    addLog: jest.fn()
}));

jest.mock('../../systems/combat.js', () => ({
    updateCombatUI: jest.fn(),
    encounterEnemy: jest.fn(),
    encounterBoss: jest.fn()
}));

jest.mock('../../systems/ship.js', () => ({
    getScannerBonus: jest.fn(() => 0),
    getMedbayHealAmount: jest.fn(() => 0)
}));

import { loadGame, initSaveLoad } from '../../systems/saveload.js';
import { initQuests, acceptQuest, evaluateChoice, checkChoiceRequirements, triggerChoiceStepIfActive } from '../../systems/quests.js';
import { initShop, getPriceMultiplier, getLocalShopFaction, getItemPrice, getItemSellPrice } from '../../systems/shop.js';
import { initLocations, travelTo } from '../../systems/locations.js';

describe('Branching Quests & Factions Integration tests', () => {
    let mockState;
    let mockUi;
    let mockQuestsData;
    let mockLocationsData;
    let mockCombat;
    let mockDeps;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            gameState: 'exploring',
            character: {
                name: 'TestHero',
                race: 'Human',
                role: 'Warrior',
                level: 3,
                xp: 20,
                hp: 100,
                maxHp: 100,
                credits: 100,
                activeQuests: {},
                completedQuests: [],
                ship: { engineLevel: 1, medbayLevel: 1, cargoLevel: 0, scannerLevel: 0 },
                factions: {
                    federation: 0,
                    corsairs: 0,
                    syndicate: 0
                },
                npcs: {
                    vance: { disposition: 0, memoryFlags: [] },
                    mercer: { disposition: 0, memoryFlags: [] },
                    thorne: { disposition: 0, memoryFlags: [] },
                    nesta: { disposition: 0, memoryFlags: [] }
                },
                equipment: {
                    weapon: null,
                    armor: null,
                    accessory: null
                },
                attack: 5,
                defense: 5
            },
            inventory: [],
            enemy: null,
            playerStatusEffects: [],
            enemyStatusEffects: [],
            companionCooldown: 0
        };

        mockUi = {
            addLog: jest.fn(),
            updateUI: jest.fn(),
            showVictoryMessage: jest.fn(),
            showSaveMessage: jest.fn(),
            showDialog: jest.fn(),
            showScreen: jest.fn(),
            playTravelAnimation: jest.fn(callback => callback())
        };

        mockQuestsData = {
            quest_branch_test: {
                id: "quest_branch_test",
                title: "Branching Quest Test",
                description: "Test description",
                steps: [
                    {
                        type: "choice",
                        dialogTitle: "Choice Step 1",
                        dialogText: "Pick your reward",
                        choices: [
                            {
                                text: "Take Credits",
                                rewards: { xp: 10, credits: 50 },
                                reputation: { federation: 10, corsairs: -5 },
                                disposition: { vance: 5 },
                                memoryFlags: ["vance_took_credits"],
                                nextStepIndex: 1
                            },
                            {
                                text: "Warrior choice",
                                requires: { role: "Warrior", stat: { name: "attack", value: 10 } },
                                rewards: { xp: 20, items: ["Nano Stimpack"] },
                                reputation: { corsairs: 20 },
                                nextStepIndex: 1
                            }
                        ]
                    },
                    {
                        type: "choice",
                        dialogTitle: "Choice Step 2",
                        dialogText: "Confrontation",
                        choices: [
                            {
                                text: "Trigger Boss Combat",
                                triggerCombat: { enemyName: "Void Corsair Reaver", boss: false }
                            }
                        ]
                    }
                ]
            }
        };

        mockLocationsData = {
            "terra_prime": {
                id: "terra_prime",
                name: "Terra Prime",
                description: "Start planet",
                unlocked: true,
                travelCost: 0
            },
            "xylo_delta": {
                id: "xylo_delta",
                name: "Xylo Delta",
                description: "Corsair planet",
                unlocked: true,
                travelCost: 20
            }
        };

        mockCombat = {
            encounterEnemy: jest.fn(),
            encounterBoss: jest.fn()
        };

        mockDeps = {
            state: mockState,
            ui: mockUi,
            data: {
                quests: mockQuestsData,
                locations: mockLocationsData,
                enemies: [
                    { name: "Void Corsair Reaver", hp: 60, attack: 14, defense: 4, xp: 35 }
                ],
                bosses: [],
                items: {
                    "Plasma Rifle": { type: "weapon", category: "equipment", stats: { attack: 5 }, description: "A powerful energy weapon.", price: 500, stackable: false },
                    "Kevlar Vest": { type: "armor", category: "equipment", stats: { defense: 4 }, description: "Basic protective armor.", price: 400, stackable: false },
                    "Shield Generator": { type: "accessory", category: "equipment", stats: { defense: 3 }, description: "Generates a personal forcefield.", price: 600, stackable: false },
                    "Nano Stimpack": { type: "consumable", category: "consumable", effect: "heal", value: 50, description: "Restores 50 HP", price: 100, stackable: true }
                }
            },
            combat: mockCombat,
            character: {
                gainXp: jest.fn(xp => { mockState.character.xp += xp; })
            }
        };

        // Initialize all modules with dependencies
        initQuests(mockDeps);
        initShop(mockDeps);
        initLocations(mockDeps);
        initSaveLoad(mockDeps);
        
        // Setup simple localStorage mock
        let store = {};
        const mockLocalStorage = {
            getItem: jest.fn(key => store[key] || null),
            setItem: jest.fn((key, val) => { store[key] = val.toString(); }),
            removeItem: jest.fn(key => { delete store[key]; }),
            clear: jest.fn(() => { store = {}; })
        };
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('Save/Load Retroactive Factions & NPCs setup', () => {
        test('Retroactive setup during loadGame initializes missing factions/npcs', () => {
            const legacySave = {
                gameState: 'exploring',
                character: {
                    name: 'LegacyHero',
                    level: 2
                    // factions and npcs missing!
                },
                inventory: []
            };
            window.localStorage.setItem('galacticOdyssey_save', JSON.stringify(legacySave));

            const success = loadGame();
            expect(success).toBe(true);
            expect(mockState.character.factions).toBeDefined();
            expect(mockState.character.factions.federation).toBe(0);
            expect(mockState.character.factions.corsairs).toBe(0);
            expect(mockState.character.factions.syndicate).toBe(0);

            expect(mockState.character.npcs).toBeDefined();
            expect(mockState.character.npcs.vance).toBeDefined();
            expect(mockState.character.npcs.vance.disposition).toBe(0);
            expect(mockState.character.npcs.vance.memoryFlags).toEqual([]);
        });
    });

    describe('Dialogue Choice Requirements', () => {
        test('checkChoiceRequirements works with role requirements', () => {
            expect(checkChoiceRequirements({ role: 'Warrior' })).toBe(true);
            expect(checkChoiceRequirements({ role: 'Mage' })).toBe(false);
        });

        test('checkChoiceRequirements works with race requirements', () => {
            expect(checkChoiceRequirements({ race: 'Human' })).toBe(true);
            expect(checkChoiceRequirements({ race: 'Elf' })).toBe(false);
        });

        test('checkChoiceRequirements checks base stats and includes gear stats', () => {
            // Base attack is 5, check requiring 6 should fail
            expect(checkChoiceRequirements({ stat: { name: 'attack', value: 6 } })).toBe(false);

            // Equipping a weapon (Plasma Rifle adds 5 attack)
            mockState.character.equipment.weapon = 'Plasma Rifle';
            
            // Now effective attack is 5 + 5 = 10, check requiring 10 should pass
            expect(checkChoiceRequirements({ stat: { name: 'attack', value: 10 } })).toBe(true);
            // Check requiring 11 should still fail
            expect(checkChoiceRequirements({ stat: { name: 'attack', value: 11 } })).toBe(false);
        });

        test('checkChoiceRequirements checks defense stat and includes armor/accessory stats', () => {
            // Base defense is 5, check requiring 10 should fail
            expect(checkChoiceRequirements({ stat: { name: 'defense', value: 10 } })).toBe(false);

            // Equip Kevlar Vest (defense +4) and Shield Generator (defense +3)
            mockState.character.equipment.armor = 'Kevlar Vest';
            mockState.character.equipment.accessory = 'Shield Generator';

            // Effective defense: 5 (base) + 4 (armor) + 3 (accessory) = 12
            expect(checkChoiceRequirements({ stat: { name: 'defense', value: 12 } })).toBe(true);
            expect(checkChoiceRequirements({ stat: { name: 'defense', value: 13 } })).toBe(false);
        });

        test('checkChoiceRequirements checks faction reputation and NPC disposition requirements', () => {
            expect(checkChoiceRequirements({ faction: { id: 'corsairs', value: 10 } })).toBe(false);
            mockState.character.factions.corsairs = 10;
            expect(checkChoiceRequirements({ faction: { id: 'corsairs', value: 10 } })).toBe(true);

            expect(checkChoiceRequirements({ npc: { id: 'vance', value: 20 } })).toBe(false);
            mockState.character.npcs.vance.disposition = 20;
            expect(checkChoiceRequirements({ npc: { id: 'vance', value: 20 } })).toBe(true);
        });
    });

    describe('Choice Evaluation & Consequence Hooks', () => {
        test('accepting branching quest triggers initial choice dialog', () => {
            acceptQuest('quest_branch_test');
            expect(mockUi.showDialog).toHaveBeenCalled();
            // Verify dialog options
            const callArgs = mockUi.showDialog.mock.calls[0];
            expect(callArgs[0]).toBe("Choice Step 1");
            expect(callArgs[1]).toBe("Pick your reward");
            
            // Option 0: Take Credits (no reqs) -> passesCheck true
            expect(callArgs[2][0].disabled).toBe(false);
            // Option 1: Warrior choice (requires attack 10, warrior) -> passesCheck false (warrior, but base attack 5 < 10)
            expect(callArgs[2][1].disabled).toBe(true);
        });

        test('evaluateChoice updates state, rewards player, applies rep/disp, and saves memory flags', () => {
            acceptQuest('quest_branch_test');
            
            // Choose Option 0: Take Credits
            evaluateChoice('quest_branch_test', 0);

            expect(mockState.character.xp).toBe(30); // 20 base + 10 reward
            expect(mockState.character.credits).toBe(150); // 100 base + 50 reward
            expect(mockState.character.factions.federation).toBe(10);
            expect(mockState.character.factions.corsairs).toBe(-5);
            expect(mockState.character.npcs.vance.disposition).toBe(5);
            expect(mockState.character.npcs.vance.memoryFlags).toContain("vance_took_credits");

            // Check that the quest advanced to step index 1 (Choice Step 2)
            expect(mockState.character.activeQuests['quest_branch_test'].currentStep).toBe(1);
        });

        test('evaluateChoice handles triggerCombat properly', () => {
            acceptQuest('quest_branch_test');
            // Advance to step index 1
            mockState.character.activeQuests['quest_branch_test'].currentStep = 1;
            
            jest.useFakeTimers();
            evaluateChoice('quest_branch_test', 0);
            jest.runAllTimers();

            // Should set state.enemy and change gameState to combat
            expect(mockState.enemy).toBeDefined();
            expect(mockState.enemy.name).toBe("Void Corsair Reaver");
            expect(mockState.gameState).toBe("combat");
        });
    });

    describe('Faction Shop Price Multipliers', () => {
        test('getPriceMultiplier returns correct values', () => {
            // Neutral
            expect(getPriceMultiplier('federation')).toBe(1.0);

            // Friendly: +50 rep -> 15% discount (0.85 multiplier)
            mockState.character.factions.federation = 50;
            expect(getPriceMultiplier('federation')).toBeCloseTo(0.85);

            // Hostile: -60 rep -> 30% markup (1.3 multiplier)
            mockState.character.factions.corsairs = -60;
            expect(getPriceMultiplier('corsairs')).toBeCloseTo(1.3);
        });

        test('getItemPrice and getItemSellPrice apply multipliers correctly', () => {
            // Buy price of Plasma Rifle is 500. Sell base is 250.
            // On terra_prime, local shop faction is federation.
            mockState.currentLocation = 'terra_prime';

            // Case 1: Neutral
            expect(getItemPrice('Plasma Rifle')).toBe(500);
            expect(getItemSellPrice('Plasma Rifle')).toBe(250);

            // Case 2: Friendly (Discount)
            mockState.character.factions.federation = 100; // 30% discount -> 350 buy price. 2.0 - 0.7 = 1.3 -> 325 sell price
            expect(getItemPrice('Plasma Rifle')).toBe(350);
            expect(getItemSellPrice('Plasma Rifle')).toBe(325);

            // Case 3: Hostile (Markup)
            mockState.character.factions.federation = -100; // 50% markup -> 750 buy price. 2.0 - 1.5 = 0.5 -> 125 sell price
            expect(getItemPrice('Plasma Rifle')).toBe(750);
            expect(getItemSellPrice('Plasma Rifle')).toBe(125);
        });
    });

    describe('Faction Interplanetary Travel Ambushes', () => {
        test('travelTo triggers ambush if faction reputation is hostile (< -30) and roll succeeds', async () => {
            // Mock Math.random to return 0.2 (which is < 25, meaning 25% chance success)
            jest.spyOn(Math, 'random').mockReturnValue(0.2);

            mockState.character.factions.corsairs = -50; // Corsair rep is hostile. Chance = 50 / 2 = 25%
            
            const success = travelTo('xylo_delta');
            expect(success).toBe(true);

            // Wait for async dynamic imports
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(mockState.currentLocation).toBe('xylo_delta');
            expect(mockState.gameState).toBe('combat');
            expect(mockState.enemy).toBeDefined();
            expect(mockState.enemy.name).toBe("Void Corsair Reaver");
        });

        test('travelTo does not trigger ambush if faction reputation is neutral', async () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.99);
            mockState.character.factions.corsairs = 0;

            const success = travelTo('xylo_delta');
            expect(success).toBe(true);

            // Wait for async dynamic imports
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(mockState.gameState).toBe('exploring');
            expect(mockState.enemy).toBeNull();
        });
    });
});
