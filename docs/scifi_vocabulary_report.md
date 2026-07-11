# Codebase Sci-Fi & Space Vocabulary Audit

This report documents all occurrences of Science Fiction and Space-genre-specific terminology (e.g., function names, variable keys, DOM IDs, and hardcoded player-facing strings) found outside of the `data/` directory. Identifying these hardcoded terms is a crucial step toward generalizing the primary engine to support other settings like fantasy, superhero, or steampunk.

---

## 1. Hardcoded Schema Keys & Variable Names

These represent structural keys in the state database that are tied specifically to the Sci-Fi genre. Changing these requires mapping them to generic equivalents during refactoring.

* **Vessel Systems (`state.character.ship`):**
  * References in: [character.js](file:///d:/source/Roogames/Space%20Adventure/systems/character.js), [saveload.js](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js), [ship.js](file:///d:/source/Roogames/Space%20Adventure/systems/ship.js)
  * Keys: `engineLevel`, `medbayLevel`, `cargoLevel`, `scannerLevel`, `shieldLevel`, `weaponsLevel`, `shields`, `maxShields`.
* **Cybernetic System (`state.character.cybernetics`):**
  * References in: [character.js](file:///d:/source/Roogames/Space%20Adventure/systems/character.js), [saveload.js](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js), [cybernetics.js](file:///d:/source/Roogames/Space%20Adventure/systems/cybernetics.js), [combat.js](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js)
  * Slots: `head`, `arms`, `torso`, `nervous`.
  * Implant identifiers: `targeting_matrix`, `reflex_boosters`, `subdermal_plating`, `synaptic_accelerator`.
* **Survival Mechanic (`state.derelict.oxygen`):**
  * References in: [derelict.js](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js), [combat.js](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js), [ui.js](file:///d:/source/Roogames/Space%20Adventure/systems/ui.js)
  * Keys: `oxygen`, `maxOxygen`.

---

## 2. Hardcoded Logs, Dialogues, and UI Labels

These are string constants that players see on screen that are hardcoded directly into the JavaScript files.

### A. Narrative & District Quests
* **File:** [districts-ui.js](file:///d:/source/Roogames/Space%20Adventure/systems/ui/districts-ui.js)
  * Sector Locations: `Terra Prime`, `Nebula Outpost`, `Crucible Summit Hall`, `Smuggler's Den`, `Xylo Delta`.
  * Plot vocabulary: `Captain Vance of the Federation garrison`, `Xenobot activity`, `scrap metal`, `comms array`, `customs blockades`, `hyperdrive schematics`, `Precursor weapons cache`.
  * Sidequests: `"Any luck snatching that Plasma Core from the Federation depot?"`, `"heavy salvage laser"`.

### B. Companions & Housing
* **File:** [companions.js](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js)
  * Roles & Profiles: `Cyborg Scrapper`, `Android Medic`, `Human Smuggler`.
  * Greetings: `"Ready to scrap some metal"`, `"My cybernetics are fully charged"`, `"Analyzing biological signatures"`.
* **File:** [companions-ui.js](file:///d:/source/Roogames/Space%20Adventure/systems/ui/companions-ui.js)
  * Quarters names: `Vance's Heavy Scrap Workshop`, `Dr. Lyra's Clinical Lab`, `Apex's Smuggler Holdout`.
  * Quarters inspection descriptions: references to `copper wiring`, `half-dismantled weapon chassis`, `hydraulic oil`, `bio-gels`, `surgical cot`, `DNA sequence graphs`, `Sabacc table`, `holograms of playing cards`, `contraband`.

### C. Combat System
* **File:** [combat.js](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js)
  * Status logs: `💨 Vacuum: Drained 1 unit of Oxygen!`, `⚠️ Out of Oxygen! Suffocating...`, `🦾 CYBERNETICS: Reflex Boosters activated!`, `🛡️ CYBERNETICS: Sub-dermal Plating converted...`, `🦾 SYNERGY: Cybernetic Overcharge...`.
  * Elements: `Thermal`, `Cryo`, `Plasma`, `Corrosive`.

### D. Travel & Hyperdrive transitions
* **File:** [locations.js](file:///d:/source/Roogames/Space%20Adventure/systems/locations.js)
  * Ambush alerts: `"🚨 AMBUSH! Hostile Void Corsair / Federation forces intercepted your ship in transit!"`.
  * Transition text: `"🩺 Medbay healed you... during travel"`.

---

## 3. DOM IDs & CSS Class Names

These identifiers bind the HTML DOM layout to specific Sci-Fi visual motifs.

* **HTML Element IDs ([index.html](file:///d:/source/Roogames/Space%20Adventure/index.html)):**
  * Modals & Tabs: `shipHubModal`, `shipSystemsPanel`, `shipCrewPanel`, `shipCyberneticsPanel`, `tabShipSystems`, `tabCrewQuarter`, `tabCybernetics`, `travelAnimationOverlay`.
  * Headers: `>> SPACECRAFT HUB <<`.
  * Transition banners: `INITIATING HYPERDRIVE...`.
* **CSS Classes ([style.css](file:///d:/source/Roogames/Space%20Adventure/style.css)):**
  * Themes & Effects: `.crt-cyan-large`, `.cyber-panel-cyan`, `.hologram-scanline`, `.stars-background`, `.cyber-glow-text`.

---

## 4. Generalization Roadmap

To transition this from a Space Adventure into a thematic engine that supports other genres (e.g., fantasy, steampunk), I recommend the following structural adjustments:

1. **Vocabulary Localization File (`theme.js`):**
   * Move all player-facing UI labels into a translation/localization vocabulary dictionary. E.g., `theme.ui.ship` resolves to `"Spaceship"` in Sci-Fi, `"Guild Hall"` in Fantasy, and `"Zeppelin"` in Steampunk.
2. **Rename Database Keys (Schema Generalization):**
   * Refactor structural keys inside `state` to be theme-neutral:
     * `state.character.ship` $\rightarrow$ `state.character.base`
     * `state.character.cybernetics` $\rightarrow$ `state.character.enhancements`
     * `state.derelict` $\rightarrow$ `state.dungeon`
     * `state.derelict.oxygen` $\rightarrow$ `state.dungeon.timer` or `state.dungeon.hazardShield`
     * `credits` $\rightarrow$ `currency`
3. **Generic Component Naming:**
   * Rename codebase files from genre-specific terms to mechanical terms:
     * `ship.js` $\rightarrow$ `base-operations.js`
     * `cybernetics.js` $\rightarrow$ `enhancements.js`
     * `derelict.js` $\rightarrow$ `dungeons.js`
