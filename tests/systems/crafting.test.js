import { initCrafting, craftItem, discoverRecipe, getKnownRecipes, canCraft } from '../../systems/crafting.js';

const mockState = {
    character: { knownRecipes: {} },
    inventory: []
};

const mockItems = {
    "Health Potion": { price: 20 },
    "Herb": { price: 5 },
    "Vial": { price: 10 }
};

const mockRecipe = {
    id: "test_potion",
    name: "Health Potion",
    creates: "Health Potion",
    requires: {
        "Herb": 2,
        "Vial": 1
    },
    description: "A healing potion"
};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn()
};

describe('Crafting System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.knownRecipes = {};
        mockState.inventory = [];

        initCrafting({
            state: mockState,
            data: { items: mockItems },
            ui: mockUi
        });
    });

    test('discoverRecipe adds recipe to known recipes', () => {
        const result = discoverRecipe("test_potion", mockRecipe);
        expect(result).toBe(true);
        expect(mockState.character.knownRecipes["test_potion"]).toEqual(mockRecipe);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Discovered recipe'));
    });

    test('discoverRecipe ignores duplicate recipes', () => {
        discoverRecipe("test_potion", mockRecipe);
        const result = discoverRecipe("test_potion", mockRecipe);
        expect(result).toBe(false);
        expect(mockUi.addLog).toHaveBeenCalledTimes(1); // Only logged once
    });

    test('canCraft returns true when materials are present', () => {
        discoverRecipe("test_potion", mockRecipe);
        mockState.inventory = ["Herb", "Herb", "Vial", "OtherItem"];
        expect(canCraft("test_potion")).toBe(true);
    });

    test('canCraft returns false when missing materials', () => {
        discoverRecipe("test_potion", mockRecipe);
        mockState.inventory = ["Herb", "Vial"]; // Missing one Herb
        expect(canCraft("test_potion")).toBe(false);
    });

    test('craftItem consumes materials and creates item', () => {
        discoverRecipe("test_potion", mockRecipe);
        mockState.inventory = ["Herb", "Herb", "Vial", "OtherItem"];
        
        const result = craftItem("test_potion");
        
        expect(result).toBe(true);
        expect(mockState.inventory).toContain("Health Potion");
        expect(mockState.inventory).toContain("OtherItem");
        expect(mockState.inventory.filter(i => i === "Herb").length).toBe(0);
        expect(mockState.inventory.filter(i => i === "Vial").length).toBe(0);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Crafted'));
    });

    test('craftItem fails if recipe unknown', () => {
        const result = craftItem("unknown_recipe");
        expect(result).toBe(false);
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('not known'));
    });

    test('craftItem fails if missing materials', () => {
        discoverRecipe("test_potion", mockRecipe);
        mockState.inventory = ["Herb"];
        
        const result = craftItem("test_potion");
        
        expect(result).toBe(false);
        expect(mockState.inventory).not.toContain("Health Potion");
        expect(mockState.inventory).toContain("Herb"); // Materials preserved
    });
});
