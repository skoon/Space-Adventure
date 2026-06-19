jest.mock('../../systems/achievements.js', () => ({
    checkAchievement: jest.fn()
}));

import { initDerelict, startDerelictRun, exploreRoom, escapeShip, failRun, turnLeft, turnRight, uTurn } from '../../systems/derelict.js';
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
        expect(mockState.derelict.roomsExplored).toBe(1); // Starting room is 1st room visited
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
            mockState.derelict.map[2][1] = 0; // Ensure corridor is open
            jest.spyOn(Math, 'random').mockReturnValue(0.95); // Empty room roll
            exploreRoom();

            expect(mockState.derelict.oxygen).toBe(9);
            expect(mockState.derelict.roomsExplored).toBe(2);
            expect(mockUi.updateUI).toHaveBeenCalled();
        });

        test('exploreRoom rolls combat event', () => {
            mockState.derelict.map[2][1] = 0; // Ensure corridor is open
            jest.spyOn(Math, 'random').mockReturnValue(0.1); // Combat chance check (< 0.15)
            exploreRoom();

            expect(mockCombat.encounterEnemy).toHaveBeenCalled();
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Hostiles detected'));
        });

        test('exploreRoom rolls loot event and finds item', () => {
            mockState.derelict.map[2][1] = 3; // Loot cell
            let randomCalls = 0;
            jest.spyOn(Math, 'random').mockImplementation(() => {
                randomCalls++;
                if (randomCalls === 1) return 0.99; // Equipment chance check: fail
                if (randomCalls === 2) return 0.5; // High-tier loot check: fail
                return 0.0; // Index in base loot pool ("Scrap Metal")
            });

            exploreRoom();

            expect(mockState.derelict.currentLoot).toContain('Scrap Metal');
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('secured a Scrap Metal'));
        });

        test('exploreRoom rolls hazard event and takes damage', () => {
            mockState.derelict.map[2][1] = 2; // Hazard cell
            jest.spyOn(Math, 'random').mockReturnValue(0.5); // Damage roll: 5 + floor(0.5*10) + roomsExplored (2) = 12

            exploreRoom();

            expect(mockState.character.hp).toBe(88); // 100 - 12
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining(' ruptured! You took 12 damage.'));
        });

        test('exploreRoom fails run immediately when oxygen reaches 0', () => {
            mockState.derelict.map[2][1] = 0; // Ensure corridor is open
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
            mockState.derelict.map[2][1] = 4; // Boss room cell
            mockState.derelict.oxygen = 5;
            
            exploreRoom();
            
            expect(mockCombat.encounterBoss).toHaveBeenCalled();
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('ANOMALY SOURCE DETECTED'));
        });

        test('cannot explore further once boss is defeated', () => {
            startDerelictRun(destination);
            // Move player to (1, 2) which has map value 0 (non-airlock)
            mockState.derelict.x = 1;
            mockState.derelict.y = 2;
            mockState.derelict.map[2][1] = 0;
            mockState.derelict.bossDefeated = true;
            mockState.derelict.oxygen = 5;

            exploreRoom();

            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('structural integrity is failing'));
        });
    });

    describe('Grid Navigation and Collisions', () => {
        test('turnLeft, turnRight, and uTurn rotate directional vectors correctly', () => {
            startDerelictRun(destination);
            // Initially facing South (0, 1)
            expect(mockState.derelict.dirX).toBe(0);
            expect(mockState.derelict.dirY).toBe(1);

            turnLeft(); // Turn East (1, 0)
            expect(mockState.derelict.dirX).toBe(1);
            expect(mockState.derelict.dirY).toBe(0);

            turnRight(); // Turn South (0, 1)
            expect(mockState.derelict.dirX).toBe(0);
            expect(mockState.derelict.dirY).toBe(1);

            uTurn(); // Turn North (0, -1)
            expect(mockState.derelict.dirX).toBe(0);
            expect(mockState.derelict.dirY).toBe(-1);
        });

        test('exploreRoom is blocked by walls (1)', () => {
            startDerelictRun(destination);
            mockState.derelict.map[2][1] = 1; // Solid wall ahead
            mockState.derelict.oxygen = 10;

            exploreRoom();

            expect(mockState.derelict.x).toBe(1);
            expect(mockState.derelict.y).toBe(1); // Blocked
            expect(mockState.derelict.oxygen).toBe(10); // Oxygen preserved
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Solid bulkhead ahead'));
        });
    });
});
