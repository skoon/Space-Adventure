# Story Flags Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the quest engine persistent narrative memory (story flags) so choices made earlier visibly matter later — gating quests, changing dialog, and making NPCs and companions react.

**Architecture:** All flag reads route through one extended condition checker (`checkChoiceRequirements`) and all reactive text through one resolver (`resolveVariantText`), both in `systems/quests.js`. Flags live in the already-saved `state.character.storyline.variables`. Reactive NPCs/companions (Idea C) reuse those two helpers from `systems/ui/districts-ui.js` and `systems/companions.js`. Every new key is optional and additive — no data migration.

**Tech Stack:** Vanilla JavaScript ES6 modules (no build step, no framework), Jest + jsdom for tests.

## Global Constraints

- **Branch:** All work happens on the git branch **`story-changes`** (already created; the design spec commits live there). Do not commit to `master`.
- **Language:** Vanilla ES6 modules only — no framework, no bundler, no TypeScript, no new dependencies.
- **Data vs logic:** Keep logic in `systems/`, data in `data/`. New player-facing text tables (`data/npc_reactions.js`, companion `interjections`) go in `data/`.
- **Every new key is optional** — existing quests, NPC greetings, and companion lines must keep working untouched.
- **Fail loudly:** unknown operators and non-numeric `incFlags` targets log a warning via `addLog`; they must not silently pass.
- **Test runner:** `npx jest tests/systems/<file>` for one file; `npm test` for the full suite. Run `npm test` before declaring the feature complete.
- **Spec:** `docs/superpowers/specs/2026-07-20-story-flags-foundation-design.md` is the source of truth.

---

## File Structure

- `systems/quests.js` — all flag/condition/variant logic (Tasks 1–6).
- `tests/systems/quests.test.js` — existing; extended in Tasks 1–6.
- `data/npc_reactions.js` — **new**; NPC reactive greeting variant tables (Task 7).
- `systems/ui/districts-ui.js` — reactive greeting hook in `talkToNPC` (Task 7).
- `data/companions.js` — optional `interjections` arrays per companion (Task 8).
- `systems/companions.js` — `companionInterject(choice)` helper (Task 8).
- `game.js` — wire `companionInterject` into `initQuests` deps (Task 8).
- `tests/systems/companions.test.js` — existing; extended in Task 8.
- `tests/systems/districts.test.js` — **new**; NPC greeting tests (Task 7).

---

## Task 1: Condition checker — `flag` and `memoryFlag`

**Files:**
- Modify: `systems/quests.js` — `checkChoiceRequirements(requires)` (currently ends with `return true;`)
- Test: `tests/systems/quests.test.js`

**Interfaces:**
- Consumes: `state.character.storyline.variables` (flag bag, object), `state.character.npcs[id].memoryFlags` (string arrays).
- Produces: `checkChoiceRequirements(requires)` now also honors `requires.flag` and `requires.memoryFlag`. Also produces module-private helper `compareOp(a, op, b)` and `getFlag(name)`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/systems/quests.test.js`. The suite already calls `initQuests({...})` with a mock state; ensure the mock state has `character.storyline.variables` and `character.npcs`. Add a `beforeEach` (or extend the existing setup) so `mockState.character.storyline = { variables: {} }` and `mockState.character.npcs = {}` before each test, then:

```javascript
import { checkChoiceRequirements } from '../../systems/quests.js';

