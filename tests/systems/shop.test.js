import { initShop, buyItem, sellItem, getItemPrice, getItemSellPrice, orderItem, claimOrder, claimAllOrders } from '../../systems/shop.js';

const mockState = {
    character: { credits: 100, pendingOrders: [] },
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
        mockState.character.pendingOrders = [];
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

    // Photon Prime Online Ordering Tests

    test('orderItem deducts credits and adds to pendingOrders', () => {
        const result = orderItem("Health Potion");

        expect(result).toBe(true);
        expect(mockState.character.credits).toBe(80);
        expect(mockState.character.pendingOrders).toContain("Health Potion");
        expect(mockState.inventory).not.toContain("Health Potion"); // Not in inventory yet
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Ordered'));
    });

    test('orderItem fails if not enough credits', () => {
        mockState.character.credits = 10;
        const result = orderItem("Sword");

        expect(result).toBe(false);
        expect(mockState.character.pendingOrders).toHaveLength(0);
    });

    test('orderItem fails if max pending orders reached', () => {
        mockState.character.pendingOrders = ["Item1", "Item2", "Item3"];
        const result = orderItem("Health Potion");

        expect(result).toBe(false);
        expect(mockState.character.pendingOrders).toHaveLength(3);
        expect(mockState.character.credits).toBe(100); // No deduction
    });

    test('claimOrder moves item from pending to inventory', () => {
        mockState.character.pendingOrders = ["Sword"];
        const result = claimOrder("Sword");

        expect(result).toBe(true);
        expect(mockState.character.pendingOrders).toHaveLength(0);
        expect(mockState.inventory).toContain("Sword");
        expect(mockUi.addLog).toHaveBeenCalledWith(expect.stringContaining('Collected'));
    });

    test('claimAllOrders moves all items from pending to inventory', () => {
        mockState.character.pendingOrders = ["Sword", "Health Potion"];
        const result = claimAllOrders();

        expect(result).toHaveLength(2);
        expect(mockState.character.pendingOrders).toHaveLength(0);
        expect(mockState.inventory).toContain("Sword");
        expect(mockState.inventory).toContain("Health Potion");
    });
});
