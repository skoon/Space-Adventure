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
    companionInterject,
    COMPANIONS
} from '../../systems/companions.js';

import {
    initCombat,
    triggerCompanionAbility
} from '../../systems/combat.js';

import { initQuests } from '../../systems/quests.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockUpdateCombatLog = jest.fn();
const mockUpdateCombatUI = jest.fn();
const mockShowDialog = jest.fn();
const mockShowScreen = jest.fn();
const mockGainXp = jest.fn();

const mockState = {
    character: {
        credits: 100,
        level: 1,
        hp: 100,
        maxHp: 100,
        ap: 3,
        maxAp: 3
    },
    inventory: ["Data Chip", "Bio-Gel", "Scrap Metal"],
    companions: {},
    activeCompanion: null,
    companionCooldown: 0,
    playerStatusEffects: [],
    enemyStatusEffects: []
};

const mockDeps = {
    state: mockState,
    data: {
        enemies: [],
        bosses: [],
        locations: {}
    },
    dom: {
        combatElements: {}
    },
    ui: {
        addLog: mockLog,
        updateUI: mockUpdateUI,
        updateCombatLog: mockUpdateCombatLog,
        showDialog: mockShowDialog,
        showScreen: mockShowScreen,
        showVictoryMessage: jest.fn()
    },
    combat: {
        encounterEnemy: jest.fn(),
        updateCombatUI: mockUpdateCombatUI
    },
    character: {
        getCharacterAvatar: jest.fn(),
        gainXp: mockGainXp
    },
    quests: {
        checkQuestProgress: jest.fn()
    },
    exploration: {
        simulateExploration: jest.fn()
    },
    settings: {
        getDifficulty: jest.fn(() => ({ enemyHpModifier: 1.0, enemyDmgModifier: 1.0, hazardDmgModifier: 1.0 }))
    },
    equipment: {
        getEffectiveStats: jest.fn(() => ({ attack: 10, defense: 5 }))
    }
};

