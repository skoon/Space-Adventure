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

    test('legendary recipe: quantum_shield_core can be discovered and crafted with correct materials', () => {
        const quantumRecipe = {
            id: "quantum_shield_core",
            name: "Quantum Shield Core",
            creates: "Quantum Shield Core",
            requires: {
                "Quantum Chip": 2,
                "Plasma Core": 1,
                "Circuit Board": 3
            },
            description: "A legendary accessory that forms an impenetrable energy field."
        };
        
        discoverRecipe("quantum_shield_core", quantumRecipe);
        expect(mockState.character.knownRecipes["quantum_shield_core"]).toEqual(quantumRecipe);

        // Missing materials
        mockState.inventory = ["Quantum Chip", "Plasma Core", "Circuit Board", "Circuit Board"];
        expect(canCraft("quantum_shield_core")).toBe(false);
        expect(craftItem("quantum_shield_core")).toBe(false);

        // Sufficient materials
        mockState.inventory = [
            "Quantum Chip", "Quantum Chip", 
            "Plasma Core", 
            "Circuit Board", "Circuit Board", "Circuit Board",
            "Extra Stuff"
        ];
        expect(canCraft("quantum_shield_core")).toBe(true);
        
        const result = craftItem("quantum_shield_core");
        expect(result).toBe(true);
        const hasQuantumShieldCore = mockState.inventory.some(item => item.includes("Quantum Shield Core"));
        expect(hasQuantumShieldCore).toBe(true);
        expect(mockState.inventory).toContain("Extra Stuff");
        expect(mockState.inventory.filter(i => i === "Quantum Chip").length).toBe(0);
        expect(mockState.inventory.filter(i => i === "Plasma Core").length).toBe(0);
        expect(mockState.inventory.filter(i => i === "Circuit Board").length).toBe(0);
    });

    test('legendary recipe: plasma_targeting_hud can be discovered and crafted with correct materials', () => {
        const plasmaRecipe = {
            id: "plasma_targeting_hud",
            name: "Plasma Targeting HUD",
            creates: "Plasma Targeting HUD",
            requires: {
                "Quantum Chip": 1,
                "Plasma Core": 2,
                "Carbon Nanotubes": 4
            },
            description: "A legendary accessory that grants extreme tactical targeting data."
        };
        
        discoverRecipe("plasma_targeting_hud", plasmaRecipe);
        expect(mockState.character.knownRecipes["plasma_targeting_hud"]).toEqual(plasmaRecipe);

        // Missing materials
        mockState.inventory = ["Quantum Chip", "Plasma Core", "Carbon Nanotubes", "Carbon Nanotubes", "Carbon Nanotubes"];
        expect(canCraft("plasma_targeting_hud")).toBe(false);
        expect(craftItem("plasma_targeting_hud")).toBe(false);

        // Sufficient materials
        mockState.inventory = [
            "Quantum Chip", 
            "Plasma Core", "Plasma Core", 
            "Carbon Nanotubes", "Carbon Nanotubes", "Carbon Nanotubes", "Carbon Nanotubes",
            "Extra Stuff"
        ];
        expect(canCraft("plasma_targeting_hud")).toBe(true);
        
        const result = craftItem("plasma_targeting_hud");
        expect(result).toBe(true);
        const hasPlasmaTargetingHUD = mockState.inventory.some(item => item.includes("Plasma Targeting HUD"));
        expect(hasPlasmaTargetingHUD).toBe(true);
        expect(mockState.inventory).toContain("Extra Stuff");
        expect(mockState.inventory.filter(i => i === "Quantum Chip").length).toBe(0);
        expect(mockState.inventory.filter(i => i === "Plasma Core").length).toBe(0);
        expect(mockState.inventory.filter(i => i === "Carbon Nanotubes").length).toBe(0);
    });
});
