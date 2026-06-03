import {
    initUpgrades,
    parseItemUpgrade,
    registerUpgradedItem,
    restoreSavedUpgradedItems,
    getUpgradeRequirements,
    upgradeItem
} from '../../systems/upgrades.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();

const mockItems = {
    "Laser Blade": { type: "weapon", category: "equipment", stats: { attack: 7 }, description: "Laser blade description", price: 100 },
    "Kevlar Vest": { type: "armor", category: "equipment", stats: { defense: 4 }, description: "Kevlar vest description", price: 200 },
    "Targeting HUD": { type: "accessory", category: "equipment", stats: { attack: 3, defense: 1 }, description: "HUD description", price: 150 },
    "Energy Cell": { type: "consumable", category: "consumable", effect: "heal", value: 30, price: 50 },
    "Scrap Metal": { type: "material", category: "material", price: 20 },
    "Rusty Pipe": { type: "material", category: "material", price: 10 }
};

const mockState = {
    character: {
        credits: 500,
        equipment: {
            weapon: "Laser Blade",
            armor: null,
            accessory: null
        }
    },
    inventory: ["Scrap Metal", "Scrap Metal", "Rusty Pipe", "Energy Cell"]
};

const mockDeps = {
    state: mockState,
    data: {
        items: mockItems
    },
    ui: {
        addLog: mockLog,
        updateUI: mockUpdateUI
    }
};

describe('Equipment Upgrades System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.credits = 500;
        mockState.character.equipment.weapon = "Laser Blade";
        mockState.character.equipment.armor = null;
        mockState.character.equipment.accessory = null;
        mockState.inventory = ["Scrap Metal", "Scrap Metal", "Rusty Pipe", "Energy Cell"];
        
        // Re-inject catalog defaults to clean up dynamic items
        Object.keys(mockItems).forEach(key => {
            if (key.includes('+')) delete mockItems[key];
        });

        initUpgrades(mockDeps);
    });

    test('parseItemUpgrade parses base names and levels', () => {
        expect(parseItemUpgrade("Laser Blade")).toBeNull();
        expect(parseItemUpgrade("Laser Blade +1")).toEqual({ baseName: "Laser Blade", upgradeLevel: 1 });
        expect(parseItemUpgrade("Laser Blade [Rare] +5")).toEqual({ baseName: "Laser Blade [Rare]", upgradeLevel: 5 });
    });

    test('registerUpgradedItem registers and scales stats & prices', () => {
        const name1 = registerUpgradedItem("Laser Blade", 1);
        expect(name1).toBe("Laser Blade +1");
        expect(mockItems["Laser Blade +1"]).toBeDefined();
        expect(mockItems["Laser Blade +1"].stats.attack).toBe(9); // 7 + 2
        expect(mockItems["Laser Blade +1"].price).toBe(130); // 100 * 1.3

        const name2 = registerUpgradedItem("Kevlar Vest", 2);
        expect(name2).toBe("Kevlar Vest +2");
        expect(mockItems["Kevlar Vest +2"].stats.defense).toBe(8); // 4 + 4
        expect(mockItems["Kevlar Vest +2"].price).toBe(320); // 200 * 1.6
    });

    test('getUpgradeRequirements returns accurate cost and materials', () => {
        const reqs = getUpgradeRequirements("Laser Blade");
        expect(reqs).not.toBeNull();
        expect(reqs.currentLevel).toBe(0);
        expect(reqs.nextLevel).toBe(1);
        expect(reqs.credits).toBe(150);
        expect(reqs.materials).toEqual({ "Scrap Metal": 2, "Rusty Pipe": 1 });

        // Non-upgradable
        expect(getUpgradeRequirements("Energy Cell")).toBeNull();
    });

    test('upgradeItem successfully upgrades inventory items and deducts assets', () => {
        // Upgrade "Laser Blade" at inventory index 3 (stub item)
        mockState.inventory.push("Laser Blade");
        const itemIdx = mockState.inventory.indexOf("Laser Blade");

        const success = upgradeItem("inventory", itemIdx);
        expect(success).toBe(true);
        expect(mockState.character.credits).toBe(350); // 500 - 150
        expect(mockState.inventory).toContain("Laser Blade +1");
        expect(mockState.inventory).not.toContain("Scrap Metal"); // materials consumed
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Upgraded"));
        expect(mockUpdateUI).toHaveBeenCalled();
    });

    test('upgradeItem successfully upgrades equipped items', () => {
        const success = upgradeItem("equipment", "weapon");
        expect(success).toBe(true);
        expect(mockState.character.equipment.weapon).toBe("Laser Blade +1");
        expect(mockState.character.credits).toBe(350);
    });

    test('upgradeItem fails if lacking credits or materials', () => {
        mockState.character.credits = 10;
        const success = upgradeItem("equipment", "weapon");
        expect(success).toBe(false);
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Insufficient credits"));
    });

    test('restoreSavedUpgradedItems dynamically loads items on game load', () => {
        const inventory = ["Laser Blade +2"];
        const equipment = { armor: "Kevlar Vest +1" };

        restoreSavedUpgradedItems(inventory, equipment);

        expect(mockItems["Laser Blade +2"]).toBeDefined();
        expect(mockItems["Laser Blade +2"].stats.attack).toBe(11); // 7 + 4
        expect(mockItems["Kevlar Vest +1"]).toBeDefined();
        expect(mockItems["Kevlar Vest +1"].stats.defense).toBe(6); // 4 + 2
    });
});