describe('Companions System Core & UI Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset state
        mockState.character.credits = 300;
        mockState.character.level = 1;
        mockState.character.hp = 50; // damaged to check heals
        mockState.character.maxHp = 100;
        mockState.character.ap = 3;
        mockState.inventory = ["Data Chip", "Bio-Gel", "Scrap Metal"];
        mockState.companions = {};
        mockState.activeCompanion = null;
        mockState.companionCooldown = 0;
        mockState.playerStatusEffects = [];
        mockState.enemyStatusEffects = [];
        mockState.enemy = { hp: 100, maxHp: 100, attack: 10, defense: 5, name: "Test Enemy" };

        initCompanions(mockDeps);
        initCombat(mockDeps);
    });

    test('Initializes state variables correctly', () => {
        expect(mockState.companions).toHaveProperty('vance');
        expect(mockState.companions.vance.unlocked).toBe(false);
        expect(mockState.activeCompanion).toBeNull();
    });

    test('Prevents recruitment with insufficient credits', () => {
        mockState.character.credits = 50; // vance costs 200
        const success = recruitCompanion("vance");
        expect(success).toBe(false);
        expect(mockState.companions.vance.unlocked).toBe(false);
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Insufficient credits"));
    });

    test('Allows recruitment with sufficient credits and sets active', () => {
        const success = recruitCompanion("vance");
        expect(success).toBe(true);
        expect(mockState.companions.vance.unlocked).toBe(true);
        expect(mockState.character.credits).toBe(100); // 300 - 200
        expect(mockState.activeCompanion).toBe("vance");
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Vance has joined your crew"));
    });

    test('Active companion toggle and retrieval', () => {
        recruitCompanion("vance");
        expect(getActiveCompanion().id).toBe("vance");

        // Unlock apex too
        mockState.character.credits = 200;
        recruitCompanion("apex"); // costs 150
        expect(mockState.activeCompanion).toBe("apex");

        // Switch back to vance
        setActiveCompanion("vance");
        expect(mockState.activeCompanion).toBe("vance");

        // Dismiss companion
        setActiveCompanion(null);
        expect(mockState.activeCompanion).toBeNull();
        expect(getActiveCompanion()).toBeNull();
    });

    test('Trust gains and Level ups via Gifting', () => {
        recruitCompanion("vance"); // Unlock vance
        
        // Gift normal item (+10 Trust)
        giftToCompanion("vance", "Bio-Gel");
        expect(mockState.inventory).not.toContain("Bio-Gel");
        expect(mockState.companions.vance.trust).toBe(10);
        expect(mockState.companions.vance.level).toBe(1);

        // Gift preferred item (+25 Trust)
        giftToCompanion("vance", "Data Chip");
        expect(mockState.inventory).not.toContain("Data Chip");
        expect(mockState.companions.vance.trust).toBe(35); // 10 + 25

        // Gift credits (+10 Trust for 100 credits)
        giftCreditsToCompanion("vance", 100);
        expect(mockState.character.credits).toBe(0); // 100 - 100
        expect(mockState.companions.vance.trust).toBe(45); // 35 + 10

        // Talking to companion adds +5 Trust and sets talk flag
        expect(mockState.companions.vance.talkedSinceLastAction).toBe(false);
        const text = talkToCompanion("vance");
        expect(text).toBeDefined();
        expect(mockState.companions.vance.trust).toBe(50); // 45 + 5
        expect(mockState.companions.vance.talkedSinceLastAction).toBe(true);
        expect(mockState.companions.vance.level).toBe(2); // Level up!
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("grown to Level 2"));

        // Reset talk flags
        resetCompanionTalkFlags();
        expect(mockState.companions.vance.talkedSinceLastAction).toBe(false);
    });

    test('Correct ability values returned based on levels', () => {
        expect(getCompanionAbilityValue("vance", 1)).toBe(5);
        expect(getCompanionAbilityValue("vance", 2)).toBe(8);
        expect(getCompanionAbilityValue("vance", 3)).toBe(12);

        expect(getCompanionAbilityValue("lyra", 1)).toBe(25);
        expect(getCompanionAbilityValue("lyra", 2)).toBe(45);
        expect(getCompanionAbilityValue("lyra", 3)).toBe(70);

        expect(getCompanionAbilityValue("apex", 1)).toBe(20);
        expect(getCompanionAbilityValue("apex", 2)).toBe(35);
        expect(getCompanionAbilityValue("apex", 3)).toBe(55);
    });

    test('Combat trigger - Vance Shield Generator adds DEF buff', () => {
        recruitCompanion("vance"); // Unlocked and active
        mockState.character.ap = 3;

        triggerCompanionAbility();
        expect(mockState.character.ap).toBe(2);
        expect(mockState.companionCooldown).toBe(3);
        const shieldEffect = mockState.playerStatusEffects.find(e => e.type === "defenseBoost");
        expect(shieldEffect).toBeDefined();
        expect(shieldEffect.value).toBe(5); // Level 1 Vance
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Vance activates Shield Generator"));
    });

    test('Combat trigger - Dr. Lyra heals player HP', () => {
        mockState.character.credits = 250;
        recruitCompanion("lyra");
        mockState.character.ap = 3;
        mockState.character.hp = 50;

        triggerCompanionAbility();
        expect(mockState.character.ap).toBe(2);
        expect(mockState.companionCooldown).toBe(4);
        expect(mockState.character.hp).toBe(75); // 50 + 25
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Dr. Lyra uses Nano-Heal"));
    });

    test('Combat trigger - Apex Precision Shot deals damage to enemy', () => {
        mockState.character.credits = 150;
        recruitCompanion("apex");
        mockState.character.ap = 3;

        triggerCompanionAbility();
        expect(mockState.character.ap).toBe(2);
        expect(mockState.companionCooldown).toBe(3);
        expect(mockState.enemy.hp).toBe(80); // 100 - 20
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Apex fires a Precision Shot"));
    });
});

describe('companionInterject', () => {
    beforeEach(() => {
        // Suite already initializes companions with a mock state + mockLog; reuse them.
        mockState.activeCompanion = 'lyra';
        mockState.companions = mockState.companions || {};
        mockState.companions.lyra = { unlocked: true, trust: 0, level: 1 };
        mockState.character = mockState.character || {};
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockLog.mockClear();
        initCompanions(mockDeps);
        initQuests({
            state: mockState,
            data: { quests: {} },
            ui: {
                addLog: mockLog,
                updateUI: jest.fn(),
                showVictoryMessage: jest.fn(),
                showSaveMessage: jest.fn(),
                showDialog: jest.fn()
            }
        });
    });

    test('companionBark fires for the active companion', () => {
        companionInterject({ companionBark: { lyra: 'You trust these Corsairs?' } });
        expect(mockLog).toHaveBeenCalledWith('💬 Dr. Lyra: "You trust these Corsairs?"');
    });

    test('companionBark ignored for inactive companion', () => {
        companionInterject({ companionBark: { apex: 'Blow it up!' } });
        expect(mockLog).not.toHaveBeenCalled();
    });

    test('falls back to data-driven interjections', () => {
        mockState.character.storyline.variables.killed_queen = true;
        companionInterject({});
        expect(mockLog).toHaveBeenCalledWith(
            '💬 Dr. Lyra: "That life was a data point we can never recover."');
    });

    test('no companion active → no-op', () => {
        mockState.activeCompanion = null;
        companionInterject({ companionBark: { lyra: 'hi' } });
        expect(mockLog).not.toHaveBeenCalled();
    });
});
