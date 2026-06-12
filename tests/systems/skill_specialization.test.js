import { SKILL_TREES, initSkills, hasSkill, getPassiveBonus, unlockSkill } from '../../systems/skills.js';

const mockState = {
    character: {
        role: 'Warrior',
        skillPoints: 10,
        unlockedSkills: [],
        hp: 100,
        maxHp: 100,
        energy: 50,
        maxEnergy: 50,
        ap: 3,
        maxAp: 3
    }
};

const mockUi = {
    addLog: jest.fn(),
    updateUI: jest.fn()
};

describe('Skills Specializations System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character = {
            role: 'Warrior',
            skillPoints: 10,
            unlockedSkills: [],
            hp: 100,
            maxHp: 100,
            energy: 50,
            maxEnergy: 50,
            ap: 3,
            maxAp: 3
        };

        initSkills({
            state: mockState,
            ui: mockUi
        });
    });

    test('can unlock Warrior Berserker path sequentially', () => {
        // Unlock Tier 1: Heavy Strikes
        let res = unlockSkill('warrior_heavy_strikes');
        expect(res.success).toBe(true);
        expect(getPassiveBonus('attack')).toBe(5);

        // Try Tier 3 directly (should fail due to prereq)
        let res3 = unlockSkill('warrior_whirlwind');
        expect(res3.success).toBe(false);

        // Unlock Tier 2: Bloodlust
        let res2 = unlockSkill('warrior_bloodlust');
        expect(res2.success).toBe(true);
        expect(getPassiveBonus('attack')).toBe(10);
        expect(getPassiveBonus('healOnKill')).toBe(10);

        // Now Tier 3 Whirlwind should unlock
        let res3Ok = unlockSkill('warrior_whirlwind');
        expect(res3Ok.success).toBe(true);
    });

    test('can unlock Warrior Vanguard path sequentially', () => {
        // Unlock Tier 1: Toughness
        let res = unlockSkill('warrior_toughness');
        expect(res.success).toBe(true);
        expect(getPassiveBonus('defense')).toBe(5);

        // Unlock Tier 2: Adrenaline
        let res2 = unlockSkill('warrior_adrenaline');
        expect(res2.success).toBe(true);
        expect(mockState.character.maxAp).toBe(4);

        // Unlock Tier 3: Shield Wall
        let res3 = unlockSkill('warrior_shield_wall');
        expect(res3.success).toBe(true);
    });

    test('Rogue Specializations work', () => {
        mockState.character.role = 'Rogue';

        // Assassin Path: Lethality -> Opportunist -> Shadow Strike
        expect(unlockSkill('rogue_lethality').success).toBe(true);
        expect(getPassiveBonus('critChance')).toBe(0.15);

        expect(unlockSkill('rogue_opportunist').success).toBe(true);
        expect(getPassiveBonus('opportunistDmg')).toBe(0.20);

        expect(unlockSkill('rogue_shadowstrike').success).toBe(true);

        // Infiltrator Path: Evasion -> Fleeting Shadow -> Smoke Bomb
        expect(unlockSkill('rogue_evasion').success).toBe(true);
        expect(getPassiveBonus('dodgeChance')).toBe(0.10);

        expect(unlockSkill('rogue_fleeting_shadow').success).toBe(true);
        expect(getPassiveBonus('dodgeRefund')).toBe(1);

        expect(unlockSkill('rogue_smoke_bomb').success).toBe(true);
    });

    test('Scientist Specializations work', () => {
        mockState.character.role = 'Scientist';

        // Technomancer: Energy Matrix -> Overload Boost -> Overload
        expect(unlockSkill('sci_energymatrix').success).toBe(true);
        expect(getPassiveBonus('maxEnergy')).toBe(20);
        expect(getPassiveBonus('energyRegen')).toBe(5);

        expect(unlockSkill('sci_overload_boost').success).toBe(true);
        expect(getPassiveBonus('plasmaDmgMultiplier')).toBe(0.20);

        expect(unlockSkill('sci_overload').success).toBe(true);

        // Biotech: Field Medic -> Nanite Repair -> Acid Spray
        expect(unlockSkill('sci_fieldmedic').success).toBe(true);
        expect(getPassiveBonus('healMultiplier')).toBe(0.5);

        expect(unlockSkill('sci_nanite_repair').success).toBe(true);
        expect(unlockSkill('sci_acid_spray').success).toBe(true);
    });
});
