import { 
    initAttributesUI, 
    showStatsAllocationUI, 
    closeStatsAllocationUI, 
    allocateStat, 
    updateAttributesBtnGlow 
} from '../../systems/ui/attributes-ui.js';

describe('Attributes UI System', () => {
    let mockState;
    let mockDeps;

    beforeEach(() => {
        // Set up DOM elements that the UI updates
        document.body.innerHTML = `
            <div id="attributesModal" class="hidden"></div>
            <div id="attributesPointsDisplay"></div>
            <div id="allocCurrentMaxHp"></div>
            <div id="allocCurrentMaxEnergy"></div>
            <div id="allocCurrentAttack"></div>
            <div id="allocCurrentDefense"></div>
            <div id="attributesRoleRecommendation"></div>
            <button id="attributesBtn"></button>
        `;

        mockState = {
            character: {
                role: 'Warrior',
                level: 1,
                hp: 100,
                maxHp: 100,
                energy: 50,
                maxEnergy: 50,
                attack: 10,
                defense: 10,
                statPoints: 5
            }
        };

        mockDeps = {
            state: mockState,
            addLog: jest.fn(),
            updateUI: jest.fn()
        };

        initAttributesUI(mockDeps);
    });

    test('showStatsAllocationUI reveals the modal and populates recommendations', () => {
        const modal = document.getElementById("attributesModal");
        expect(modal.classList.contains('hidden')).toBe(true);

        showStatsAllocationUI();

        expect(modal.classList.contains('hidden')).toBe(false);
        expect(document.getElementById("attributesPointsDisplay").textContent).toBe("5");
        expect(document.getElementById("allocCurrentMaxHp").textContent).toBe("100");
        expect(document.getElementById("allocCurrentAttack").textContent).toBe("10");
        expect(document.getElementById("attributesRoleRecommendation").innerHTML).toContain("Warrior Recommendation");
    });

    test('closeStatsAllocationUI hides the modal and triggers updateUI', () => {
        const modal = document.getElementById("attributesModal");
        modal.classList.remove('hidden');

        closeStatsAllocationUI();

        expect(modal.classList.contains('hidden')).toBe(true);
        expect(mockDeps.updateUI).toHaveBeenCalled();
    });

    test('allocateStat increases HP/maxHp by 5 and consumes 1 statPoint', () => {
        const success = allocateStat('maxHp');

        expect(success).toBe(true);
        expect(mockState.character.maxHp).toBe(105);
        expect(mockState.character.hp).toBe(105);
        expect(mockState.character.statPoints).toBe(4);
        expect(mockDeps.addLog).toHaveBeenCalledWith(expect.stringContaining('Health Points'));
    });

    test('allocateStat increases attack by 1 and consumes 1 statPoint', () => {
        const success = allocateStat('attack');

        expect(success).toBe(true);
        expect(mockState.character.attack).toBe(11);
        expect(mockState.character.statPoints).toBe(4);
        expect(mockDeps.addLog).toHaveBeenCalledWith(expect.stringContaining('Attack'));
    });

    test('allocateStat fail when 0 points available', () => {
        mockState.character.statPoints = 0;
        const success = allocateStat('attack');

        expect(success).toBe(false);
        expect(mockState.character.attack).toBe(10);
        expect(mockDeps.addLog).toHaveBeenCalledWith(expect.stringContaining('No attribute points'));
    });

    test('updateAttributesBtnGlow adds count badge and shadow when points > 0', () => {
        mockState.character.statPoints = 3;
        updateAttributesBtnGlow();

        const btn = document.getElementById("attributesBtn");
        expect(btn.classList.contains('border-teal-400')).toBe(true);
        expect(btn.innerHTML).toContain('3');
    });

    test('updateAttributesBtnGlow removes badge and shadow when points === 0', () => {
        mockState.character.statPoints = 0;
        updateAttributesBtnGlow();

        const btn = document.getElementById("attributesBtn");
        expect(btn.classList.contains('border-teal-400')).toBe(false);
        expect(btn.innerHTML).not.toContain('badge');
    });
});