describe('checkChoiceRequirements — flags', () => {
    beforeEach(() => {
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.npcs = {};
    });

    test('truthy shorthand: flag string', () => {
        expect(checkChoiceRequirements({ flag: 'spared_queen' })).toBe(false);
        mockState.character.storyline.variables.spared_queen = true;
        expect(checkChoiceRequirements({ flag: 'spared_queen' })).toBe(true);
    });

    test('equality when value present, op omitted', () => {
        mockState.character.storyline.variables.alliance = 'fed';
        expect(checkChoiceRequirements({ flag: { name: 'alliance', value: 'fed' } })).toBe(true);
        expect(checkChoiceRequirements({ flag: { name: 'alliance', value: 'cor' } })).toBe(false);
    });

    test('numeric operators', () => {
        mockState.character.storyline.variables.civ = 3;
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '>=', value: 3 } })).toBe(true);
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '>', value: 3 } })).toBe(false);
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '<=', value: 3 } })).toBe(true);
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '!=', value: 4 } })).toBe(true);
    });

    test('missing flag never throws, reads falsy', () => {
        expect(checkChoiceRequirements({ flag: { name: 'nope', op: '>=', value: 1 } })).toBe(false);
    });

    test('unknown op fails closed and warns', () => {
        mockState.character.storyline.variables.civ = 3;
        mockLog.mockClear();
        expect(checkChoiceRequirements({ flag: { name: 'civ', op: '<>', value: 3 } })).toBe(false);
        expect(mockLog).toHaveBeenCalled();
    });

    test('memoryFlag reads any NPC memoryFlags', () => {
        expect(checkChoiceRequirements({ memoryFlag: 'vance_betrayed' })).toBe(false);
        mockState.character.npcs.vance = { disposition: 0, memoryFlags: ['vance_betrayed'] };
        expect(checkChoiceRequirements({ memoryFlag: 'vance_betrayed' })).toBe(true);
    });
});
```

Note: `mockLog` is the `addLog` mock passed into `initQuests`; if the existing suite names it differently, reuse that name. If the suite does not currently pass an `addLog` mock, add `const mockLog = jest.fn();` and include `ui: { addLog: mockLog, ... }` in the `initQuests` call.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/systems/quests.test.js -t "flags"`
Expected: FAIL — `checkChoiceRequirements` ignores `flag`/`memoryFlag`, so truthy/equality/op cases return `true` (no gate) or the import of `compareOp`-driven behavior is absent.

- [ ] **Step 3: Implement flag/memoryFlag handling**

In `systems/quests.js`, add near the other module helpers (e.g. just above `checkChoiceRequirements`):

```javascript
/**
 * Read a story flag from storyline.variables (undefined if unset).
 */
export function getFlag(name) {
    return state?.character?.storyline?.variables?.[name];
}

/**
 * Compare two values with a named operator. Returns false + logs on unknown op.
 */
function compareOp(a, op, b) {
    switch (op) {
        case '>=': return a >= b;
        case '>': return a > b;
        case '<=': return a <= b;
        case '<': return a < b;
        case '==': return a === b;
        case '!=': return a !== b;
        default:
            if (addLog) addLog(`[!] Story flag warning: unknown operator '${op}'`);
            return false;
    }
}
```

Then, inside `checkChoiceRequirements`, immediately before the final `return true;`, insert:

```javascript
    if (requires.flag !== undefined) {
        if (typeof requires.flag === 'string') {
            if (!getFlag(requires.flag)) return false;
        } else {
            const { name, op, value } = requires.flag;
            const current = getFlag(name);
            if (op !== undefined) {
                if (!compareOp(current, op, value)) return false;
            } else if (value !== undefined) {
                if (current !== value) return false;
            } else if (!current) {
                return false;
            }
        }
    }

    if (requires.memoryFlag !== undefined) {
        const npcs = state.character.npcs || {};
        const found = Object.values(npcs).some(
            npc => Array.isArray(npc.memoryFlags) && npc.memoryFlags.includes(requires.memoryFlag)
        );
        if (!found) return false;
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/systems/quests.test.js -t "flags"`
Expected: PASS (all cases in the `checkChoiceRequirements — flags` describe).

- [ ] **Step 5: Commit**

```bash
git add systems/quests.js tests/systems/quests.test.js
git commit -m "feat(quests): flag and memoryFlag conditions in checkChoiceRequirements"
```

---

## Task 2: `resolveVariantText` + `resolveDialogText`

**Files:**
- Modify: `systems/quests.js` (add two exported helpers)
- Test: `tests/systems/quests.test.js`

**Interfaces:**
- Consumes: `checkChoiceRequirements` (Task 1) for each variant's `showIf`.
- Produces:
  - `resolveVariantText(variants, fallback)` → returns first `variants[i].text` whose `variants[i].showIf` passes `checkChoiceRequirements`, else `fallback`. Safe on `undefined`/empty `variants`.
  - `resolveDialogText(dialog)` → `resolveVariantText(dialog?.variants, dialog?.text)`.

- [ ] **Step 1: Write the failing tests**

