/**
 * @jest-environment jsdom
 */
import { npcReactions } from '../../data/npc_reactions.js';
import { resolveVariantText } from '../../systems/quests.js';
import { initQuests } from '../../systems/quests.js';

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
