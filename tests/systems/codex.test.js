import {
    initCodex,
    ensureCodexState,
    unlockCodexEntry,
    markCodexRead,
    isCodexUnlocked,
    getCodexEntries,
    getCodexProgress
} from '../../systems/codex.js';
import {
    initCodexUI,
    showCodexUI,
    closeCodexUI,
    renderCodexModal,
    selectCodexEntry
} from '../../systems/ui/codex-ui.js';
import { codexEntries, CODEX_CATEGORIES } from '../../data/codex.js';
import { eventEmitter } from '../../systems/eventEmitter.js';
import { showDialogue, initDialogueUI } from '../../systems/ui/dialogue-ui.js';

describe('Codex System', () => {
    let mockState;
    let mockAddLog;
    let mockShowNotification;
    let mockDeps;

    beforeEach(() => {
        mockAddLog = jest.fn();
        mockShowNotification = jest.fn();

        mockState = {
            character: {
                name: 'Commander',
                credits: 500
            }
            // intentionally omit state.codex to test old-save compatibility
        };

        mockDeps = {
            state: mockState,
            ui: {
                addLog: mockAddLog,
                showNotification: mockShowNotification
            }
        };

        initCodex(mockDeps);
    });

    describe('State Initialization & Old-Save Compatibility', () => {
        test('ensureCodexState initializes missing state.codex cleanly', () => {
            expect(mockState.codex).toBeDefined();
            expect(mockState.codex.unlocked).toEqual([]);
            expect(mockState.codex.unread).toEqual([]);
        });

        test('ensureCodexState repairs corrupted non-array unlocked or unread fields', () => {
            mockState.codex = {
                unlocked: 'invalid',
                unread: null
            };
            ensureCodexState();
            expect(Array.isArray(mockState.codex.unlocked)).toBe(true);
            expect(Array.isArray(mockState.codex.unread)).toBe(true);
            expect(mockState.codex.unlocked).toEqual([]);
            expect(mockState.codex.unread).toEqual([]);
        });

        test('handles null state without throwing errors', () => {
            initCodex({ state: null });
            expect(ensureCodexState()).toBeNull();
            expect(isCodexUnlocked('terra_prime')).toBe(false);
            expect(unlockCodexEntry('terra_prime')).toBe(false);
            expect(markCodexRead('terra_prime')).toBe(false);
        });
    });

    describe('unlockCodexEntry', () => {
        test('returns false for unknown or invalid codex id', () => {
            const result = unlockCodexEntry('non_existent_entry');
            expect(result).toBe(false);
            expect(mockState.codex.unlocked).toHaveLength(0);
            expect(mockAddLog).not.toHaveBeenCalled();
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        test('returns false for empty id', () => {
            expect(unlockCodexEntry('')).toBe(false);
            expect(unlockCodexEntry(null)).toBe(false);
        });

        test('unlocks valid entry, adds to unlocked and unread, logs and emits event', () => {
            const emittedEvents = [];
            const handler = (entry) => emittedEvents.push(entry);
            eventEmitter.on('codexUnlocked', handler);

            const result = unlockCodexEntry('terra_prime');
            expect(result).toBe(true);
            expect(mockState.codex.unlocked).toContain('terra_prime');
            expect(mockState.codex.unread).toContain('terra_prime');
            expect(mockAddLog).toHaveBeenCalledWith(expect.stringContaining('Terra Prime'));
            expect(mockShowNotification).toHaveBeenCalledWith(expect.stringContaining('Terra Prime'));

            expect(emittedEvents).toHaveLength(1);
            expect(emittedEvents[0].id).toBe('terra_prime');

            eventEmitter.off('codexUnlocked', handler);
        });

        test('idempotency: duplicate unlocks return false and do not duplicate entries or re-notify', () => {
            unlockCodexEntry('terra_prime');
            expect(mockState.codex.unlocked).toHaveLength(1);
            expect(mockState.codex.unread).toHaveLength(1);

            jest.clearAllMocks();

            const secondResult = unlockCodexEntry('terra_prime');
            expect(secondResult).toBe(false);
            expect(mockState.codex.unlocked).toHaveLength(1);
            expect(mockState.codex.unread).toHaveLength(1);
            expect(mockAddLog).not.toHaveBeenCalled();
            expect(mockShowNotification).not.toHaveBeenCalled();
        });
    });

    describe('markCodexRead & isCodexUnlocked', () => {
        test('isCodexUnlocked correctly reports unlocked status', () => {
            expect(isCodexUnlocked('federation')).toBe(false);
            unlockCodexEntry('federation');
            expect(isCodexUnlocked('federation')).toBe(true);
        });

        test('markCodexRead removes entry from unread list', () => {
            unlockCodexEntry('xenobot');
            expect(mockState.codex.unread).toContain('xenobot');

            const marked = markCodexRead('xenobot');
            expect(marked).toBe(true);
            expect(mockState.codex.unread).not.toContain('xenobot');

            // Marking again when already read returns false
            expect(markCodexRead('xenobot')).toBe(false);
        });
    });

    describe('getCodexEntries', () => {
        test('returns all entries when category is "all"', () => {
            const entries = getCodexEntries('all');
            expect(entries.length).toBe(codexEntries.length);
        });

        test('filters entries by specific category', () => {
            const locations = getCodexEntries('locations');
            expect(locations.length).toBeGreaterThan(0);
            expect(locations.every(e => e.category === 'locations')).toBe(true);

            const factions = getCodexEntries('factions');
            expect(factions.length).toBeGreaterThan(0);
            expect(factions.every(e => e.category === 'factions')).toBe(true);
        });

        test('masks locked entries: title is "???", body is undefined, locked is true', () => {
            const entries = getCodexEntries('enemies');
            const lockedEnemy = entries.find(e => e.id === 'sand_worm');

            expect(lockedEnemy.locked).toBe(true);
            expect(lockedEnemy.unlocked).toBe(false);
            expect(lockedEnemy.title).toBe('???');
            expect(lockedEnemy.body).toBeUndefined();
            expect(lockedEnemy.unlockHint).toBeDefined();
            expect(lockedEnemy.unread).toBe(false);
        });

        test('reveals unlocked entries: includes original title, body, and unread flag', () => {
            unlockCodexEntry('vance');
            const characters = getCodexEntries('characters');
            const vance = characters.find(e => e.id === 'vance');

            expect(vance.locked).toBe(false);
            expect(vance.unlocked).toBe(true);
            expect(vance.title).toBe('Captain Valen Vance');
            expect(vance.body).toBeDefined();
            expect(vance.body).toContain('Captain Vance');
            expect(vance.unread).toBe(true);

            markCodexRead('vance');
            const vanceAfterRead = getCodexEntries('characters').find(e => e.id === 'vance');
            expect(vanceAfterRead.unread).toBe(false);
        });
    });

    describe('getCodexProgress', () => {
        test('returns zero progress on fresh game state', () => {
            const progress = getCodexProgress();
            expect(progress.unlockedCount).toBe(0);
            expect(progress.totalCount).toBe(codexEntries.length);
            expect(progress.unreadCount).toBe(0);
            expect(progress.percentage).toBe(0);
        });

        test('calculates correct counts and rounded percentage as entries are unlocked', () => {
            unlockCodexEntry('terra_prime');
            unlockCodexEntry('federation');

            const progress = getCodexProgress();
            expect(progress.unlockedCount).toBe(2);
            expect(progress.unreadCount).toBe(2);
            expect(progress.percentage).toBe(Math.round((2 / codexEntries.length) * 100));

            markCodexRead('terra_prime');
            const progressAfterRead = getCodexProgress();
            expect(progressAfterRead.unreadCount).toBe(1);
        });
    });

    describe('Codex UI Module (jsdom)', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
            initCodexUI({ state: mockState });
        });

        test('showCodexUI mounts modal into document body and displays it', () => {
            showCodexUI();
            const modal = document.getElementById('codexModal');
            expect(modal).not.toBeNull();
            expect(modal.classList.contains('hidden')).toBe(false);
            expect(modal.style.display).toBe('flex');
        });

        test('closeCodexUI hides modal', () => {
            showCodexUI();
            closeCodexUI();
            const modal = document.getElementById('codexModal');
            expect(modal.classList.contains('hidden')).toBe(true);
            expect(modal.style.display).toBe('none');
        });

        test('renders category tabs and switches category filter on click', () => {
            showCodexUI();
            const tabsContainer = document.getElementById('codexCategoryTabs');
            expect(tabsContainer).not.toBeNull();

            // Check that all category tabs exist
            const allTab = document.getElementById('codex-tab-all');
            expect(allTab).not.toBeNull();

            CODEX_CATEGORIES.forEach(cat => {
                const catTab = document.getElementById(`codex-tab-${cat}`);
                expect(catTab).not.toBeNull();
            });

            // Click factions tab
            const factionsTab = document.getElementById('codex-tab-factions');
            factionsTab.click();

            const entriesList = document.getElementById('codexEntriesList');
            expect(entriesList.querySelectorAll('button').length).toBe(3); // 3 factions
        });

        test('renders locked entry details with decryption hint', () => {
            showCodexUI();
            renderCodexModal('enemies');

            // Select locked enemy
            selectCodexEntry('sand_worm');

            const detailPane = document.getElementById('codexDetailPane');
            expect(detailPane.innerHTML).toContain('ENCRYPTED');
            expect(detailPane.innerHTML).toContain('??? [ENCRYPTED FREQUENCY]');
            expect(detailPane.innerHTML).toContain('DECRYPTION REQUIREMENT:');
        });

        test('renders decrypted entry details and marks entry read upon selection', () => {
            unlockCodexEntry('terra_prime');
            expect(mockState.codex.unread).toContain('terra_prime');

            showCodexUI();
            selectCodexEntry('terra_prime');

            const detailPane = document.getElementById('codexDetailPane');
            expect(detailPane.innerHTML).toContain('Terra Prime');
            expect(detailPane.innerHTML).toContain('DECRYPTED');
            expect(detailPane.innerHTML).toContain('pastoral');

            // Entry should have been marked as read
            expect(mockState.codex.unread).not.toContain('terra_prime');
        });

        test('progress bar displays percentage and unread badges', () => {
            unlockCodexEntry('terra_prime');
            unlockCodexEntry('syndicate');

            showCodexUI();
            const progressBar = document.getElementById('codexProgressBar');
            expect(progressBar.textContent).toContain('2/');
            expect(progressBar.textContent).toContain('Decrypted');
            expect(progressBar.textContent).toContain('NEW');
        });

        test('showCodexUI automatically unlocks terra_prime if not yet unlocked', () => {
            expect(isCodexUnlocked('terra_prime')).toBe(false);
            showCodexUI();
            expect(isCodexUnlocked('terra_prime')).toBe(true);
        });

        test('talking to Vance via showDialogue unlocks vance in the codex', () => {
            initDialogueUI({ state: mockState, ui: { updateUI: jest.fn() } });
            const overlay = document.createElement('div');
            overlay.id = 'dialogueOverlay';
            document.body.appendChild(overlay);

            expect(isCodexUnlocked('vance')).toBe(false);
            showDialogue('Captain Vance', 'Welcome aboard.');
            expect(isCodexUnlocked('vance')).toBe(true);

            overlay.remove();
        });

        test('renders entry image when available in imagery registry and omits it otherwise', () => {
            unlockCodexEntry('terra_prime');
            unlockCodexEntry('plasmavore');
            unlockCodexEntry('precursor_tech');

            showCodexUI();
            selectCodexEntry('terra_prime');
            const img = document.getElementById('codexEntryImage');
            expect(img).not.toBeNull();
            expect(img.getAttribute('src')).toContain('assets/images/locations/terra_prime.jpg');

            selectCodexEntry('plasmavore');
            const plasmaImg = document.getElementById('codexEntryImage');
            expect(plasmaImg).not.toBeNull();
            expect(plasmaImg.getAttribute('src')).toContain('assets/images/enemies/plasmavore.jpg');

            selectCodexEntry('precursor_tech');
            expect(document.getElementById('codexEntryImage')).toBeNull();
        });

        test('Terra Prime districts have codex entries and resolve districtImages', () => {
            ['terra_prime_fed_hq', 'terra_prime_bazaar', 'terra_prime_residential'].forEach((id) => {
                expect(unlockCodexEntry(id)).toBe(true);
            });

            showCodexUI();
            selectCodexEntry('terra_prime_fed_hq');
            const img = document.getElementById('codexEntryImage');
            expect(img).not.toBeNull();
            expect(img.getAttribute('src')).toContain('assets/images/districts/terra_prime_fed_hq.jpg');
        });
    });
});
