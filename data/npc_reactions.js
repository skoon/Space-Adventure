/**
 * NPC reactive greetings. Keyed by NPC id; each entry is a variant list resolved
 * by resolveVariantText (first matching showIf wins). Pure data — no logic.
 */
export const npcReactions = {
    vance: [
        { showIf: { memoryFlag: 'vance_betrayed' },
          text: "You've got some nerve showing your face here." }
    ],
    nesta: [],
    thorne: []
};
