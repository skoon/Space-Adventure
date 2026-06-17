// Mock notifications system to avoid state leak between tests
jest.mock('../../systems/ui/notifications.js', () => {
    return {
        showDialog: jest.fn((title, text, options) => {
            const doc = global.document;
            const modal = doc.getElementById('dialogModal');
            if (modal) modal.style.display = 'flex';
            
            const titleEl = doc.getElementById('dialogTitle');
            if (titleEl) titleEl.textContent = title;
            
            const textEl = doc.getElementById('dialogText');
            if (textEl) textEl.innerHTML = text;
            
            const optionsContainer = doc.getElementById('dialogOptions');
            if (optionsContainer) {
                optionsContainer.innerHTML = '';
                options.forEach(opt => {
                    const btn = doc.createElement('button');
                    btn.textContent = opt.text;
                    btn.onclick = () => {
                        if (opt.action) opt.action();
                    };
                    optionsContainer.appendChild(btn);
                });
            }
        }),
        hideDialog: jest.fn(() => {
            const modal = global.document.getElementById('dialogModal');
            if (modal) modal.style.display = 'none';
        }),
        showLevelUpNotification: jest.fn(),
        hideLevelUpNotification: jest.fn(),
        showVictoryMessage: jest.fn(),
        showSaveMessage: jest.fn()
    };
});

import { showSaveLoadUI } from '../../systems/ui/saveload-ui.js';
import { initSaveLoad } from '../../systems/saveload.js';

let mockState;
let mockUi;
let mockCombat;

// Setup Mock DOM
beforeEach(() => {
    document.body.innerHTML = `
        <div id="dialogModal" style="display: none;">
            <div id="dialogTitle"></div>
            <div id="dialogText"></div>
            <div id="dialogOptions"></div>
        </div>
        <div id="nameInput"></div>
        <div id="missionLog"></div>
        <div id="exitHeaderBtn" style="display: none;"></div>
        <div id="loadGameButton" style="display: none;"></div>
    `;

    // Mock localStorage
    let store = {};
    const mockLocalStorage = {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, val) => { store[key] = val.toString(); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
    Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
    });

    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);

    mockState = {
        gameState: 'start',
        character: null,
        inventory: [],
        enemy: null,
        log: [],
        playerStatusEffects: [],
        enemyStatusEffects: [],
        activeSaveSlot: null,
        currentLocation: 'terra_prime'
    };

    mockUi = {
        addLog: jest.fn(),
        showSaveMessage: jest.fn(),
        showScreen: jest.fn(),
        updateUI: jest.fn()
    };

    mockCombat = {
        updateCombatUI: jest.fn()
    };

    initSaveLoad({
        state: mockState,
        ui: mockUi,
        combat: mockCombat
    });
});

describe('SaveLoad UI System - Start New Game Mode', () => {
    test('showSaveLoadUI in newgame mode renders slot title and layout', (done) => {
        // Mock save slot 1 as populated, slot 2 as empty
        const charData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            gameState: 'exploring',
            character: { name: 'Commander Shepard', level: 5, role: 'Rogue' },
            currentLocation: 'xylo_delta'
        };
        localStorage.setItem('galacticOdyssey_save', JSON.stringify(charData));

        showSaveLoadUI('newgame');

        // Allow setTimeout in showSaveLoadUI to complete
        setTimeout(() => {
            const title = document.getElementById('dialogTitle').textContent;
            expect(title).toBe('Start New Game');

            const container = document.getElementById('saveLoadSlotsContainer');
            expect(container).toBeTruthy();

            // Slot 1 is populated (Overwrite button)
            const slot1Html = container.innerHTML;
            expect(slot1Html).toContain('Commander Shepard');
            expect(slot1Html).toContain('Level 5 Rogue');
            expect(slot1Html).toContain('Slot 1');
            expect(slot1Html).toContain('⚠️ Overwrite');

            // Slot 2 is empty (New Game button)
            expect(slot1Html).toContain('Slot 2');
            expect(slot1Html).toContain('Empty Slot');
            expect(slot1Html).toContain('🆕 New Game');

            done();
        }, 150);
    });

    test('clicking New Game on empty slot starts new game', (done) => {
        showSaveLoadUI('newgame');

        setTimeout(() => {
            const container = document.getElementById('saveLoadSlotsContainer');
            const newGameBtn = container.querySelector('#action-btn-2'); // Slot 2 empty
            expect(newGameBtn.textContent.trim()).toBe('🆕 New Game');

            newGameBtn.click();

            // Check that active save slot is set to 2
            expect(mockState.activeSaveSlot).toBe(2);

            done();
        }, 150);
    });

    test('clicking Overwrite on populated slot shows warning and starts game if confirmed', (done) => {
        const charData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            gameState: 'exploring',
            character: { name: 'Commander Shepard', level: 5, role: 'Rogue' },
            currentLocation: 'xylo_delta'
        };
        localStorage.setItem('galacticOdyssey_save', JSON.stringify(charData));

        showSaveLoadUI('newgame');

        setTimeout(() => {
            const container = document.getElementById('saveLoadSlotsContainer');
            const overwriteBtn = container.querySelector('#action-btn-1'); // Slot 1 populated
            expect(overwriteBtn.textContent.trim()).toBe('⚠️ Overwrite');

            // Confirm is mocked to return true by default
            overwriteBtn.click();

            expect(window.confirm).toHaveBeenCalledWith(
                expect.stringContaining('Are you sure you want to overwrite Save Slot 1?')
            );
            expect(mockState.activeSaveSlot).toBe(1);

            done();
        }, 150);
    });

    test('clicking Overwrite on populated slot does not start game if cancel is clicked', (done) => {
        const charData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            gameState: 'exploring',
            character: { name: 'Commander Shepard', level: 5, role: 'Rogue' },
            currentLocation: 'xylo_delta'
        };
        localStorage.setItem('galacticOdyssey_save', JSON.stringify(charData));

        window.confirm.mockReturnValueOnce(false);

        showSaveLoadUI('newgame');

        setTimeout(() => {
            const container = document.getElementById('saveLoadSlotsContainer');
            const overwriteBtn = container.querySelector('#action-btn-1');

            overwriteBtn.click();

            expect(window.confirm).toHaveBeenCalled();
            // Should not set active slot (since it was canceled)
            expect(mockState.activeSaveSlot).toBeNull();

            done();
        }, 150);
    });
});
