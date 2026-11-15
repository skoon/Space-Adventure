import {
    NODE_STATUS,
    selector,
    sequence,
    condition,
    action,
    evaluateBehaviorTree,
    buildTreeFromDescriptor,
    DEFAULT_AI_PROFILES
} from '../../systems/ai/behaviorTree.js';
import {
    initCombat,
    enemyTurn,
    combatConditionMap,
    combatActionMap
} from '../../systems/combat.js';
import { enemies, bosses } from '../../data/enemies.js';

describe('Advanced AI Behavior Tree System', () => {
    describe('Core Behavior Tree Primitives', () => {
        test('NODE_STATUS exports SUCCESS and FAILURE constants', () => {
            expect(NODE_STATUS.SUCCESS).toBe('SUCCESS');
            expect(NODE_STATUS.FAILURE).toBe('FAILURE');
        });

        test('condition node evaluates predicate correctly', () => {
            const trueCond = condition((ctx) => ctx.value > 10);
            const falseCond = condition((ctx) => ctx.value < 5);

            expect(trueCond.tick({ value: 20 })).toBe(NODE_STATUS.SUCCESS);
            expect(trueCond({ value: 20 })).toBe(NODE_STATUS.SUCCESS);

            expect(falseCond.tick({ value: 20 })).toBe(NODE_STATUS.FAILURE);
            expect(falseCond({ value: 20 })).toBe(NODE_STATUS.FAILURE);
        });

        test('action node returns explicit status or maps truthy/undefined to SUCCESS', () => {
            const explicitSuccess = action(() => NODE_STATUS.SUCCESS);
            const explicitFailure = action(() => NODE_STATUS.FAILURE);
            const voidAction = action(() => { /* returns undefined */ });
            const truthyAction = action(() => ({ hit: true }));
            const falsyAction = action(() => false);

            expect(explicitSuccess.tick({})).toBe(NODE_STATUS.SUCCESS);
            expect(explicitFailure.tick({})).toBe(NODE_STATUS.FAILURE);
            expect(voidAction.tick({})).toBe(NODE_STATUS.SUCCESS);
            expect(truthyAction.tick({})).toBe(NODE_STATUS.SUCCESS);
            expect(falsyAction.tick({})).toBe(NODE_STATUS.FAILURE);
        });

        test('selector node returns SUCCESS on first successful child and short-circuits', () => {
            const child1 = jest.fn(() => NODE_STATUS.FAILURE);
            const child2 = jest.fn(() => NODE_STATUS.SUCCESS);
            const child3 = jest.fn(() => NODE_STATUS.SUCCESS);

            const sel = selector(child1, child2, child3);
            const result = sel.tick({ test: true });

            expect(result).toBe(NODE_STATUS.SUCCESS);
            expect(child1).toHaveBeenCalled();
            expect(child2).toHaveBeenCalled();
            expect(child3).not.toHaveBeenCalled(); // Short-circuited
        });

        test('selector node returns FAILURE when all children fail', () => {
            const child1 = condition(() => false);
            const child2 = condition(() => false);

            const sel = selector(child1, child2);
            expect(sel.tick({})).toBe(NODE_STATUS.FAILURE);
        });

        test('sequence node returns FAILURE on first failing child and short-circuits', () => {
            const child1 = jest.fn(() => NODE_STATUS.SUCCESS);
            const child2 = jest.fn(() => NODE_STATUS.FAILURE);
            const child3 = jest.fn(() => NODE_STATUS.SUCCESS);

            const seq = sequence(child1, child2, child3);
            const result = seq.tick({});

            expect(result).toBe(NODE_STATUS.FAILURE);
            expect(child1).toHaveBeenCalled();
            expect(child2).toHaveBeenCalled();
            expect(child3).not.toHaveBeenCalled(); // Short-circuited
        });

        test('sequence node returns SUCCESS when all children succeed', () => {
            const child1 = condition(() => true);
            const child2 = action(() => true);

            const seq = sequence(child1, child2);
            expect(seq.tick({})).toBe(NODE_STATUS.SUCCESS);
        });

        test('evaluateBehaviorTree runs tree tick or callable and handles nulls', () => {
            const nodeWithTick = { tick: jest.fn(() => NODE_STATUS.SUCCESS) };
            const callableNode = jest.fn(() => NODE_STATUS.SUCCESS);

            expect(evaluateBehaviorTree(nodeWithTick, { a: 1 })).toBe(NODE_STATUS.SUCCESS);
            expect(nodeWithTick.tick).toHaveBeenCalledWith({ a: 1 });

            expect(evaluateBehaviorTree(callableNode, { b: 2 })).toBe(NODE_STATUS.SUCCESS);
            expect(callableNode).toHaveBeenCalledWith({ b: 2 });

            expect(evaluateBehaviorTree(null, {})).toBe(NODE_STATUS.FAILURE);
        });
    });

    describe('buildTreeFromDescriptor', () => {
        test('compiles declarative JSON descriptors into executable tree', () => {
            const descriptor = {
                type: 'selector',
                children: [
                    {
                        type: 'sequence',
                        children: [
                            { type: 'condition', check: 'isHighEnergy' },
                            { type: 'action', act: 'superLaser' }
                        ]
                    },
                    {
                        type: 'action',
                        act: 'punch'
                    }
                ]
            };

            const actionsExecuted = [];
            const conditionMap = {
                isHighEnergy: (ctx) => ctx.energy > 50
            };
            const actionMap = {
                superLaser: (ctx) => {
                    actionsExecuted.push('superLaser');
                    return NODE_STATUS.SUCCESS;
                },
                punch: (ctx) => {
                    actionsExecuted.push('punch');
                    return NODE_STATUS.SUCCESS;
                }
            };

            const tree = buildTreeFromDescriptor(descriptor, actionMap, conditionMap);

            // Turn 1: High Energy (75 > 50) -> triggers superLaser
            const res1 = evaluateBehaviorTree(tree, { energy: 75 });
            expect(res1).toBe(NODE_STATUS.SUCCESS);
            expect(actionsExecuted).toEqual(['superLaser']);

            // Turn 2: Low Energy (20 < 50) -> falls back to punch
            actionsExecuted.length = 0;
            const res2 = evaluateBehaviorTree(tree, { energy: 20 });
            expect(res2).toBe(NODE_STATUS.SUCCESS);
            expect(actionsExecuted).toEqual(['punch']);
        });

        test('handles missing actions and conditions gracefully', () => {
            const descriptor = {
                type: 'sequence',
                children: [
                    { type: 'condition', check: 'nonExistentCheck' },
                    { type: 'action', act: 'nonExistentAction' }
                ]
            };

            const tree = buildTreeFromDescriptor(descriptor, {}, {});
            expect(evaluateBehaviorTree(tree, {})).toBe(NODE_STATUS.FAILURE);
        });

        test('returns descriptor directly if already a compiled tree node', () => {
            const node = condition(() => true);
            expect(buildTreeFromDescriptor(node)).toBe(node);
        });
    });

    describe('Combat Integration with Behavior Trees', () => {
        let mockState;
        let mockCombatElements;
        let mockUi;

        beforeEach(() => {
            mockState = {
                character: {
                    name: 'Hero',
                    hp: 100,
                    maxHp: 100,
                    energy: 50,
                    maxEnergy: 100,
                    role: 'Warrior',
                    attack: 10,
                    defense: 5,
                    ap: 3,
                    maxAp: 3,
                    level: 5,
                    equipment: { weapon: null, armor: null, accessory: null }
                },
                enemy: null,
                playerStatusEffects: [],
                enemyStatusEffects: [],
                gameState: 'combat',
                inventory: [],
                currentLocation: 'terra_prime',
                combatStance: 'Neutral',
                companionCooldown: 0,
                activeCompanion: null
            };

            mockCombatElements = {
                playerName: {}, playerHp: {}, playerMaxHp: {}, playerAtk: {}, playerDef: {},
                playerEnergy: {}, playerMaxEnergy: {}, playerHpBar: { style: {} }, playerEnergyBar: { style: {} },
                playerStatusEffects: { innerHTML: '', appendChild: jest.fn() }, playerAvatar: {},
                enemyName: {}, enemyHp: {}, enemyMaxHp: {}, enemyAtk: {}, enemyDef: {}, enemyHpBar: { style: {} },
                enemyBreakCurrent: {}, enemyBreakMax: {}, enemyBreakBar: { style: {} },
                enemyStatusEffects: { innerHTML: '', appendChild: jest.fn() },
                combatLog: {}
            };

            mockUi = {
                addLog: jest.fn(),
                updateCombatLog: jest.fn(),
                showScreen: jest.fn(),
                updateUI: jest.fn(),
                getStatusEffectIcon: jest.fn().mockReturnValue('ICON'),
                showVictoryMessage: jest.fn()
            };

            initCombat({
                state: mockState,
                data: { enemies, bosses, locations: {} },
                dom: { combatElements: mockCombatElements },
                ui: mockUi,
                equipment: { getEffectiveStats: () => ({ attack: 10, defense: 5 }) },
                character: { getCharacterAvatar: jest.fn(), gainXp: jest.fn() },
                quests: { checkQuestProgress: jest.fn() },
                exploration: { simulateExploration: jest.fn() },
                settings: { getDifficulty: () => ({ enemyHpModifier: 1, enemyDmgModifier: 1 }) }
            });
        });

        test('Security Sentinel behavior tree drains energy and shield when player has defenseBoost', () => {
            const sentinelTemplate = enemies.find(e => e.name === "Security Sentinel");
            expect(sentinelTemplate).toBeDefined();
            expect(sentinelTemplate.aiProfile).toBeDefined();

            mockState.enemy = { ...sentinelTemplate, maxHp: sentinelTemplate.hp };
            mockState.character.energy = 50;
            mockState.playerStatusEffects = [{ type: 'defenseBoost', value: 15, duration: 3 }];

            enemyTurn();

            // Energy drained by 10 (50 -> 40), then regenerated by 5 at turn end (40 -> 45)
            expect(mockState.character.energy).toBe(45);

            // Shield reduced by 10 (15 -> 5)
            const boost = mockState.playerStatusEffects.find(e => e.type === 'defenseBoost');
            expect(boost).toBeDefined();
            expect(boost.value).toBe(5);
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Security Sentinel hacks your shield capacitors'));
        });

        test('Security Sentinel behavior tree falls back to standard attack when player has no energy and no shield', () => {
            const sentinelTemplate = enemies.find(e => e.name === "Security Sentinel");
            mockState.enemy = { ...sentinelTemplate, maxHp: sentinelTemplate.hp, attack: 15 };
            mockState.character.energy = 0;
            mockState.playerStatusEffects = []; // No defense shield

            enemyTurn();

            // Character took standard attack damage (15 attack - 5 def = 10 damage)
            expect(mockState.character.hp).toBe(90);
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Security Sentinel hits you for 10 damage'));
        });

        test('Ashen Hulk behavior tree triggers enrage tactical branch when below 50% HP', () => {
            const hulkTemplate = enemies.find(e => e.name === "Ashen Hulk");
            expect(hulkTemplate).toBeDefined();
            expect(hulkTemplate.aiProfile).toBeDefined();

            mockState.enemy = {
                ...hulkTemplate,
                hp: 150,
                maxHp: 150,
                attack: 14,
                defense: 8
            };

            // Turn 1: Above 50% HP (150/150 = 100%) -> Standard attack
            enemyTurn();
            expect(mockState.enemy.enraged).toBeUndefined();
            expect(mockState.enemy.attack).toBe(14);
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Ashen Hulk hits you for 9 damage'));

            // Turn 2: Drop below 50% HP (50 / 150 = 33%) -> Triggers tactical enrage branch!
            mockState.enemy.hp = 50;
            enemyTurn();
            expect(mockState.enemy.enraged).toBe(true);
            expect(mockState.enemy.attack).toBe(20); // 14 + 6 buff = 20
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('flies into an enraged frenzy'));
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('slams you in a fit of rage'));

            // Turn 3: Subsequent turn while below 50% HP -> Already enraged, does not enrage again
            mockUi.addLog.mockClear();
            enemyTurn();
            expect(mockUi.addLog).not.toHaveBeenCalledWith(expect.stringContaining('flies into an enraged frenzy'));
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Ashen Hulk hits you for 15 damage'));
        });

        test('Void Stalker behavior tree triggers voidCharge tactical branch when below 50% HP', () => {
            const stalkerTemplate = enemies.find(e => e.name === "Void Stalker");
            expect(stalkerTemplate).toBeDefined();
            expect(stalkerTemplate.aiProfile).toBeDefined();

            mockState.enemy = {
                ...stalkerTemplate,
                hp: 40, // Below 50% of 95
                maxHp: 95,
                attack: 22
            };

            enemyTurn();
            expect(mockState.enemy.voidCharged).toBe(true);
            expect(mockState.enemy.attack).toBe(30); // 22 + 8 buff = 30
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('supercharges with void energy'));
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('strikes with void power'));
        });

        test('Cryo Drake behavior tree triggers shatterStrike when player is frozen', () => {
            const drakeTemplate = enemies.find(e => e.name === "Cryo Drake");
            expect(drakeTemplate).toBeDefined();
            expect(drakeTemplate.aiProfile).toBeDefined();

            mockState.enemy = { ...drakeTemplate, maxHp: drakeTemplate.hp, attack: 20 };
            mockState.character.hp = 100;
            // Player is frozen
            mockState.playerStatusEffects = [{ type: 'frozen', duration: 2 }];

            enemyTurn();

            // Shatter strike deals 2.0x attack damage (40 - 5 def = 35 damage)
            expect(mockState.character.hp).toBe(65);
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('SHATTERING STRIKE'));
        });

        test('Boss behavior tree triggers overcharged special attack when below 50% HP', () => {
            const xylarTemplate = bosses.find(b => b.name === "Overlord Xylar");
            expect(xylarTemplate).toBeDefined();
            expect(xylarTemplate.aiProfile).toBeDefined();

            mockState.enemy = {
                ...xylarTemplate,
                isBoss: true,
                hp: 80, // Below 50% of 200
                maxHp: 200,
                attack: 20
            };

            // Force randomChance to trigger the overcharged branch (< 0.35)
            const origRandom = Math.random;
            Math.random = jest.fn(() => 0.1);

            enemyTurn();

            Math.random = origRandom;
            expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('overcharged Annihilation Beam'));
        });
    });
});
