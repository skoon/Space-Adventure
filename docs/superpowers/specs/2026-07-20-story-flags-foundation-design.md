# Story Flags Foundation — Design Spec

**Date:** 2026-07-20
**Status:** Approved for planning
**Scope:** `systems/quests.js`, `tests/systems/quests.test.js`

## Goal

Enable **longer stories** in Galactic Odyssey by giving the quest engine persistent
narrative memory. Today the engine can branch, roll, and chain quests, but a choice
made in Act 1 cannot visibly matter in Act 3: `storyline.variables` is declared but
never used, and `memoryFlags` are written but never read. This feature turns those
into a real flag system so choices leave durable, readable consequences.

Two consumer capabilities matter equally:

1. **Quest-availability gating by flags** — a choice made earlier unlocks (or hides) a
   quest later. This is what stitches separate arcs into one long story.
2. **Reactive within-quest text** — dialog changes based on what the player did before.

## Non-Goals (deliberately out of scope)

These become easy once flags exist, but each is its own future change:

- Codex / story journal UI.
- Deferred consequences (events scheduled N jumps later).
- NPC reactive greetings / companion interjections outside quest steps.
- Changes to successor-quest selection (existing alignment/default logic stays).

No new dependencies, no framework, no build changes. Vanilla ES6 modules only.

## Storage

Flags live in the existing `state.character.storyline.variables` object, which is
already initialized (`systems/character.js`) and already serialized by save/load
(`systems/saveload.js`). **No state-shape change and no migration.**

Flag values may be:

- **boolean** — event happened or not (`spared_queen: true`)
- **number** — counter (`civilians_saved: 3`)
- **string** — categorical choice (`alliance: "fed"`)

`memoryFlags` (per-NPC string arrays) remain as-is; this feature makes them
*readable* via a condition key but does not change how they are written.

## The Condition Format (one checker, four consumers)

Extend the existing `checkChoiceRequirements(requires)` in `systems/quests.js` — the
function that already validates `role`, `race`, `stat`, `faction`, and `npc` — with
two new optional keys. Every consumer below reuses this one function, so authors learn
a single condition shape.

### `flag`

```js
requires: { flag: "spared_queen" }                                  // truthy check
requires: { flag: { name: "civilians_saved", op: ">=", value: 3 } } // numeric compare
requires: { flag: { name: "alliance", value: "fed" } }              // equality
```

- Shorthand string form → truthy test of that flag.
- Object form → `name` (required), optional `op`, optional `value`.
- Supported `op`: `>=`, `>`, `<=`, `<`, `==`, `!=`.
- Default when `op` omitted: if `value` present → equality; else → truthy.
- Missing flag reads as falsy / `undefined` (never throws).

### `memoryFlag`

```js
requires: { memoryFlag: "vance_betrayed" }
```

True if **any** NPC in `state.character.npcs` has that string in its `memoryFlags`
array. This resurrects data choices already write today.

### Combining conditions

All keys inside a single `requires`/`showIf`/`requiredFlags` object are **AND-ed**
(matching the existing behavior for `role` + `stat` + `faction`). `OR` is expressed by
authoring multiple variants / multiple choices, not by operators — keeps the checker
flat and testable.

## Writing Flags

A choice or a non-choice step may write flags when it resolves.

```js
choice: {
  setFlags: { spared_queen: true, alliance: "fed" },  // literal assignment
  incFlags: { civilians_saved: 1 }                    // numeric add (init 0 if unset)
}

step: {
  type: "collect", target: "Data Chip", amount: 1,
  setFlags: { found_evidence: true }                  // applied on step completion
}
```

- `setFlags` — assigns each value literally into `storyline.variables`.
- `incFlags` — adds the numeric delta; treats an unset/non-numeric flag as `0` first.
- Both are applied inside `applyChoiceConsequences` (choices) and `completeStep`
  (non-choice steps), alongside the existing rewards/reputation/disposition handling.
- Every quest log line for flag writes goes through `addLog` for consistency.

## The Four Consumers

### 1. Choice gating

