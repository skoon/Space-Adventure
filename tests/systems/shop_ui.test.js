
// Mock DOM
document.body.innerHTML = `
<div id="shopScreen"></div>
<div id="shopCreditsDisplay"></div>
<div id="shopBuyContainer"></div>
<div id="shopSellContainer"></div>
<div id="shopTabBuy"></div>
<div id="shopTabSell"></div>
`;

import { initShopUI, showShop, updateShopUI, switchShopTab } from '../../systems/ui/shop-ui.js';

// Mock dependencies
const mockState = {
    character: { credits: 100 },
    inventory: ['Energy Cell']
};

const mockItems = {
    'Energy Cell': { price: 10, description: 'Power' }
};

const mockShop = {
    buyItem: jest.fn(),
    sellItem: jest.fn().mockReturnValue(true),
    getItemPrice: jest.fn().mockReturnValue(10),
    getItemSellPrice: jest.fn().mockReturnValue(5),
    orderItem: jest.fn()
};

const mockDeps = {
    state: mockState,
    data: { items: mockItems },
    shop: mockShop
};

const mockUpdateUI = jest.fn();

test('sell button calls window.sellItemToShop and mock sellItem', () => {
    // Initialize
    initShopUI(mockDeps, mockUpdateUI);
    
    // Switch to sell tab
    switchShopTab('sell');
    
    // Verify UI rendered
    const sellContainer = document.getElementById("shopSellContainer");
    expect(sellContainer.innerHTML).toContain('Energy Cell');
    expect(sellContainer.innerHTML).toContain('Sell: 5 cr');
    
    // Find button
    // The button has onclick="window.sellItemToShop('Energy Cell')"
    // We can't easily click it via jest click dispatch because the handler is on window property, 
    // and jsdom might not execute string attributes the same way? 
    // Actually jsdom does not execute inline event handlers by default if inserted via innerHTML?
    // Correct. JSDOM doesn't execute inline scripts.
    
    // So we manually invoke the global function.
    expect(typeof window.sellItemToShop).toBe('function');
    
    window.sellItemToShop('Energy Cell');
    
    expect(mockShop.sellItem).toHaveBeenCalledWith('Energy Cell');
    expect(mockUpdateUI).toHaveBeenCalled();
});
