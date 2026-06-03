import {
    initAchievements,
    unlockAchievement,
    checkAchievement,
    ACHIEVEMENTS
} from '../../systems/achievements.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockShowDialog = jest.fn();

const mockState = {
    character: {
        credits: 100,
        level: 1
    },
    inventory: [],
    achievements: [],
    stats: {}
};

const mockDeps = {
    state: mockState,
    ui: {
        addLog: mockLog,
        updateUI: mockUpdateUI,
        showDialog: mockShowDialog
    }
};

describe('Achievements System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.credits = 100;
        mockState.character.level = 1;
        mockState.inventory = [];
        mockState.achievements = [];
        mockState.stats = {};
        
        initAchievements(mockDeps);
    });

    test('unlockAchievement awards credits and items, and prevents duplicate unlocks', () => {
        // Unlock "First Blood" (Reward: 100 cr)
        unlockAchievement("first_blood");
        expect(mockState.achievements).toContain("first_blood");
        expect(mockState.character.credits).toBe(200); // 100 base + 100 reward
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("First Blood"));
        expect(mockShowDialog).toHaveBeenCalled();
        expect(mockUpdateUI).toHaveBeenCalled();

        // Attempt duplicate unlock
        jest.clearAllMocks();
        unlockAchievement("first_blood");
        expect(mockState.character.credits).toBe(200); // No double pay
        expect(mockLog).not.toHaveBeenCalled();
        expect(mockUpdateUI).not.toHaveBeenCalled();
    });

    test('unlockAchievement awards items correctly', () => {
        // Unlock "Wreckage Scavenger" (Reward: 200 cr, 2x Scrap Metal)
        unlockAchievement("wreckage_scavenger");
        expect(mockState.achievements).toContain("wreckage_scavenger");
        expect(mockState.character.credits).toBe(300); // 100 base + 200 reward
        expect(mockState.inventory.filter(i => i === "Scrap Metal").length).toBe(2);
    });

    test('checkAchievement combat category evaluations', () => {
        mockState.stats.enemiesDefeated = 1;
        checkAchievement("combat");
        expect(mockState.achievements).toContain("first_blood");

        // 10 enemies defeated
        mockState.stats.enemiesDefeated = 10;
        checkAchievement("combat");
        expect(mockState.achievements).toContain("galaxy_gladiator");

        // Boss defeat
        mockState.stats.bossesDefeated = 1;
        checkAchievement("combat");
        expect(mockState.achievements).toContain("boss_slayer");
    });

    test('checkAchievement level category evaluations', () => {
        mockState.character.level = 5;
        checkAchievement("level");
        expect(mockState.achievements).toContain("elite_soldier");

        mockState.character.level = 10;
        checkAchievement("level");
        expect(mockState.achievements).toContain("veteran_commander");
    });

    test('checkAchievement craft, travel, and equip categories', () => {
        // Craft
        mockState.stats.itemsCrafted = 5;
        checkAchievement("craft");
        expect(mockState.achievements).toContain("master_craftsman");

        // Travel
        checkAchievement("travel", { locationId: "xylo_delta" });
        expect(mockState.achievements).toContain("space_cadet");

        // Equip
        checkAchievement("equip", { rarity: "Legendary" });
        expect(mockState.achievements).toContain("legendary_gear");
    });
});
