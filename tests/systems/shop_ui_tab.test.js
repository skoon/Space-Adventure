
// Mock DOM
document.body.innerHTML = `
<div id="shopScreen"></div>
<div id="shopCreditsDisplay"></div>
<div id="shopBuyContainer"></div>
<div id="shopSellContainer"></div>
<div id="shopTabBuy"></div>
<div id="shopTabSell"></div>
`;

import { initShopUI, showShop, updateShopUI } from '../../systems/ui/shop-ui.js';

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

test('window.switchShopTab is defined and works', () => {
    // Initialize
    initShopUI(mockDeps, mockUpdateUI);
    
    // Check global
    expect(typeof window.switchShopTab).toBe('function');
    
    // Call it
    window.switchShopTab('sell');
    
    // Verify UI switched
    const sellTab = document.getElementById("shopTabSell");
    expect(sellTab.className).toContain('text-yellow-500'); // Active class part
});