```javascript
import { resolveVariantText, resolveDialogText } from '../../systems/quests.js';

describe('resolveVariantText', () => {
    beforeEach(() => {
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.npcs = {};
    });

    test('first matching variant wins', () => {
        mockState.character.storyline.variables.killed_queen = true;
        const variants = [
            { showIf: { flag: 'spared_queen' }, text: 'bows' },
            { showIf: { flag: 'killed_queen' }, text: 'seethes' }
        ];
        expect(resolveVariantText(variants, 'silent')).toBe('seethes');
    });

    test('falls back when none match', () => {
        const variants = [{ showIf: { flag: 'spared_queen' }, text: 'bows' }];
        expect(resolveVariantText(variants, 'silent')).toBe('silent');
    });

    test('undefined / empty variants return fallback', () => {
        expect(resolveVariantText(undefined, 'silent')).toBe('silent');
        expect(resolveVariantText([], 'silent')).toBe('silent');
    });

    test('resolveDialogText wraps variants + text', () => {
        mockState.character.storyline.variables.spared_queen = true;
        const dialog = { variants: [{ showIf: { flag: 'spared_queen' }, text: 'bows' }], text: 'silent' };
        expect(resolveDialogText(dialog)).toBe('bows');
        expect(resolveDialogText({ text: 'plain' })).toBe('plain');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/systems/quests.test.js -t "resolveVariantText"`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement the resolvers**

Add to `systems/quests.js`:

```javascript
/**
 * Return the first variant's text whose showIf passes, else fallback.
 * @param {Array<{showIf?: object, text: string}>} variants
 * @param {string|null} fallback
 */
export function resolveVariantText(variants, fallback) {
    if (Array.isArray(variants)) {
        for (const v of variants) {
            if (checkChoiceRequirements(v.showIf)) return v.text;
        }
    }
    return fallback;
}

/**
 * Resolve a step dialog's text, honoring optional variants.
 */
export function resolveDialogText(dialog) {
    if (!dialog) return '';
    return resolveVariantText(dialog.variants, dialog.text);
}
```

Note: `checkChoiceRequirements(undefined)` already returns `true` (its first line is `if (!requires) return true;`), so a variant with no `showIf` always matches — intended.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/systems/quests.test.js -t "resolveVariantText"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add systems/quests.js tests/systems/quests.test.js
git commit -m "feat(quests): resolveVariantText and resolveDialogText helpers"
```

---

## Task 3: Writing flags — `setFlags` / `incFlags`

**Files:**
- Modify: `systems/quests.js` — `applyChoiceConsequences` (inside `evaluateChoice`) and `completeStep`
- Test: `tests/systems/quests.test.js`

**Interfaces:**
- Consumes: `state.character.storyline.variables`.
- Produces: module-private helper `applyFlagWrites(source)` applied by both choices and non-choice steps. `source.setFlags` (object → literal assignment) and `source.incFlags` (object of numeric deltas).

- [ ] **Step 1: Write the failing tests**

```javascript
import { applyQuestFlagWrites } from '../../systems/quests.js';

