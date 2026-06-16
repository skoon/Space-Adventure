import { initShip, upgradeModule, getUpgradeCost, canAffordUpgrade, shipModules, triggerSpaceCombatEvent, applyShipDamage } from '../../systems/ship.js';

// Mock dependencies
const mockLog = jest.fn();
const mockUpdateUI = jest.fn();
const mockShowDialog = jest.fn();
const mockGainXp = jest.fn();

const mockState = {
    character: {
        credits: 1000,
        hp: 100,
        maxHp: 100,
        energy: 50,
        maxEnergy: 50,
        ship: {
            engineLevel: 1,
            medbayLevel: 0,
            cargoLevel: 0,
            scannerLevel: 0,
            shieldLevel: 0,
            weaponsLevel: 0,
            shields: 0,
            maxShields: 0
        }
    },
    inventory: ["Circuit Board", "Circuit Board", "Energy Cell", "Scrap Metal", "Scrap Metal"]
};

const mockDeps = {
    state: mockState,
    ui: {
        addLog: mockLog,
        updateUI: mockUpdateUI,
        showDialog: mockShowDialog
    },
    character: {
        gainXp: mockGainXp
    }
};

describe('Ship Module Upgrades and Combat Events', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character.credits = 1000;
        mockState.character.hp = 100;
        mockState.character.energy = 50;
        mockState.character.ship = {
            engineLevel: 1,
            medbayLevel: 0,
            cargoLevel: 0,
            scannerLevel: 0,
            shieldLevel: 0,
            weaponsLevel: 0,
            shields: 0,
            maxShields: 0
        };
        mockState.inventory = ["Circuit Board", "Circuit Board", "Energy Cell", "Scrap Metal", "Scrap Metal"];
        
        initShip(mockDeps);
    });

    test('canAffordUpgrade returns true when player has enough credits and materials', () => {
        const cost = { credits: 250, materials: { "Circuit Board": 2, "Energy Cell": 1 } };
        expect(canAffordUpgrade(cost)).toBe(true);
        
        const expensiveCost = { credits: 2000, materials: {} };
        expect(canAffordUpgrade(expensiveCost)).toBe(false);
    });

    test('upgradeModule upgrades Deflector Shields and recharges shields', () => {
        const success = upgradeModule('shield');
        expect(success).toBe(true);
        expect(mockState.character.ship.shieldLevel).toBe(1);
        expect(mockState.character.ship.maxShields).toBe(50);
        expect(mockState.character.ship.shields).toBe(50);
        expect(mockState.character.credits).toBe(750); // 1000 - 250
        expect(mockState.inventory).not.toContain("Energy Cell");
    });

    test('applyShipDamage drains shields first, then character HP', () => {
        mockState.character.ship.shieldLevel = 1;
        mockState.character.ship.maxShields = 50;
        mockState.character.ship.shields = 30;

        // Damage within shields
        let result = applyShipDamage(20);
        expect(result.shieldDmg).toBe(20);
        expect(result.hullDmg).toBe(0);
        expect(mockState.character.ship.shields).toBe(10);
        expect(mockState.character.hp).toBe(100);

        // Damage exceeding shields
        result = applyShipDamage(30);
        expect(result.shieldDmg).toBe(10);
        expect(result.hullDmg).toBe(10); // (30 - 10) / 2 = 10 HP damage
        expect(mockState.character.ship.shields).toBe(0);
        expect(mockState.character.hp).toBe(90);
    });

    test('triggerSpaceCombatEvent launches dialogue options and triggers callback on completion', () => {
        const onComplete = jest.fn();
        
        triggerSpaceCombatEvent({ id: 'terra_prime' }, onComplete);
        
        expect(mockShowDialog).toHaveBeenCalled();
        const callArgs = mockShowDialog.mock.calls[0];
        
        // title, text, options
        expect(callArgs[0]).toBeDefined(); // Title
        expect(callArgs[1]).toBeDefined(); // Text
        expect(Array.isArray(callArgs[2])).toBe(true); // Options array
        
        // Simulate clicking one option that proceeds (e.g., Evasive Maneuvers)
        const option = callArgs[2][1]; 
        option.action();
        
        // Evasive maneuvers should trigger a nested showDialog for outcome
        expect(mockShowDialog).toHaveBeenCalledTimes(2);
        const outcomeCallArgs = mockShowDialog.mock.calls[1];
        
        // Trigger outcome proceed
        outcomeCallArgs[2][0].action();
        expect(onComplete).toHaveBeenCalled();
    });
});
