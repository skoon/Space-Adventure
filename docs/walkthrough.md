# Walkthrough — Visual Overhaul, Vocabulary Generalization & Dynamic Outcomes

This document summarizes the changes, rendering adjustments, and verification results for the completed development features in *Galactic Odyssey*. 

---

## 1. Option 1: UI Overhaul (Visuals & Glassmorphism)

The entire visual system was refactored to use a premium, modern glassmorphic look matching the visual language of the Photon Prime store mockup, adapting neon highlights dynamically to the function of each panel.

### A. Style Sheet Upgrades (`style.css`)
*   **Design Tokens:** Added CSS custom variables under `:root` for glass backdrops and neon glows.
*   **Semantic Glass Containers:**
    *   `.combat-glass-container` (Red/Orange outline, warning glows)
    *   `.photon-glass-container` (Deep orange commerce glow)
    *   `.spec-glass-container` (Emerald green biotech glow)
    *   `.travel-glass-container` (Nebula blue starmap glow)
    *   `.derelict-glass-container` (Radioactive amber danger glow)
    *   `.dialogue-glass-container` (Holographic cyan com-link glow)
*   **HUD Nodes & Holograms:**
    *   `.ap-node` and `.ap-node.spent` for inline capsule render styling.
    *   `.dialogue-hologram` scanline grid animations.
    *   `.hologram-flicker` class for transient entrance distortion filters.
    *   `.dice-container-glow` for virtual d20 panels.

### B. Markup Refactoring (`index.html`)
*   **Combat Panel:** Changed player and enemy status cards to `.combat-glass-container`. Replaced the plain text AP counters and progress bar with the `#combatApNodes` capsule drawer.
*   **Dialogue Panel:** Swapped out old cyan CRT containers for `.dialogue-glass-container dialogue-hologram`, and added `.dice-container-glow` to the roll d20 display slot.
*   **Spacecraft Hub Modal:** Swapped out default panels for `.spec-glass-container` (emerald biotech).
*   **Travel Navigation Modal:** Upgraded to `.travel-glass-container` (deep blue).
*   **Photon Prime Modal:** Replaced the default modal outline with `.photon-glass-container` (orange).
*   **Derelict HUD:** Swapped screen background card to `.derelict-glass-container` and swapped the oxygen bar to `.oxygen-bar-fill`.

### C. Dungeon Raycasting Adjustments (`dungeon-renderer.js`)
*   **Environment Mapping:** Swapped the default cyan/green vector lines to radioactive amber (`#ffb800`).
*   **Background/Horizon:** Cleared canvas background to warm amber-black (`#0a0601`) and horizon to amber overlay.
*   **Wireframes:** Re-shaded wall outlines (`rgba(255, 184, 0, ...)`) and ceiling/floor perspective lines to follow the amber theme.
*   **Minimap Scanner:** Set scan lines and empty hallway indicators to amber glow, and updated the player arrow pointer on radar to `#ffb800`.

### D. Animations & Logic Hooks
*   **[`dialogue-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dialogue-ui.js):** Implemented a transient entrance trigger: on `showDialogue()`, the element gains `.hologram-flicker` for 300ms, then settles.
*   **[`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js):** Updated `updateCombatUI()` to map the player's active and spent AP to the `#combatApNodes` container as inline capsule elements.

---

## 2. Option 2: Generalize the Engine Vocabulary

We externalized sci-fi/space strings and integrated them into the translation engine to support full configurability via `data/theme.js`.

### A. Vocabulary Database Mapping (`data/theme.js`)
*   Created a comprehensive vocabulary mapping dictionary (`vocab`) inside the active theme configuration.
*   The mappings include key space-specific phrases and Proper Nouns (e.g. `Xenobots`, `Terra Prime`, `Cyborg Scrapper`, `Scrap Metal`, `comms array`, `hyperdrive`, `deflector shields`, etc.) mapping to theme-specific variants.

### B. Case-Preserving Lookups (`systems/theme-engine.js`)
*   Refactored the dynamic string translation function `t(text)`.
*   Added a case-preserving replacement pipeline utilizing word boundaries (`\b`) to avoid partial matching bugs.
*   Preserves formatting for:
    1.  **ALL CAPS:** `XENOBOT` -> `XENOBOT`
    2.  **Title Case:** `Deflector Shields` -> `Deflector Shields` (Multi-word preservation)
    3.  **Capitalized First Letter:** `Xenobots are hostile.` -> `Xenobots are hostile.`
    4.  **Lowercase:** `comms array` -> `comms array`

