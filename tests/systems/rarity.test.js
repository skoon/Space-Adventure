import { 
    rollRarity, 
    registerRarityItem, 
    parseItemRarity, 
    restoreSavedRarityItems, 
    getRarityColorClass 
} from '../../systems/rarity.js';
import { items } from '../../data/items.js';

describe('Rarity System', () => {
    // Keep a backup of items database to restore it after tests
    let originalItems;

    beforeAll(() => {
        originalItems = { ...items };
    });

    afterEach(() => {
        // Clean up any dynamically registered rarity items from items mapping
        Object.keys(items).forEach(key => {
            if (!originalItems[key]) {
                delete items[key];
            }
        });
    });

    test('registerRarityItem creates Rare variant with +30% stats and 1.5x price', () => {
        // We know Plasma Rifle has attack: 5, price: 500
        const registeredName = registerRarityItem('Plasma Rifle', 'Rare');
        
        expect(registeredName).toBe('Plasma Rifle [Rare]');
        expect(items[registeredName]).toBeDefined();
        
        const rareWeapon = items[registeredName];
        expect(rareWeapon.rarity).toBe('Rare');
        expect(rareWeapon.price).toBe(Math.round(500 * 1.5));
        
        // Attack should be 5 + Math.max(1, Math.round(5 * 0.3)) = 5 + 2 = 7
        expect(rareWeapon.stats.attack).toBe(7);
    });

    test('registerRarityItem creates Epic variant with +60% stats and 2.2x price', () => {
        const registeredName = registerRarityItem('Plasma Rifle', 'Epic');
        
        expect(registeredName).toBe('Plasma Rifle [Epic]');
        const epicWeapon = items[registeredName];
        expect(epicWeapon.rarity).toBe('Epic');
        expect(epicWeapon.price).toBe(Math.round(500 * 2.2));
        
        // Attack should be 5 + Math.max(2, Math.round(5 * 0.6)) = 5 + 3 = 8
        expect(epicWeapon.stats.attack).toBe(8);
    });

    test('registerRarityItem creates Legendary variant with +100% stats and 4.0x price', () => {
        const registeredName = registerRarityItem('Plasma Rifle', 'Legendary');
        
        expect(registeredName).toBe('Plasma Rifle [Legendary]');
        const legendaryWeapon = items[registeredName];
        expect(legendaryWeapon.rarity).toBe('Legendary');
        expect(legendaryWeapon.price).toBe(Math.round(500 * 4.0));
        
        // Attack: 5 + Math.max(3, Math.round(5 * 1.0)) = 5 + 5 = 10
        expect(legendaryWeapon.stats.attack).toBe(10);
    });

    test('rollRarity returns base item for non-equippables', () => {
        const result = rollRarity('Energy Cell');
        expect(result).toBe('Energy Cell');
    });

    test('rollRarity with high bonusChance rolls Rare, Epic, or Legendary', () => {
        // With bonusChance = 1, Math.random() - 1 will always be <= 0.03
        // This should always result in a Legendary weapon
        const result = rollRarity('Plasma Rifle', 1.0);
        expect(result).toBe('Plasma Rifle [Legendary]');
    });

    test('parseItemRarity parses valid rarity items correctly', () => {
        const parsed = parseItemRarity('Laser Blade [Epic]');
        expect(parsed).toEqual({ baseName: 'Laser Blade', rarity: 'Epic' });

        const invalidParsed = parseItemRarity('Laser Blade');
        expect(invalidParsed).toBeNull();
    });

    test('restoreSavedRarityItems registers saved rarity items in catalog', () => {
        const mockInventory = ['Energy Cell', 'Laser Blade [Rare]'];
        const mockEquipment = {
            weapon: 'Plasma Rifle [Legendary]',
            armor: null
        };

        restoreSavedRarityItems(mockInventory, mockEquipment);

        expect(items['Laser Blade [Rare]']).toBeDefined();
        expect(items['Plasma Rifle [Legendary]']).toBeDefined();
        expect(items['Laser Blade [Rare]'].rarity).toBe('Rare');
        expect(items['Plasma Rifle [Legendary]'].rarity).toBe('Legendary');
    });

    test('getRarityColorClass returns correct class name', () => {
        expect(getRarityColorClass('Rare')).toBe('text-blue-400');
        expect(getRarityColorClass('Epic')).toBe('text-purple-400');
        expect(getRarityColorClass('Legendary')).toBe('text-yellow-500');
        expect(getRarityColorClass('Common')).toBe('text-gray-200');
    });
});