describe('flag writes', () => {
    beforeEach(() => {
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
    });

    test('setFlags assigns literals', () => {
        applyQuestFlagWrites({ setFlags: { spared_queen: true, alliance: 'fed' } });
        expect(mockState.character.storyline.variables.spared_queen).toBe(true);
        expect(mockState.character.storyline.variables.alliance).toBe('fed');
    });

    test('incFlags adds, initializing unset to 0', () => {
        applyQuestFlagWrites({ incFlags: { civ: 1 } });
        expect(mockState.character.storyline.variables.civ).toBe(1);
        applyQuestFlagWrites({ incFlags: { civ: 2 } });
        expect(mockState.character.storyline.variables.civ).toBe(3);
    });

    test('incFlags on non-numeric resets to 0 and warns', () => {
        mockState.character.storyline.variables.civ = 'oops';
        mockLog.mockClear();
        applyQuestFlagWrites({ incFlags: { civ: 1 } });
        expect(mockState.character.storyline.variables.civ).toBe(1);
        expect(mockLog).toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/systems/quests.test.js -t "flag writes"`
Expected: FAIL — `applyQuestFlagWrites` not exported.

- [ ] **Step 3: Implement the writer and call it**

Add to `systems/quests.js`:

```javascript
/**
 * Apply setFlags (literal) and incFlags (numeric add) from a choice or step.
 */
export function applyQuestFlagWrites(source) {
    if (!source || !state.character) return;
    const vars = state.character.storyline.variables;

    if (source.setFlags) {
        for (const [key, value] of Object.entries(source.setFlags)) {
            vars[key] = value;
            if (addLog) addLog(`📝 Story flag set: ${key} = ${value}`);
        }
    }
    if (source.incFlags) {
        for (const [key, delta] of Object.entries(source.incFlags)) {
            let current = vars[key];
            if (typeof current !== 'number') {
                if (current !== undefined && addLog) {
                    addLog(`[!] Story flag warning: incFlags on non-numeric '${key}', resetting to 0`);
                }
                current = 0;
            }
            vars[key] = current + delta;
            if (addLog) addLog(`📝 Story flag: ${key} = ${vars[key]}`);
        }
    }
}
```

In `applyChoiceConsequences` (inside `evaluateChoice`), after the existing reward/reputation/disposition application and before advancing the step (i.e. right before `activeQuest.progress = 0;`), add:

```javascript
        applyQuestFlagWrites(choice);
```

In `completeStep`, after granting step rewards and before/after showing the dialog (before `activeQuest.progress = 0;`), add:

```javascript
    applyQuestFlagWrites(step);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/systems/quests.test.js -t "flag writes"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add systems/quests.js tests/systems/quests.test.js
git commit -m "feat(quests): setFlags/incFlags writes from choices and steps"
```

---

## Task 4: Step visibility — `advanceToVisibleStep` + `showIf`

**Files:**
- Modify: `systems/quests.js` — new helper + call sites in `acceptQuest`, `completeStep`, `applyChoiceConsequences`
- Test: `tests/systems/quests.test.js`

**Interfaces:**
- Consumes: `checkChoiceRequirements` (Task 1), `state.character.activeQuests[questId].currentStep`.
- Produces: `advanceToVisibleStep(questId)` — mutates `currentStep`, skipping forward past any step whose `showIf` fails. No-op when the step is visible or index is past the end.

- [ ] **Step 1: Write the failing test**

```javascript
describe('advanceToVisibleStep', () => {
    beforeEach(() => {
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.activeQuests = {};
    });

    test('skips a hidden step and lands on the next visible one', () => {
        mockQuestsData.quest_showif = {
            id: 'quest_showif', title: 'ShowIf', description: '', type: 'kill', target: 'X', amount: 1,
            steps: [
                { type: 'kill', target: 'X', amount: 1 },
                { type: 'kill', target: 'Y', amount: 1, showIf: { flag: 'do_bonus' } },
                { type: 'kill', target: 'Z', amount: 1 }
            ]
        };
        mockState.character.activeQuests.quest_showif = { progress: 0, currentStep: 1 };
        advanceToVisibleStep('quest_showif');
        expect(mockState.character.activeQuests.quest_showif.currentStep).toBe(2);
    });

    test('does not skip a visible step', () => {
        mockState.character.storyline.variables.do_bonus = true;
        mockState.character.activeQuests.quest_showif = { progress: 0, currentStep: 1 };
        advanceToVisibleStep('quest_showif');
        expect(mockState.character.activeQuests.quest_showif.currentStep).toBe(1);
    });
});
```

Import `advanceToVisibleStep` at the top of the test file's import list.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/systems/quests.test.js -t "advanceToVisibleStep"`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement and wire the helper**

Add to `systems/quests.js`:

```javascript
/**
 * Skip currentStep forward past any step whose showIf fails.
 */
export function advanceToVisibleStep(questId) {
    const quest = quests[questId];
    const activeQuest = state.character?.activeQuests?.[questId];
    if (!quest || !quest.steps || !activeQuest) return;
    while (activeQuest.currentStep < quest.steps.length) {
        const step = quest.steps[activeQuest.currentStep];
        if (step.showIf && !checkChoiceRequirements(step.showIf)) {
            activeQuest.currentStep++;
        } else {
            break;
        }
    }
}
```

Call sites (add `advanceToVisibleStep(questId)` / `advanceToVisibleStep(mappedQuestId)`):

- In `acceptQuest`, after `state.character.activeQuests[mappedQuestId] = { progress: 0, currentStep: 0 };` and before `triggerChoiceStepIfActive(mappedQuestId);`:
  ```javascript
      advanceToVisibleStep(mappedQuestId);
  ```
- In `completeStep`, after `activeQuest.currentStep = currentStepIndex + 1;`:
  ```javascript
      advanceToVisibleStep(questId);
  ```
- In `applyChoiceConsequences`, after `activeQuest.currentStep = nextStepVal;`:
  ```javascript
        advanceToVisibleStep(questId);
  ```

Each existing "is the quest finished?" check (`activeQuest.currentStep >= quest.steps.length`) already runs after these lines, so a run of trailing hidden steps correctly completes the quest.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/systems/quests.test.js -t "advanceToVisibleStep"`
Expected: PASS. Also run the full quest file to confirm no regression: `npx jest tests/systems/quests.test.js`.

- [ ] **Step 5: Commit**

```bash
git add systems/quests.js tests/systems/quests.test.js
git commit -m "feat(quests): showIf step visibility via advanceToVisibleStep"
```

---

## Task 5: Wire reactive dialog + flag requirement tags into the choice UI

**Files:**
- Modify: `systems/quests.js` — `completeStep` (dialog render), `showBranchingChoiceDialog` (dialogText + requirement tags)
- Test: `tests/systems/quests.test.js` (verify resolved text is passed to the dialog mock)

**Interfaces:**
- Consumes: `resolveDialogText` (Task 2), `resolveVariantText` (Task 2).
- Produces: no new exports; `completeStep` and `showBranchingChoiceDialog` now render resolved text and show flag/memory requirement tags.

- [ ] **Step 1: Write the failing test**

```javascript
describe('reactive dialog wiring', () => {
    beforeEach(() => {
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.activeQuests = {};
        mockShowDialog.mockClear();
    });

    test('completeStep shows the matching variant text', () => {
        mockState.character.storyline.variables.spared_queen = true;
        mockQuestsData.quest_variant = {
            id: 'quest_variant', title: 'V', description: '', type: 'kill', target: 'X', amount: 1,
            steps: [
                { type: 'kill', target: 'X', amount: 1, dialog: {
                    title: 'Aftermath',
                    variants: [{ showIf: { flag: 'spared_queen' }, text: 'bows' }],
                    text: 'silent'
                } },
                { type: 'kill', target: 'Y', amount: 1 }
            ]
        };
        mockState.character.activeQuests.quest_variant = { progress: 1, currentStep: 0 };
        completeStep('quest_variant');
        expect(mockShowDialog).toHaveBeenCalledWith('Aftermath', 'bows');
    });
});
```

Note: `mockShowDialog` is the `showDialog` mock passed into `initQuests` (`deps.ui.showDialog`). Match its name to the existing suite.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/systems/quests.test.js -t "reactive dialog wiring"`
Expected: FAIL — `completeStep` currently calls `showDialog(step.dialog.title, step.dialog.text)`, passing `'silent'`.

- [ ] **Step 3: Implement the wiring**

In `completeStep`, replace the existing dialog render:

```javascript
    // BEFORE
    if (step.dialog && showDialog && step.type !== 'choice') {
        showDialog(step.dialog.title, step.dialog.text);
    }
```

with:

```javascript
    // AFTER
    if (step.dialog && showDialog && step.type !== 'choice') {
        showDialog(step.dialog.title, resolveDialogText(step.dialog));
    }
```

In `showBranchingChoiceDialog`, replace the final `showDialog(...)` call:

```javascript
    // BEFORE
    showDialog(step.dialogTitle || "Choice Required", step.dialogText || "Choose your path:", dialogOptions);
```

with a version that resolves variant text (support an optional `step.dialogTextVariants`) and defaults preserved:

```javascript
    // AFTER
    const resolvedPrompt = resolveVariantText(step.dialogTextVariants, step.dialogText) || "Choose your path:";
    showDialog(step.dialogTitle || "Choice Required", resolvedPrompt, dialogOptions);
```

Still in `showBranchingChoiceDialog`, extend the requirement-tag builder so flag/memory requirements are visible. Inside the `if (choice.requires) { ... }` block that pushes to `reqTexts`, add:

```javascript
            if (choice.requires.flag) {
                const f = choice.requires.flag;
                reqTexts.push(typeof f === 'string'
                    ? `FLAG: ${f}`
                    : `FLAG: ${f.name} ${f.op || '='} ${f.value ?? 'set'}`);
            }
            if (choice.requires.memoryFlag) {
                reqTexts.push(`MEM: ${choice.requires.memoryFlag}`);
            }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/systems/quests.test.js -t "reactive dialog wiring"`
Expected: PASS. Run full file: `npx jest tests/systems/quests.test.js`.

- [ ] **Step 5: Commit**

```bash
git add systems/quests.js tests/systems/quests.test.js
git commit -m "feat(quests): render reactive dialog variants and flag requirement tags"
```

---

## Task 6: Quest-availability gating — `requiredFlags` / `showIf`

**Files:**
- Modify: `systems/quests.js` — `getAvailableQuests`, `getJobBoardQuests`
- Test: `tests/systems/quests.test.js`

**Interfaces:**
- Consumes: `checkChoiceRequirements` (Task 1).
- Produces: both list functions exclude a quest when `q.requiredFlags` and/or `q.showIf` (condition-format objects) fail the shared checker.

- [ ] **Step 1: Write the failing test**

```javascript
describe('quest availability gating', () => {
    beforeEach(() => {
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockState.character.activeQuests = {};
        mockState.character.completedQuests = [];
        mockState.currentLocation = 'terra_prime';
    });

    test('requiredFlags hides a quest until the flag is set (getAvailableQuests)', () => {
        mockQuestsData.quest_gated = {
            id: 'quest_gated', title: 'Gated', description: '', type: 'kill', target: 'X', amount: 1,
            requiredFlags: { flag: 'unlocked_it' }
        };
        expect(getAvailableQuests().some(q => q.id === 'quest_gated')).toBe(false);
        mockState.character.storyline.variables.unlocked_it = true;
        expect(getAvailableQuests().some(q => q.id === 'quest_gated')).toBe(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/systems/quests.test.js -t "quest availability gating"`
Expected: FAIL — quest appears regardless of the flag.

- [ ] **Step 3: Implement the filters**

In `getAvailableQuests`, inside the `.filter(q => { ... })` callback, before `return true;`, add:

```javascript
        if (q.requiredFlags && !checkChoiceRequirements(q.requiredFlags)) return false;
        if (q.showIf && !checkChoiceRequirements(q.showIf)) return false;
```

In `getJobBoardQuests`, inside its `.filter(q => { ... })` callback, before `return true;`, add the identical two lines:

```javascript
        if (q.requiredFlags && !checkChoiceRequirements(q.requiredFlags)) return false;
        if (q.showIf && !checkChoiceRequirements(q.showIf)) return false;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/systems/quests.test.js -t "quest availability gating"`
Expected: PASS. Run full file: `npx jest tests/systems/quests.test.js`.

- [ ] **Step 5: Commit**

```bash
git add systems/quests.js tests/systems/quests.test.js
git commit -m "feat(quests): gate quest availability on requiredFlags/showIf"
```

---

## Task 7: Reactive NPC greetings (Idea C)

**Files:**
- Create: `data/npc_reactions.js`
- Modify: `systems/ui/districts-ui.js` — imports + reactive hook in `talkToNPC`
- Create: `tests/systems/districts.test.js`

**Interfaces:**
- Consumes: `resolveVariantText` (Task 2) from `../quests.js`, `showDialogue`/`hideDialogue` (already imported in districts-ui).
- Produces: `npcReactions` map (`{ [npcId]: Array<{showIf, text}> }`). `talkToNPC` shows a reactive greeting when one matches, before its hardcoded greetings.

- [ ] **Step 1: Create the data file**

`data/npc_reactions.js`:

```javascript
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
```

- [ ] **Step 2: Write the failing test**

`tests/systems/districts.test.js`:

```javascript
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
```

Note: this test verifies the data + resolver contract that `talkToNPC` depends on (unit-testing the full DOM-heavy `talkToNPC` is out of scope for this suite; the hook is exercised manually in the browser). If the existing project has a lighter pattern for importing quests into a test, follow it.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest tests/systems/districts.test.js`
Expected: FAIL — `data/npc_reactions.js` did not exist before Step 1; if Step 1 is committed the test should now exercise the resolver. Confirm it fails first by temporarily asserting the wrong text, or run before wiring the hook (Step 4) — the data-level test passes once the file exists; the meaningful failing state is the missing hook, verified manually.

- [ ] **Step 4: Wire the hook into `talkToNPC`**

In `systems/ui/districts-ui.js`, add to the imports at the top:

```javascript
import { resolveVariantText } from '../quests.js';
import { npcReactions } from '../../data/npc_reactions.js';
```

In `talkToNPC(npcId)`, after the existing `if (!state.character) return;` and after the `factionSway` interception block (which must keep precedence), before the hardcoded greeting logic, add:

```javascript
    // Reactive greeting layer (optional; falls through to scripted greetings)
    const reactive = resolveVariantText(npcReactions[npcId], null);
    if (reactive) {
        const name = NPC_NAMES[npcId] || npcId;
        showDialogue(name, reactive, [{ text: "(Close)", action: hideDialogue }]);
        return;
    }
```

- [ ] **Step 5: Run test + verify no regression**

Run: `npx jest tests/systems/districts.test.js`
Expected: PASS. Also run `npx jest tests/systems/quests.test.js` to confirm the new import path did not break anything.

- [ ] **Step 6: Commit**

```bash
git add data/npc_reactions.js systems/ui/districts-ui.js tests/systems/districts.test.js
git commit -m "feat(npc): reactive NPC greetings via npc_reactions data table"
```

---

## Task 8: Companion interjections (Idea C)

**Files:**
- Modify: `data/companions.js` — add optional `interjections` arrays
- Modify: `systems/companions.js` — `companionInterject(choice)` helper
- Modify: `systems/quests.js` — call `deps.companions.companionInterject(choice)` in `applyChoiceConsequences`
- Modify: `game.js` — pass `companions: { companionInterject }` into `initQuests`
- Test: `tests/systems/companions.test.js`

**Interfaces:**
- Consumes: `resolveVariantText` (Task 2) from `./quests.js` (no cycle — `quests.js` does not import `companions.js`), `state.activeCompanion`, `COMPANIONS`.
- Produces: `companionInterject(choice)` — if `choice.companionBark[activeId]` exists uses it; else resolves `COMPANIONS[activeId].interjections`; shows the chosen line via `addLog('💬 ${name}: "${line}"')`. No-op when no companion active or nothing matches.

- [ ] **Step 1: Add optional data**

In `data/companions.js`, add an `interjections` array to at least one companion (e.g. `lyra`), as a sibling of `dialogues`:

```javascript
        interjections: [
            { showIf: { flag: 'killed_queen' },
              text: "That life was a data point we can never recover." }
        ],
```

- [ ] **Step 2: Write the failing tests**

Add to `tests/systems/companions.test.js`:

```javascript
import { companionInterject } from '../../systems/companions.js';

describe('companionInterject', () => {
    beforeEach(() => {
        // Suite already initializes companions with a mock state + mockLog; reuse them.
        mockState.activeCompanion = 'lyra';
        mockState.companions = mockState.companions || {};
        mockState.companions.lyra = { unlocked: true, trust: 0, level: 1 };
        mockState.character = mockState.character || {};
        mockState.character.storyline = { act: 1, alignment: 'neutral', variables: {} };
        mockLog.mockClear();
    });

    test('companionBark fires for the active companion', () => {
        companionInterject({ companionBark: { lyra: 'You trust these Corsairs?' } });
        expect(mockLog).toHaveBeenCalledWith('💬 Dr. Lyra: "You trust these Corsairs?"');
    });

    test('companionBark ignored for inactive companion', () => {
        companionInterject({ companionBark: { apex: 'Blow it up!' } });
        expect(mockLog).not.toHaveBeenCalled();
    });

    test('falls back to data-driven interjections', () => {
        mockState.character.storyline.variables.killed_queen = true;
        companionInterject({});
        expect(mockLog).toHaveBeenCalledWith(
            '💬 Dr. Lyra: "That life was a data point we can never recover."');
    });

    test('no companion active → no-op', () => {
        mockState.activeCompanion = null;
        companionInterject({ companionBark: { lyra: 'hi' } });
        expect(mockLog).not.toHaveBeenCalled();
    });
});
```

Match `mockState` / `mockLog` to the names the existing `companions.test.js` uses. The suite must `initQuests` (or otherwise set the `quests.js` module state) so `resolveVariantText` sees the same `mockState`; if it doesn't already, add an `initQuests({ state: mockState, data: { quests: {} }, ui: { addLog: mockLog, updateUI: jest.fn(), showVictoryMessage: jest.fn(), showSaveMessage: jest.fn(), showDialog: jest.fn() } })` in `beforeEach`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest tests/systems/companions.test.js -t "companionInterject"`
Expected: FAIL — not exported.

- [ ] **Step 4: Implement `companionInterject`**

In `systems/companions.js`, add an import (top, with the existing `COMPANIONS` import) and the helper:

```javascript
import { resolveVariantText } from './quests.js';
```

```javascript
/**
 * The active companion may react to a quest choice. Inline choice.companionBark
 * wins; otherwise data-driven COMPANIONS[id].interjections. No-op if none.
 */
export function companionInterject(choice) {
    const id = state?.activeCompanion;
    if (!id || !COMPANIONS[id]) return;

    let line = null;
    if (choice && choice.companionBark && choice.companionBark[id]) {
        line = choice.companionBark[id];
    } else {
        line = resolveVariantText(COMPANIONS[id].interjections, null);
    }
    if (line && addLog) {
        addLog(`💬 ${COMPANIONS[id].name}: "${line}"`);
    }
}
```

- [ ] **Step 5: Call it from `evaluateChoice`**

In `systems/quests.js`, inside `applyChoiceConsequences`, right after `applyQuestFlagWrites(choice);` (Task 3), add:

```javascript
        if (deps.companions && deps.companions.companionInterject) {
            deps.companions.companionInterject(choice);
        }
```

- [ ] **Step 6: Wire the dependency in `game.js`**

In `game.js`, add `companionInterject` to the companions import:

```javascript
import { initCompanions, companionInterject } from './systems/companions.js';
```

And extend the `initQuests({ ... })` call so it includes the companions dep:

```javascript
  initQuests({
    ...deps,
    ui: { addLog, updateUI, showVictoryMessage, showSaveMessage, showDialog, showDialogue, hideDialogue, showDialogueRoll, showEpilogueCrawl },
    companions: { companionInterject }
  });
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx jest tests/systems/companions.test.js -t "companionInterject"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add data/companions.js systems/companions.js systems/quests.js game.js tests/systems/companions.test.js
git commit -m "feat(companions): choice-driven companion interjections"
```

---

## Task 9: Full-suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire suite**

Run: `npm test`
Expected: PASS — all existing tests plus the new flag/variant/visibility/gating/NPC/companion tests. Investigate and fix any regression before proceeding (the most likely culprit is a test-state shape missing `storyline.variables` or `npcs`).

- [ ] **Step 2: Manual smoke check (optional but recommended)**

Serve locally (`npm start`), open `index.html`, and confirm: a quest with a `choice` still resolves; an NPC with no reaction greets normally. No console errors.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "test: story flags foundation full-suite green"
```

---

## Self-Review

**Spec coverage:**
- Storage in `storyline.variables` → Tasks 1, 3 (read/write).
- `flag` / `memoryFlag` condition format + operators → Task 1.
- `setFlags` / `incFlags` → Task 3.
- Consumer 1 (choice gating) → Task 1 (checker) + Task 5 (requirement tags).
- Consumer 2 (step visibility) → Task 4.
- Consumer 3 (reactive dialog) → Task 2 (resolver) + Task 5 (wiring).
- Consumer 4 (quest availability) → Task 6.
- Consumer 5 (reactive NPC greetings) → Task 7.
- Consumer 6 (companion interjections) → Task 8.
- Error handling (unknown op, non-numeric inc, fail-closed reads) → Tasks 1, 3.
- Backward compatibility (all keys optional) → verified in Task 9.
- Testing coverage → Tasks 1–8 each ship tests; Task 9 runs the suite.

**Type consistency:** `checkChoiceRequirements(requires|showIf)`, `resolveVariantText(variants, fallback)`, `resolveDialogText(dialog)`, `applyQuestFlagWrites(source)`, `advanceToVisibleStep(questId)`, `getFlag(name)`, `companionInterject(choice)` — names are used identically across tasks. `companionInterject` is defined in `systems/companions.js` (Task 8), imported by `game.js`, and invoked via `deps.companions.companionInterject` in `systems/quests.js` — consistent.

**Placeholder scan:** No TBD/TODO; every code step shows complete code and exact run commands.