Already works via `requires` on a choice. Adding `flag`/`memoryFlag` to the checker
makes them gate automatically. `showBranchingChoiceDialog` renders requirement tags
next to each choice label — extend that tag builder to emit readable flag/memory tags
(e.g. `[FLAG: spared_queen]`, `[MEM: vance_betrayed]`) so gated choices are legible.

### 2. Step visibility (`showIf`)

A step may carry `showIf: { ... }` in the same condition format. A new helper
`advanceToVisibleStep(questId)` advances `currentStep` forward past any step whose
`showIf` fails:

```
while currentStep < steps.length and steps[currentStep].showIf present and fails:
    currentStep++
```

Call it at the three sites where `currentStep` changes:

- `acceptQuest` (initial landing on step 0),
- `completeStep` (after incrementing),
- `evaluateChoice` → `applyChoiceConsequences` (after setting `nextStepVal`).

It coexists with explicit `nextStepIndex` branching: branching sets the target step,
then skip-forward removes any hidden steps from there. A step with no `showIf` is
always visible (backward compatible).

### 3. Reactive dialog (`variants`)

A new helper `resolveDialogText(dialog)` returns the text to display:

```js
dialog: {
  variants: [
    { showIf: { flag: "spared_queen" }, text: "The queen bows to you." },
    { showIf: { flag: "killed_queen" }, text: "Her hive seethes with hate." }
  ],
  text: "The hive is silent."   // default / fallback
}
```

- First `variants[]` entry whose `showIf` passes wins.
- If none pass (or no `variants`), fall back to `dialog.text`.
- Used wherever a step dialog renders: `completeStep`'s `showDialog` call and
  `showBranchingChoiceDialog`'s `dialogText`. A `dialog` (or step) that provides only
  `text` behaves exactly as today.

### 4. Quest availability gating

A quest may carry `requiredFlags` (condition-format object) and/or `showIf`. Both
`getAvailableQuests` and `getJobBoardQuests` run the shared checker and exclude the
quest when it fails — sitting alongside the existing `requiredPlanet`,
`derelictOnly`, and `requiredFaction` filters. A quest without these keys is
unaffected. This is the mechanism by which an earlier choice unlocks a later quest.

## Data flow

```
choice/step resolves
  -> setFlags / incFlags written to storyline.variables
       |
       v
later: checkChoiceRequirements(condition)  <- single source of truth
       ^         ^              ^                 ^
       |         |              |                 |
  choice gating  showIf     dialog variants   quest availability
                 (step skip) (resolveDialogText) (getAvailableQuests /
                                                   getJobBoardQuests)
```

## Error handling

- Reads of missing flags return falsy `undefined`; conditions never throw on absent
  data (fail-closed: an unmet condition simply hides/disables).
- Unknown `op` values: treat as a spec error — fail the condition and `addLog` a
  warning so bad quest data is loud, not silently "always true".
- `incFlags` on a non-numeric existing value: reset to `0` before adding and `addLog`
  a warning (loud, per project error-handling rules).

## Backward compatibility

Every new key (`flag`, `memoryFlag`, `setFlags`, `incFlags`, `showIf`, `variants`,
`requiredFlags`) is **optional**. All existing quests in `data/quests.js` keep working
untouched. No data migration required.

## Testing (`tests/systems/quests.test.js`)

- **Flag round-trip:** `setFlags` writes, `checkChoiceRequirements({flag})` reads.
- **`incFlags`:** increments from unset (0) and from existing; warns + resets on
  non-numeric.
- **Operators:** each of `>=`, `>`, `<=`, `<`, `==`, `!=` passes and fails correctly;
  truthy shorthand; equality when `value` present and `op` omitted.
- **`memoryFlag`:** true when an NPC holds the flag, false otherwise.
- **Step skipping:** `advanceToVisibleStep` skips a hidden step and lands on the next
  visible one; a quest of all-hidden trailing steps completes.
- **Dialog variants:** first matching variant wins; falls back to `text` when none
  match and when `variants` absent.
- **Availability gating:** a quest with `requiredFlags` is excluded until the flag is
  set, then included, in both `getAvailableQuests` and `getJobBoardQuests`.
- **Unknown `op`:** condition fails and a warning is logged.

Run `npm test` before completion (project rule).
