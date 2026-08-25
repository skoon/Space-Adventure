# Implementation Prompt — Static Image Viewscreen

> Paste the section below into Claude Code (or your agent of choice) from the repo root.
> Everything above the horizontal rule is context for you, not for the agent.

**What this asks for:** a persistent "viewscreen" panel that always shows one static image reflecting whatever the player is currently doing — the planet they're standing on, the enemy they're fighting, the NPC they're talking to, the derelict they're boarding. Emoji stay exactly where they are today; the viewscreen is additive. Art is looked up through a registry keyed by game IDs, so any key without an image silently falls back to the current emoji treatment and new art drops in later with no code changes.

---

## PROMPT

You are working in **Galactic Odyssey** (`Space-Adventure`), a vanilla-JS ES6-module browser RPG. Read `CLAUDE.md` first and honor every convention in it: no framework, no bundler, no TypeScript; game logic in `systems/`, presentation sub-modules in `systems/ui/`, pure data in `data/`; dependency injection through `game.js`; new logic gets a matching Jest test in `tests/systems/`; **run `npm test` before declaring the task complete.**

### Goal

Add a **Viewscreen** — a persistent image panel that displays one static image tied to the player's current action. This is the game's first real graphical layer beyond emoji. Emoji are **not** removed; the viewscreen sits alongside them and degrades to them when no art exists.

The design language is already specified in `docs/ui_overhaul_plan.md` (glassmorphism, functional neon accents). The viewscreen must adopt those tokens (`--glass-bg`, `--glass-blur`, `--border-cyan`, etc.) and the holographic-CRT treatment already used by the dialogue overlay (`.dialogue-hologram`, `.hologram-scanline`).

### Deliver in five phases. Stop and report after each phase.

---

## Phase 1 — Asset pipeline

`assets/portraits/` currently holds 14 JPEGs at roughly **1 MB each** (~14 MB total). Shipping those raw into a no-build browser game means a multi-second first paint. Fix that first.

1. Create `assets/images/` with subfolders `npcs/`, `enemies/`, `locations/`, `events/`.
2. Write `tools/optimize-images.js` — a small Node script (devDependency `sharp`, added to `package.json` under `devDependencies` only, plus an `npm run optimize-images` script). For each source image it emits:
   - `<name>.webp` at **512×512**, quality 80, for the viewscreen
   - `<name>.jpg` at the same size, quality 78, as the `<picture>` fallback
   - `<name>-thumb.webp` at **128×128**, quality 75, for inline portrait chips
   Target: every full-size output under 60 KB, every thumb under 12 KB.
3. Run it over `assets/portraits/*.jpg` into `assets/images/`, sorting by subject:
   - `npcs/`: `captain_vance`, `dr_lyra`, `apex`, `merchant`
   - `enemies/`: `xenobot`, `mutated_crewmate`, `eldritch_shade`, `void_stalker`, `cryo_drake`, `magma_elemental`, `corsair_raider`, `plasmavore`, `sand_worm`, `void_sentinel`
   - `locations/`: leave empty for now (no art exists yet)
4. **Leave `assets/portraits/` untouched.** `CLAUDE.md` says don't delete anything without asking — the originals stay as masters for re-encoding.
5. Report the before/after byte totals.

---

## Phase 2 — The image registry (`data/imagery.js`)

A new **pure-data** file, no logic, following the `data/` rules. It maps game IDs to image records. Every consumer looks up through this file; nothing hardcodes a path.

```js
// data/imagery.js
export const IMAGE_BASE = 'assets/images/';

/** @typedef {{ path: string, alt: string, caption?: string, accent?: string }} ImageRecord */

export const npcImages = {
  vance:  { path: 'npcs/captain_vance', alt: 'Captain Valen Vance, cyborg scrapper',      accent: 'blue'  },
  lyra:   { path: 'npcs/dr_lyra',       alt: 'Dr. Lyra, android medic',                   accent: 'cyan'  },
  apex:   { path: 'npcs/apex',          alt: 'Apex, human smuggler',                      accent: 'red'   },
  // nesta, thorne, mercer, delegates, ai, terminal, generic → no art yet, intentionally absent
};

export const enemyImages = { /* keyed by the exact `name` string in data/enemies.js */ };
export const bossImages   = { /* keyed by the `id` in data/enemies.js bosses[] */ };
export const locationImages = { /* keyed by location id from data/locations.js */ };
export const districtImages = { /* keyed by district id */ };
export const eventImages    = { /* keyed by event/scene slug */ };
```

Rules:

