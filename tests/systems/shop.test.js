import { initShop, buyItem, sellItem, getItemPrice, getItemSellPrice } from '../../systems/shop.js';

const mockState = {
    character: { credits: 100 },
    inventory: []
};

const mockItems = {
    "Health Potion": { price: 20 },
    "Sword": { price: 50 },
    "Unknown Item": {} // No price defined, should default to 10
};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn()
};

describe('Shop System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.credits = 100;
        mockState.inventory = [];

        initShop({
            state: mockState,
            data: { items: mockItems },
            ui: mockUi
        });
    });

    test('getItemPrice returns correct price', () => {
        expect(getItemPrice("Health Potion")).toBe(20);
        expect(getItemPrice("Unknown Item")).toBe(10); // Default
    });

    test('getItemSellPrice returns half price', () => {
        expect(getItemSellPrice("Health Potion")).toBe(10);
        expect(getItemSellPrice("Sword")).toBe(25);
    });

    test('buyItem deducts credits and adds item', () => {
        const result = buyItem("Health Potion");

        expect(result).toBe(true);
        expect(mockState.character.credits).toBe(80); // 100 - 20
        expect(mockState.inventory).toContain("Health Potion");
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Bought'));
        expect(mockUi.updateUI).toHaveBeenCalled();
    });

    test('buyItem fails if not enough credits', () => {
        mockState.character.credits = 10;
        const result = buyItem("Sword"); // Costs 50

        expect(result).toBe(false);
        expect(mockState.character.credits).toBe(10);
        expect(mockState.inventory).not.toContain("Sword");
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Not enough credits'));
    });

    test('sellItem removes item and adds credits', () => {
        mockState.inventory = ["Sword"];
        const result = sellItem("Sword");

        expect(result).toBe(true);
        expect(mockState.character.credits).toBe(125); // 100 + 25
        expect(mockState.inventory).not.toContain("Sword");
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Sold'));
        expect(mockUi.updateUI).toHaveBeenCalled();
    });

    test('sellItem fails if item not in inventory', () => {
        const result = sellItem("NonExistentItem");

        expect(result).toBe(false);
        expect(mockState.character.credits).toBe(100);
    });
});
