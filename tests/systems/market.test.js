import { 
    initMarket, 
    initializeMarketState, 
    rollMarketEvent, 
    buyCommodityExchange, 
    sellCommodityExchange, 
    BASE_COMMODITIES, 
    NEWS_EVENTS 
} from '../../systems/market.js';

const mockState = {
    character: { credits: 1000 },
    inventory: [],
    market: null
};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn()
};

describe('Market System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.credits = 1000;
        mockState.inventory = [];
        mockState.market = null;

        initMarket({
            state: mockState,
            ui: mockUi
        });
    });

    test('initializeMarketState sets up market prices and history', () => {
        initializeMarketState();
        expect(mockState.market).toBeDefined();
        expect(mockState.market.prices['Scrap Metal']).toBe(BASE_COMMODITIES['Scrap Metal']);
        expect(mockState.market.history['Scrap Metal']).toHaveLength(5);
        expect(mockState.market.history['Scrap Metal'][0]).toBe(BASE_COMMODITIES['Scrap Metal']);
    });

    test('rollMarketEvent changes prices and updates history', () => {
        initializeMarketState();
        const oldPrices = { ...mockState.market.prices };
        
        rollMarketEvent();
        
        expect(mockState.market.news).toBeDefined();
        expect(mockUi.addLog).toHaveBeenCalled();
        expect(mockUi.updateUI).toHaveBeenCalled();

        // Check that history has length 5 after shift/push
        Object.keys(BASE_COMMODITIES).forEach(itemName => {
            expect(mockState.market.history[itemName]).toHaveLength(5);
        });
    });

    test('buyCommodityExchange succeeds and deducts credits', () => {
        initializeMarketState();
        const price = mockState.market.prices['Scrap Metal'];
        const initialCredits = mockState.character.credits;

        const result = buyCommodityExchange('Scrap Metal', 2);

        expect(result).toBe(true);
        expect(mockState.character.credits).toBe(initialCredits - (price * 2));
        expect(mockState.inventory).toEqual(['Scrap Metal', 'Scrap Metal']);
        expect(mockUi.addLog).toHaveBeenCalled();
        expect(mockUi.updateUI).toHaveBeenCalled();
    });

    test('buyCommodityExchange fails if insufficient credits', () => {
        initializeMarketState();
        mockState.character.credits = 5; // not enough for scrap metal (20 cr)

        const result = buyCommodityExchange('Scrap Metal', 1);

        expect(result).toBe(false);
        expect(mockState.character.credits).toBe(5);
        expect(mockState.inventory).toHaveLength(0);
    });

    test('sellCommodityExchange succeeds and adds credits', () => {
        initializeMarketState();
        mockState.inventory = ['Scrap Metal', 'Titanium Ingot'];
        const price = mockState.market.prices['Scrap Metal'];
        const initialCredits = mockState.character.credits;

        const result = sellCommodityExchange('Scrap Metal', 1);

        expect(result).toBe(true);
        expect(mockState.character.credits).toBe(initialCredits + price);
        expect(mockState.inventory).toEqual(['Titanium Ingot']);
        expect(mockUi.addLog).toHaveBeenCalled();
        expect(mockUi.updateUI).toHaveBeenCalled();
    });

    test('sellCommodityExchange fails if commodity not in inventory', () => {
        initializeMarketState();
        mockState.inventory = ['Titanium Ingot'];
        const initialCredits = mockState.character.credits;

        const result = sellCommodityExchange('Scrap Metal', 1);

        expect(result).toBe(false);
        expect(mockState.character.credits).toBe(initialCredits);
        expect(mockState.inventory).toEqual(['Titanium Ingot']);
    });
});
