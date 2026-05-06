import { SKILL_TREES, initSkills, hasSkill, getPassiveBonus, unlockSkill } from '../../systems/skills.js';

const mockState = {
    character: {
        role: 'Warrior',
        skillPoints: 2,
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

describe('Skills System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.character = {
            role: 'Warrior',
            skillPoints: 2,
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

    test('hasSkill returns correctly', () => {
        expect(hasSkill('warrior_toughness')).toBe(false);
        mockState.character.unlockedSkills.push('warrior_toughness');
        expect(hasSkill('warrior_toughness')).toBe(true);
    });

    test('getPassiveBonus calculates bonuses for unlocked skills', () => {
        expect(getPassiveBonus('defense')).toBe(0);
        
        mockState.character.unlockedSkills.push('warrior_toughness');
        expect(getPassiveBonus('defense')).toBe(5);
    });

    test('unlockSkill deducts SP and unlocks skill', () => {
        const result = unlockSkill('warrior_toughness');
        
        expect(result.success).toBe(true);
        expect(mockState.character.skillPoints).toBe(1);
        expect(mockState.character.unlockedSkills).toContain('warrior_toughness');
        expect(mockUi.updateUI).toHaveBeenCalled();
        expect(mockUi.addLog).toHaveBeenCalled();
    });

    test('unlockSkill enforces prerequisites', () => {
        // Try to unlock tier 2 without tier 1
        const result = unlockSkill('warrior_adrenaline');
        expect(result.success).toBe(false);
        expect(result.message).toContain('Prerequisite');
        expect(mockState.character.skillPoints).toBe(2);
        
        // Unlock tier 1
        unlockSkill('warrior_toughness');
        
        // Now try tier 2
        const result2 = unlockSkill('warrior_adrenaline');
        expect(result2.success).toBe(true);
        expect(mockState.character.skillPoints).toBe(0); // 2 - 1 - 1
        expect(mockState.character.maxAp).toBe(4); // Bonus applied immediately
    });

    test('unlockSkill fails when not enough SP', () => {
        mockState.character.skillPoints = 0;
        const result = unlockSkill('warrior_toughness');
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('Not enough Skill Points');
    });
});