- **Keys must match existing game IDs exactly** so lookups need no translation layer. NPC keys match the `NPCS` map in `systems/ui/dialogue-ui.js` (`vance`, `lyra`, `apex`, `nesta`, `thorne`, `mercer`, `delegates`, `ai`, `terminal`, `generic`). Enemy keys match the `name` field in `data/enemies.js` (`"Xenobot"`, `"Sand Worm"`, …). Boss keys match `bosses[].id` (`boss_terra`, `boss_derelict`, …). Location keys match `data/locations.js` (`terra_prime`, `xylo_delta`, `nebula_outpost`, `norkon_outpost`, `inferno_ix`, `crio_prime`, `galactic_nexus`). District keys match `districts[].id`.
- `path` is **extension-less and relative to `IMAGE_BASE`** — the renderer appends `.webp` / `.jpg` / `-thumb.webp`.
- `accent` is one of the `ui_overhaul_plan.md` functional colors (`orange`, `red`, `green`, `blue`, `cyan`, `amber`) and drives the frame glow.
- **A missing key is a supported state, not a bug.** Only include entries whose files actually exist on disk. Stub every remaining ID as a comment so the gaps are visible to whoever adds art next.
- Also write `docs/imagery_manifest.md`: a table of every ID the game can request, whether art exists, and the emoji currently standing in. That is the shopping list for future art.

---

## Phase 3 — The viewscreen module (`systems/ui/viewscreen.js`)

### DOM

