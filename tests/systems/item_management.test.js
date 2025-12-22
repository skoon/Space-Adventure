import { createInventoryItemButton } from '../../systems/ui.js';

describe('Item Management UI', () => {
    // Mock the applyQuestItem global function since it's used in onclick
    global.applyQuestItem = jest.fn();
    
    // Mock import
    // Jest's dynamic import mocking is tricky. For unit testing the button structure, we can verify the button properties and click handler presence.
    
    test('createInventoryItemButton creates button with correct structure', () => {
        const item = {
            type: "consumable",
            description: "A test item",
            value: 10,
            effect: "heal"
        };
        
        const button = createInventoryItemButton("TestItem", 2, item);
        
        expect(button.tagName).toBe('BUTTON');
        expect(button.className).toContain('inventory-item');
        
        // check quantity badge
        expect(button.innerHTML).toContain('×2');
        
        // check tooltip presence
        const tooltip = button.querySelector('div');
        expect(tooltip).not.toBeNull();
        expect(tooltip.innerHTML).toContain('TestItem');
        expect(tooltip.innerHTML).toContain('A test item');
        expect(tooltip.innerHTML).toContain('Restores 10 HP');
    });

    test('Quantity badge not shown for single item', () => {
        const item = { type: "material" };
        const button = createInventoryItemButton("SingleItem", 1, item);
        
        expect(button.innerHTML).not.toContain('×1'); // Should not show badge for 1
        expect(button.innerHTML).toContain('SingleItem');
    });

    // We can't easily test the click behavior involving dynamic imports in this simple Jest setup without heavier mocking
    // but verifying structure ensures the UI changes are likely correct.
});