### C. System Refactoring for Translation Compliance
*   **[`districts-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/districts-ui.js):** Imported translation logic and wrapped location names, district titles, descriptions, headers, and exploration logs in `t()`.
*   **[`companions-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/companions-ui.js):** Wrapped cabin/quarters titles, inspection descriptions, gift labels, and recruitment headers/buttons in `t()`.
*   **[`inventory-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/inventory-ui.js):** Wrapped category tab headers (`cat`), item names, types, descriptions, price values, and tooltips comparison strings in `t()`.
*   **[`ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui.js):** Wrapped current sector locations, character race/role displays, Quick Crew companion stats, ability descriptors, and spaceship upgrading/recharge module panels in `t()`.

---

## 3. UI Overlay & Glassmorphism Polish

To ensure the glassmorphism visual upgrades are fully visible and shine against the active starfield background rather than being obscured by flat opaque blocks, the following polishing enhancements were implemented:

*   **Semi-Transparent Blurs:** Upgraded the overlay modal backgrounds for `travelScreen`, `shopScreen`, `jobBoardModal`, `skillsModal`, `districtsModal`, and `attributesModal` from opaque black (`bg-black bg-opacity-90`) to a premium semi-transparent layout with active blur: `bg-black/45 backdrop-blur-[3px]`.
*   **Thematic Container Conversions:** Converted flat modal containers (`cyber-modal-cyan`, etc.) to use corresponding glassmorphic styles (`travel-glass-container` or `spec-glass-container` or `dialogue-glass-container`).
*   **Opaque Element Cleanups:** Removed flat opaque gray blocks (`bg-gray-700`) from shop tab panels, item listing cards (buy/sell containers), and close buttons. Replaced them with glassmorphic semi-transparent orange outlines (`bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20`) and custom active hover states.

---

## 4. Option 3: Dynamic Galactic Outcomes & Endings

We implemented the state flags, branching narrative choice trackers, dynamic pricing changes, and NPC occupation swaps.

### A. State Variable Integration
*   **`state.worldFlags`:** Introduced a global world tracking container initialized as an empty object `{}` upon character creation inside **[`character.js`](file:///d:/source/Roogames/Space%20Adventure/systems/character.js)**.
*   **Serialization Support:** Updated **[`saveload.js`](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js)** to serialize and restore `state.worldFlags` on saving and loading game sessions.

### B. Narrative Quest Hooks (`systems/quests.js`)
*   **Act II Completion Sway:**
    *   Completing `story_act2_fed` (or its class variants) sets `state.worldFlags.factionSway = "federation"`.
    *   Completing `story_act2_cor` sets `state.worldFlags.factionSway = "corsairs"`.
    *   Completing `story_act2_syn` sets `state.worldFlags.factionSway = "syndicate"`.
*   **Act III Summit Choices:**
    *   Choice index 0 sets `state.worldFlags.endingReached = "federation"` and `state.worldFlags.factionSway = "federation"`.
    *   Choice index 1 sets `state.worldFlags.endingReached = "corsairs"` and `state.worldFlags.factionSway = "corsairs"`.
    *   Choice index 2 sets `state.worldFlags.endingReached = "syndicate"` and `state.worldFlags.factionSway = "syndicate"`.
    *   Choice index 3 sets `state.worldFlags.endingReached = "coalition"` and `state.worldFlags.factionSway = "coalition"`.
*   **Act I Alliance Choice:** Selecting a faction in `quest_branch_01` sets `state.worldFlags.allianceChoice` to that faction.

### C. Dynamic Planet-Wide Consequences
*   **Commerce & Pricing:** Updated **[`shop.js`](file:///d:/source/Roogames/Space%20Adventure/systems/shop.js)**'s `getLocalShopFaction()` to dynamically return the `factionSway` value (overriding the planet's native owner). Prices globally adapt to the player's reputation with the dominant faction.
*   **Coalition Open Trade Bonus:** Under `coalition` sway, players get a flat **15% discount** on all item purchases (`getItemPrice`) and a **15% bonus** on item sales (`getItemSellPrice`).
*   **NPC Occupation Swaps:**
    *   In **[`districts-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/districts-ui.js)**, the district renderer checks the active `factionSway`. If a faction holds sway, it swaps the local NPCs to the occupying faction (e.g. Vance occupies Xylo Delta, Nesta occupies Terra Prime).
    *   Interacting with an occupying NPC outside their home planet triggers custom occupation dialogue (e.g., Vance coordinates a military lockdown, Nesta gloops about looting high-tech toys, Thorne mentions repurposing facilities).

---

## 5. Verification & Testing

### Automated Test Suites
*   Created a dedicated unit test suite **[`tests/systems/dynamic_outcomes.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/dynamic_outcomes.test.js)** to verify:
    1.  `worldFlags` are set correctly on quest completions and choice outcomes.
    2.  Merchant pricing maps to the global sway faction and reputation.
    3.  Flat 15% Coalition discounts are applied properly.
    4.  Planetary districts swap NPCs and show occupation dialogues.
*   **Test Results:** All Jest unit tests passed successfully.
    *   **Total passed:** 38 test suites / 256 test cases.