Add the panel to `index.html`. Place it inside the exploration/main screen layout where it stays visible during normal play — a right-hand column or a header-adjacent panel, whichever fits the existing grid without pushing the action console below the fold. Match the existing markup style (Tailwind utility classes + the project's semantic classes).

```html
<div id="viewscreenPanel" class="viewscreen-panel viewscreen-glass-container">
  <div class="viewscreen-frame">
    <picture id="viewscreenPicture">
      <source id="viewscreenWebp" type="image/webp" srcset="">
      <img id="viewscreenImage" src="" alt="" loading="lazy" decoding="async">
    </picture>
    <div id="viewscreenFallback" class="viewscreen-fallback">🛰️</div>
    <div class="hologram-scanline"></div>
  </div>
  <div class="viewscreen-caption">
    <span id="viewscreenLabel" class="viewscreen-label">STANDBY</span>
    <span id="viewscreenSubLabel" class="viewscreen-sublabel"></span>
  </div>
</div>
```

### Public API

```js
export function initViewscreen(deps) {}

/**
 * Request the viewscreen show a scene.
 * @param {object} scene
 * @param {'npc'|'enemy'|'boss'|'location'|'district'|'event'} scene.kind
 * @param {string} scene.id        - registry key
 * @param {string} [scene.label]   - caption line 1; defaults to a sensible name
 * @param {string} [scene.sub]     - caption line 2 (faction, hazard level, HP, …)
 * @param {string} [scene.emoji]   - fallback glyph when no image is registered
 * @param {number} [scene.priority]
 */
export function setScene(scene) {}

/** Pop back to whatever scene was showing before the current one. */
export function clearScene(kind) {}

/** Force the viewscreen back to the ambient location scene. */
export function resetViewscreen() {}

/** Warm the cache for images the player is about to need. */
export function preloadScenes(scenes) {}
```

### Behavior

- **Priority stack, not a single slot.** Scenes push onto a stack ordered by priority; the highest-priority active scene renders. Defaults: `event` 40 > `boss` 35 > `enemy` 30 > `npc` 20 > `district` 15 > `location` 10 (ambient). When combat ends, popping the enemy scene reveals the location scene underneath with no explicit re-set needed. This is what makes the panel feel like it tracks the game rather than being manually driven from a dozen call sites.
- **Graceful fallback is the core contract.** If `data/imagery.js` has no entry for the requested key, hide `<picture>`, show `#viewscreenFallback` with the emoji the caller passed (or the module's per-kind default), and still render the caption. The panel is never empty and never shows a broken-image icon. Also wire `img.onerror` to the same fallback path so a missing file at runtime degrades identically.
- **Crossfade, not a jump cut.** Swapping scenes fades out over ~200 ms, swaps `src`/`srcset`, fades in. Preload the new image (`new Image()`, resolve on `decode()`) before starting the fade-in so there is no flash of empty frame.
- **Accent-driven frame.** The record's `accent` sets a `data-accent` attribute on `#viewscreenPanel`; CSS maps that to the border and glow color from the `ui_overhaul_plan.md` token set.
- **Caption is theme-aware.** Run label text through `t()` / `tToken()` from `systems/theme-engine.js` exactly as `dialogue-ui.js` does — the theme engine is the genre switch and label strings must not bypass it.
- **No `localStorage` writes** beyond the existing settings key.

### Wiring in `game.js`

Follow the existing pattern: `initViewscreen(deps)` is called from `initUI()` in `systems/ui.js` alongside `initDialogueUI(deps)` and `initDistrictsUI(deps)`. Expose `setScene` / `resetViewscreen` on `deps.ui` so other UI sub-modules reach it through injection rather than by importing each other directly.

---

## Phase 4 — Hook it up

Add `setScene` calls at these points. Keep each hook to one or two lines; do not restructure the calling modules.

| Trigger | Where | Scene |
|---|---|---|
| Arrive at a planet | `systems/locations.js` → `travelTo()` | `{kind:'location', id, label:name, sub:'HAZARD LVL n', emoji:'🪐'}` |
| Enter a district | `systems/ui/districts-ui.js` | `{kind:'district', id, label:name, emoji:district.icon}` |
| Dialogue opens | `systems/ui/dialogue-ui.js` → `showDialogue()`, after `identifySpeaker()` | `{kind:'npc', id:speaker.key, label:speaker.name, sub:speaker.faction, emoji:speaker.avatar}` |
| Dialogue closes | `hideDialogue()` | `clearScene('npc')` |
| Combat starts | `systems/combat.js` → `encounterEnemy()` | `{kind:'enemy', id:enemy.name, label:enemy.name, sub:'HP x/y'}` |
| Boss starts | `encounterBoss()` | `{kind:'boss', id:boss.id, …}` |
| Combat resolves | `winCombat()` and the defeat path | `clearScene('enemy')` / `clearScene('boss')` |
| Derelict boarding | `systems/derelict.js` → `startDerelictRun()` | `{kind:'event', id:'derelict_boarding', emoji:'🛸'}` |
| Travel animation | `systems/ui.js` → `playTravelAnimation()` | `{kind:'event', id:'hyperspace', emoji:'✨'}`, cleared on arrival |

Two more touches, both using the `-thumb.webp` variant:

- **Dialogue overlay:** in `#dialogueNpcPanel`, render the NPC's thumb *in place of* the emoji in `#dialogueAvatar` when art exists, keeping the emoji as the fallback. This is the moment Scott called out specifically — talking to an NPC should show their face.
- **Companions panel:** `systems/ui/companions-ui.js` shows `COMPANIONS[x].avatar` emoji on the crew cards. Show the thumb where one is registered (`vance`, `lyra`, `apex` all have art).

Preload on transition: when combat is about to start, call `preloadScenes()` for the enemy image; when the player docks, preload that planet's district images.

---

## Phase 5 — Settings, styling, tests

1. **Setting toggle.** Add `showImages: true` to `currentSettings` in `systems/settings.js` with `getShowImages()` / `setShowImages()` persisting to the existing `galactic_odyssey_settings` key, and a checkbox in `systems/ui/settings-ui.js` labeled something like "Viewscreen Imagery". When off, the viewscreen renders emoji-only — the pre-existing experience, intact. This is both an accessibility affordance and the escape hatch for slow connections.
2. **CSS** goes at the bottom of `style.css` in a clearly commented `/* === Viewscreen === */` block, reusing the `ui_overhaul_plan.md` variables. Include: the glass container, a 1:1 aspect-ratio frame with `object-fit: cover`, the six `data-accent` color variants, the crossfade transition, the scanline overlay, and a `@media (max-width: 768px)` rule that collapses the panel to a shorter banner rather than hiding it.
3. **Respect `prefers-reduced-motion`** — disable the crossfade and scanline animation.
4. **Tests** in `tests/systems/viewscreen.test.js` (jsdom), covering at minimum:
   - a registered key renders `<picture>` with the right `srcset` and hides the fallback
   - an **unregistered** key hides `<picture>` and renders the emoji fallback with the caption still populated
   - `img.onerror` falls back to emoji
   - the priority stack: pushing `enemy` over `location` shows the enemy; `clearScene('enemy')` restores the location
   - `showImages: false` forces the emoji path regardless of registry contents
   Add a `data/imagery.test.js` assertion that every key in the registry corresponds to a real ID in `data/enemies.js` / `data/locations.js` / the `NPCS` map — a typo'd key is otherwise a silent no-op.
5. Run `npm test`. Then open `index.html` and manually verify: start a game, travel between two planets, enter a district, talk to Vance, fight an enemy with art, fight an enemy *without* art, board a derelict, toggle the setting off and on.

### Update these docs when done

- `docs/todo.md` — the UI/UX section has unchecked visual items; add and check off the viewscreen work.
- `docs/imagery_manifest.md` — the art gap list from Phase 2.
- `docs/GalacticQuest.md` — add the viewscreen to the architecture reference.
- `CLAUDE.md` — one line under Architecture noting that `data/imagery.js` is the image registry and that missing keys are an intentional fallback state.

### Constraints

- Vanilla ES6 modules only. No new runtime dependencies — `sharp` is a devDependency used by the offline optimize script only, never at page load.
- No build step for playing the game; `index.html` must still open straight from disk.
- Do not modify `assets/portraits/` or delete anything.
- Emoji remain the guaranteed baseline. Every emoji visible today must still be visible if `assets/images/` were deleted entirely.
