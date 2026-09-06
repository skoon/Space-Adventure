/**
 * @jest-environment jsdom
 */
jest.mock('../../systems/ui/dialogue-ui.js', () => ({
    showDialogue: jest.fn(),
    hideDialogue: jest.fn()
}));

import { npcReactions } from '../../data/npc_reactions.js';
import { resolveVariantText } from '../../systems/quests.js';
import { initQuests } from '../../systems/quests.js';
import { initDistrictsUI, talkToNPC } from '../../systems/ui/districts-ui.js';
import { showDialogue } from '../../systems/ui/dialogue-ui.js';

describe('npc reactions data + resolver', () => {
    beforeEach(() => {
        const mockState = {
            character: {
                storyline: { act: 1, alignment: 'neutral', variables: {} },
                npcs: {},
                activeQuests: {}, completedQuests: []
            }
        };
        initQuests({
            state: mockState,
            data: { quests: {} },
            ui: { addLog: jest.fn(), updateUI: jest.fn(), showVictoryMessage: jest.fn(),
                  showSaveMessage: jest.fn(), showDialog: jest.fn() }
        });
        globalThis.__mockState = mockState;
    });

    test('vance reactive greeting fires only when betrayed', () => {
        expect(resolveVariantText(npcReactions.vance, null)).toBe(null);
        globalThis.__mockState.character.npcs.vance = { disposition: 0, memoryFlags: ['vance_betrayed'] };
        expect(resolveVariantText(npcReactions.vance, null))
            .toBe("You've got some nerve showing your face here.");
    });
});

describe('talkToNPC: reactive greeting must not shadow a ready quest turn-in', () => {
    test('a readyToTurnIn quest still fires even when the NPC has a matching reactive flag', () => {
        showDialogue.mockClear();

        const questDb = {
            test_quest: { id: 'test_quest', title: 'Test Delivery', giver: { id: 'vance' } }
        };
        const mockState = {
            character: {
                storyline: { act: 1, alignment: 'neutral', variables: {} },
                // vance_betrayed is set, which would make npcReactions.vance match
                npcs: { vance: { disposition: 0, memoryFlags: ['vance_betrayed'] } },
                activeQuests: { test_quest: { readyToTurnIn: true } },
                completedQuests: []
            }
        };

        initQuests({
            state: mockState,
            data: { quests: questDb },
            ui: { addLog: jest.fn(), updateUI: jest.fn(), showVictoryMessage: jest.fn(),
                  showSaveMessage: jest.fn(), showDialog: jest.fn() }
        });
        initDistrictsUI({
            state: mockState,
            data: { quests: questDb },
            ui: { updateUI: jest.fn() }
        });

        talkToNPC('vance');

        // The generic turn-in interceptor must win; the reactive greeting must not shadow it.
        expect(showDialogue).toHaveBeenCalledTimes(1);
        const [, text] = showDialogue.mock.calls[0];
        expect(text).toContain('Test Delivery');
        expect(text).not.toBe("You've got some nerve showing your face here.");
    });
});
