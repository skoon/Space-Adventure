jest.mock('../../systems/achievements.js', () => ({
    checkAchievement: jest.fn()
}));

import { initDerelict, startDerelictRun, exploreRoom, escapeShip, failRun } from '../../systems/derelict.js';
import { checkAchievement } from '../../systems/achievements.js';

describe('Derelict System tests', () => {
    let mockState;
    let mockUi;
    let mockCharacter;
    let mockQuests;
    let mockCombat;
    let mockDeps;
    let destination;

    beforeEach(() => {
        jest.clearAllMocks();

        mockState = {
            gameState: 'exploring',
            character: {
                hp: 100,
                maxHp: 100,
                xp: 0,
                credits: 100
            },
            inventory: [],
            derelict: null,
            currentLocation: 'terra_prime'
        };

        mockUi = {
            addLog: jest.fn(),
            updateUI: jest.fn(),
            showScreen: jest.fn(),
            showDerelictScreen: jest.fn()
        };

        mockCharacter = {
            gainXp: jest.fn()
        };

        mockQuests = {
            checkQuestProgress: jest.fn()
        };

        mockCombat = {
            encounterEnemy: jest.fn(),
            encounterBoss: jest.fn()
        };

        destination = {
            id: 'xylo_delta',
            name: 'Xylo Delta',
            description: 'Desert planet'
        };

        mockDeps = {
            state: mockState,
            ui: mockUi,
            character: mockCharacter,
            quests: mockQuests,
            combat: mockCombat,
            data: {
                locations: {
                    'xylo_delta': destination
                }
            }
        };

        initDerelict(mockDeps);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('startDerelictRun initializes derelict state and changes screen', () => {
        startDerelictRun(destination);

        expect(mockState.gameState).toBe('derelict');
        expect(mockState.derelict).toBeDefined();
        expect(mockState.derelict.active).toBe(true);
        expect(mockState.derelict.oxygen).toBeGreaterThanOrEqual(10);
        expect(mockState.derelict.oxygen).toBeLessThanOrEqual(15);
        expect(mockState.derelict.roomsExplored).toBe(0);
        expect(mockState.derelict.currentLoot).toEqual([]);
        expect(mockState.derelict.destination).toBe(destination);
        expect(mockUi.showDerelictScreen).toHaveBeenCalled();
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('DISTRESS SIGNAL INTERCEPTED'));
    });

    describe('exploreRoom event branches', () => {
        beforeEach(() => {
            startDerelictRun(destination);
            // Lock oxygen to 10
            mockState.derelict.oxygen = 10;
        });

        test('exploreRoom deducts oxygen and increments roomsExplored', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.95); // Empty room roll
            exploreRoom();

            expect(mockState.derelict.oxygen).toBe(9);
            expect(mockState.derelict.roomsExplored).toBe(1);
            expect(mockUi.updateUI).toHaveBeenCalled();
        });

        test('exploreRoom rolls combat event', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.1); // Combat range (< 0.42 with 1 room depth bonus)
            exploreRoom();

            expect(mockCombat.encounterEnemy).toHaveBeenCalled();
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Hostiles detected'));
        });

        test('exploreRoom rolls loot event and finds item', () => {
            // Mock random so that we pass the loot range but fail the equipment chance
            // loot is 0.40 - 0.70. Let's make it 0.5.
            // Math.random for equipment chance needs to fail (e.g. return 0.99)
            // Math.random for item select returns 0.0
            let randomCalls = 0;
            jest.spyOn(Math, 'random').mockImplementation(() => {
                randomCalls++;
                if (randomCalls === 1) return 0.5; // Event roll: loot
                if (randomCalls === 2) return 0.99; // Equipment chance check: fail
                if (randomCalls === 3) return 0.5; // High-tier loot check: fail
                return 0.0; // Index in base loot pool ("Scrap Metal")
            });

            exploreRoom();

            expect(mockState.derelict.currentLoot).toContain('Scrap Metal');
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('secured a Scrap Metal'));
        });

        test('exploreRoom rolls hazard event and takes damage', () => {
            // Math.random() for event roll returns 0.8 (Hazard is 0.70 - 0.90)
            // Math.random() for hazard damage returns 0.5
            let randomCalls = 0;
            jest.spyOn(Math, 'random').mockImplementation(() => {
                randomCalls++;
                if (randomCalls === 1) return 0.8; // Hazard roll
                return 0.5; // damage roll: 5 + floor(0.5 * 10) + depth = 5 + 5 + 1 = 11 damage
            });

            exploreRoom();

            expect(mockState.character.hp).toBe(89); // 100 - 11
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining(' ruptured! You took 11 damage.'));
        });

        test('exploreRoom fails run immediately when oxygen reaches 0', () => {
            mockState.derelict.oxygen = 1;
            jest.spyOn(Math, 'random').mockReturnValue(0.95); // Empty room roll

            exploreRoom();

            expect(mockState.derelict.active).toBe(false);
            expect(mockState.gameState).toBe('exploring');
            expect(mockState.character.hp).toBe(75); // 25% max HP damage (100 - 25)
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('passed out from lack of oxygen'));
        });
    });

    describe('escapeShip & failRun finishes', () => {
        test('escapeShip transfers cargo to player inventory and resumes travel', () => {
            startDerelictRun(destination);
            mockState.derelict.currentLoot = ['Scrap Metal', 'Plasma Core'];
            
            escapeShip();

            expect(mockState.inventory).toContain('Scrap Metal');
            expect(mockState.inventory).toContain('Plasma Core');
            expect(mockState.derelict.active).toBe(false);
            expect(mockState.gameState).toBe('exploring');
            expect(mockState.currentLocation).toBe('xylo_delta');
            expect(checkAchievement).toHaveBeenCalledWith('derelict', { completed: true });
            expect(mockUi.showScreen).toHaveBeenCalledWith('exploring');
        });

        test('failRun inflicts HP penalty and drops cargo, then resumes travel', () => {
            startDerelictRun(destination);
            mockState.derelict.currentLoot = ['Scrap Metal'];

            failRun();

            expect(mockState.inventory).not.toContain('Scrap Metal');
            expect(mockState.character.hp).toBe(75); // 25% max HP penalty
            expect(mockState.derelict.active).toBe(false);
            expect(mockState.gameState).toBe('exploring');
            expect(mockState.currentLocation).toBe('xylo_delta');
        });
    });

    describe('Derelict Boss Raid triggers', () => {
        test('reaching the boss room triggers encounterBoss', () => {
            startDerelictRun(destination);
            mockState.derelict.roomsExplored = 5; // next room is 6 (boss room)
            mockState.derelict.oxygen = 5;
            
            exploreRoom();
            
            expect(mockState.derelict.roomsExplored).toBe(6);
            expect(mockCombat.encounterBoss).toHaveBeenCalled();
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('ANOMALY SOURCE DETECTED'));
        });

        test('cannot explore further once boss is defeated', () => {
            startDerelictRun(destination);
            mockState.derelict.roomsExplored = 6;
            mockState.derelict.bossDefeated = true;
            mockState.derelict.oxygen = 5;

            exploreRoom();

            expect(mockState.derelict.roomsExplored).toBe(6); // unchanged
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('structural integrity is failing'));
        });
    });
});
