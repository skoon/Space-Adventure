# GalacticQuest — Living Project Reference

> **Last Updated:** 2026-07-20  
> **Project Name:** Galactic Odyssey (codebase root: `Space Adventure`)  
> **Tech Stack:** Vanilla JavaScript (ES6+ Modules), HTML5, CSS3  
> **Entry Point:** [`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html)  
> **Coordinator:** [`game.js`](file:///d:/source/Roogames/Space%20Adventure/game.js)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture at a Glance](#2-architecture-at-a-glance)
3. [Completed Features](#3-completed-features)
4. [Pending / In-Progress Features](#4-pending--in-progress-features)
5. [Future Roadmap](#5-future-roadmap)
6. [Theme Engine — Adapting to Other Genres](#6-theme-engine--adapting-to-other-genres)
7. [Testing Infrastructure](#7-testing-infrastructure)
8. [Key Files Quick Reference](#8-key-files-quick-reference)
9. [How to Run the Game](#9-how-to-run-the-game)

---

## 1. Project Overview

**Galactic Odyssey** is a browser-based, text-driven sci-fi RPG that runs entirely in vanilla JavaScript — no build step required for play, only for tests. The game features:

- Turn-based tactical combat with elemental damage, stagger/break gauges, and role stances
- A deep narrative quest system with branching story arcs, NPC memory, and faction allegiances
- Pseudo-3D first-person dungeon exploration inside derelict spaceships (raycasting renderer)
- A modular, dependency-injected system architecture designed to be **genre-agnostic**

> [!IMPORTANT]
> The project is now at **mid-to-late feature completeness** for its Space Adventure setting. The engine is ready to be generalized to fantasy, steampunk, superhero, or other themes — this is a **primary strategic goal** for the next phase.

---

## 2. Architecture at a Glance

The game is fully modularized. [`game.js`](file:///d:/source/Roogames/Space%20Adventure/game.js) acts as a thin coordinator that imports and wires all systems together via dependency injection.

### Module Dependency Tree

```
game.js (coordinator / wiring)
│
├── systems/
│   ├── combat.js           ← Tactical combat, status effects, stances, stagger
│   ├── quests.js           ← Branching quest state machine, NPC memory, roll engine
│   ├── equipment.js        ← Equip/unequip, effective stat calculation
│   ├── character.js        ← Creation, XP/leveling, stat allocation
│   ├── exploration.js      ← Random events, travel mechanics
│   ├── events.js           ← Random event generation & handling
│   ├── saveload.js         ← LocalStorage multi-slot persistence, export/import
│   ├── ui.js               ← Screen management, logs, notifications (coordinator)
│   ├── inventory.js        ← In-combat item usage
│   ├── locations.js        ← Travel, faction ambushes, location details
│   ├── shop.js             ← Buy/sell, Photon Prime online ordering, drop boxes
│   ├── market.js           ← Dynamic commodity market, news event price tickers
│   ├── crafting.js         ← Recipe-based crafting, recipe discovery
│   ├── settings.js         ← Difficulty levels
│   ├── ship.js             ← Ship module upgrades (engine, medbay, cargo, shields, weapons)
│   ├── derelict.js         ← Procedural maze generation, raycasting exploration
│   ├── skills.js           ← Skill tree / unlockable abilities
│   ├── upgrades.js         ← Upgrade management
│   ├── achievements.js     ← Achievement tracking & rewards
│   ├── companions.js       ← Crew recruitment, loyalty, trust, banter events
│   ├── cybernetics.js      ← Implant slots, nanite mod chips, synergies, instability
│   ├── rarity.js           ← Item rarity (Common → Legendary) logic
│   └── theme-engine.js     ← Vocabulary translation & DOM theming
│
├── systems/ui/             ← Sub-modules for complex UI panels
│   ├── achievements-ui.js
│   ├── attributes-ui.js
│   ├── companions-ui.js
│   ├── crafting-ui.js
│   ├── cybernetics-ui.js
│   ├── dialogue-ui.js      ← NPC dialogue overlay, d20 dice-roll animation
│   ├── districts-ui.js     ← Planetary hub / district rendering
│   ├── dungeon-renderer.js ← HTML5 Canvas raycasting renderer
│   ├── inventory-ui.js
│   ├── logger.js
│   ├── notifications.js
│   ├── quest-ui.js
│   ├── saveload-ui.js
│   ├── settings-ui.js
│   ├── shop-ui.js
│   └── travel-ui.js
│
└── data/                   ← Pure data (no logic)
    ├── quests.js           ← Full quest library (branching, multi-act)
    ├── enemies.js          ← Enemy & boss definitions
    ├── items.js            ← Weapons, armor, accessories, consumables
    ├── locations.js        ← Planet/location definitions
    ├── recipes.js          ← Crafting recipes
    ├── cybernetics.js      ← Implant definitions & nanite mod chips
    ├── theme.js            ← Active theme vocabulary tokens ← KEY FOR GENERALIZATION
    └── version.js
```

### State Object Shape (character)

```javascript
state.character = {
  name, race, role, level, xp, hp, maxHp,
  attack, defense, energy, maxEnergy,
  strength, agility, intelligence, charisma,
  ap, maxAp,
  equipment: { weapon, armor, accessory },
  skillPoints, unlockedSkills,
  specializationPoints, unlockedSpecializations,
  statPoints, narrativePoints,
  storyline: { act, alignment, variables },
  inventory: [],
  activeQuests: {}, completedQuests: [],
  credits, pendingOrders, knownRecipes,
  ship: { engineLevel, medbayLevel, cargoLevel, scannerLevel, shieldLevel, weaponsLevel, shields, maxShields },
  factions: { federation, corsairs, syndicate },
  npcs: { vance, mercer, thorne, nesta }   // disposition + memoryFlags per NPC
}
```

---

## 3. Completed Features

### ✅ Core Character & Progression

| Feature | Details | Key Files |
|---|---|---|
| **Character Creation** | Name, Race, Role selection; role determines base stats (HP, ATK, DEF, Energy) | [`character.js`](file:///d:/source/Roogames/Space%20Adventure/systems/character.js) |
| **3 Playable Roles** | Warrior (tank), Rogue (DPS/crit), Scientist (support/utility) | [`character.js`](file:///d:/source/Roogames/Space%20Adventure/systems/character.js) |
| **XP & Leveling** | XP bar visualization, level-up notification, stat increases | [`character.js`](file:///d:/source/Roogames/Space%20Adventure/systems/character.js) |
| **Manual Stat Allocation** | Stat points on level-up (STR, AGI, INT, CHA) with role recommendations | [`attributes-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/attributes-ui.js) |
| **Skill Tree** | Role-specific unlockable abilities & passive bonuses via Skill Points | [`skills.js`](file:///d:/source/Roogames/Space%20Adventure/systems/skills.js) |
| **Specialization Trees** | Deep branching tech trees: Heavy Combat, Nano-Biotech, Cyber-Hacking | [`cybernetics.js`](file:///d:/source/Roogames/Space%20Adventure/systems/cybernetics.js) |
| **Item Rarity System** | Common → Rare → Epic → Legendary tiers with visual indicators | [`rarity.js`](file:///d:/source/Roogames/Space%20Adventure/systems/rarity.js) |

---

### ✅ Tactical Combat System

| Feature | Details | Key Files |
|---|---|---|
| **Action Point (AP) System** | 3 AP per turn; attack, block, dodge, items, stances cost AP | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Elemental Damage Types** | Physical, Thermal, Cryo, Plasma, Corrosive | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Status Effects** | Burning (DoT), Frozen (-AP), Electrified (Shock trigger), Melted (-DEF) | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Elemental Combos** | Shatter (Physical→Frozen = 2× dmg), Shock (Plasma→Electrified = stun) | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Stagger / Break Gauge** | Enemy break gauge; hitting 0 = Broken (stunned, 2× damage taken for 1 turn) | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Role Combat Stances** | Warrior: Vanguard/Berserker; Rogue: Shadow/Skirmisher; Scientist: Support Overclock/Disruption | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Block / Dodge Actions** | Block = 50% dmg reduction; Dodge = 30% avoidance chance | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Special Role Abilities** | Power Strike, Assassinate, Shield Boost | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Environmental Modifiers** | High Gravity (+AP cost), Solar Radiation (energy drain), Vacuum (oxygen drain) | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Boss Battles** | Phased boss mechanics, unique loot drops, HP bars | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js), [`data/enemies.js`](file:///d:/source/Roogames/Space%20Adventure/data/enemies.js) |
| **Companion Combat AI** | Active companions assist in battle; cooldown management per turn | [`companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) |
| **In-Combat Item Use** | Grenades (Frag, EMP), stims, consumables usable during battle | [`inventory.js`](file:///d:/source/Roogames/Space%20Adventure/systems/inventory.js) |
| **Critical Hit System** | 15% base, 25% Rogue; Targeting Matrix implant boosts crit multiplier | [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |

---

### ✅ World & Exploration

| Feature | Details | Key Files |
|---|---|---|
| **Multiple Planets/Locations** | Terra Prime, Nebula Outpost, Crucible Summit, Inferno-IX, Cryo-Prime, Xylo Delta, Space Hub | [`data/locations.js`](file:///d:/source/Roogames/Space%20Adventure/data/locations.js) |
| **Location-Specific Enemies** | Magma Elementals (Inferno-IX), Frost Parasites (Cryo-Prime), Eldritch Shades (Derelict) | [`data/enemies.js`](file:///d:/source/Roogames/Space%20Adventure/data/enemies.js) |
| **Planetary Travel System** | Ship Hub travel with engine-level gating; inter-transit ambush events | [`locations.js`](file:///d:/source/Roogames/Space%20Adventure/systems/locations.js), [`travel-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/travel-ui.js) |
| **Faction Travel Ambushes** | Hostile reputation (<-30) triggers combat intercepts in transit | [`locations.js`](file:///d:/source/Roogames/Space%20Adventure/systems/locations.js) |
| **Random Events** | NPC merchants, radiation storms, asteroid fields, abandoned outposts, ancient ruins | [`events.js`](file:///d:/source/Roogames/Space%20Adventure/systems/events.js) |

---

### ✅ Derelict Ship Dungeons

| Feature | Details | Key Files |
|---|---|---|
| **10% Encounter Chance** | Random distress signal during planetary transit | [`derelict.js`](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js) |
| **Procedural 8×8 Maze** | Walls, hallways, locked doors, terminals generated at runtime | [`derelict.js`](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js) |
| **Pseudo-3D Raycasting View** | 60° FOV, depth-shaded corridors, billboarded sprites on HTML5 Canvas | [`dungeon-renderer.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dungeon-renderer.js) |
| **WASD/Arrow Navigation** | Turn left/right, move forward, wall collision detection | [`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html), [`derelict.js`](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js) |
| **Tactical Radar Minimap** | Top-down overlay showing explored cells and airlock path | [`dungeon-renderer.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dungeon-renderer.js) |
| **Oxygen Survival Mechanic** | 10–15 O₂ units = turn limit; death = lose all unsecured loot + 25% max HP | [`derelict.js`](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js) |
| **Room Event Rolls** | Combat (40%), Loot (30%), Hazards (20%), Empty (10%), scaling with depth | [`derelict.js`](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js) |
| **Void Sentinel Alpha Boss** | Room 6 boss fight; drops legendary blueprint on defeat | [`derelict.js`](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js), [`data/enemies.js`](file:///d:/source/Roogames/Space%20Adventure/data/enemies.js) |
| **Legendary Blueprint Drops** | Quantum Shield Core Recipe, Plasma Targeting HUD Recipe — secured on escape | [`crafting.js`](file:///d:/source/Roogames/Space%20Adventure/systems/crafting.js), [`data/recipes.js`](file:///d:/source/Roogames/Space%20Adventure/data/recipes.js) |

---

### ✅ Quest & Narrative System

| Feature | Details | Key Files |
|---|---|---|
| **Branching Quest State Machine** | Multi-stage quests with conditional branches, not just linear objectives | [`systems/quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js), [`data/quests.js`](file:///d:/source/Roogames/Space%20Adventure/data/quests.js) |
| **Main Story 3-Act Structure** | Act I (Signal), Act II (Faction Cold War × 3 paths), Act III (Crucible) | [`data/quests.js`](file:///d:/source/Roogames/Space%20Adventure/data/quests.js) |
| **Class-Specific Story Variants** | Main quests fork into `_warrior`, `_rogue`, `_scientist` variants | [`data/quests.js`](file:///d:/source/Roogames/Space%20Adventure/data/quests.js) |
| **NPC Turn-In Gating** | Quests with a `giver` enter `readyToTurnIn` state; require physical NPC visit | [`systems/quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) |
| **Persistent Named NPCs** | Captain Valen Vance, Jax "Sparky" Mercer, Dr. Elyse Thorne, Envoy Nesta | [`systems/quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) |
| **NPC Disposition & Memory** | Disposition scale −100→+100; `memoryFlags[]` store prior choices permanently | [`systems/character.js`](file:///d:/source/Roogames/Space%20Adventure/systems/character.js) |
| **d20 Dialogue Roll Engine** | `executeDialogueRoll()`: roll + stat modifier vs. DC; animated dice roll UI | [`systems/quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js), [`dialogue-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dialogue-ui.js) |
| **Attribute/Role-Gated Choices** | `[Hack Terminal] - Requires Scientist and INT 15`; color-coded locked/unlocked | [`dialogue-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dialogue-ui.js) |
| **Successor Quest Auto-Chain** | Completing Act I auto-accepts correct Act II branch per faction chosen | [`systems/quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) |
| **Location/Travel Quest Gating** | Planet-locked quests; travel-state event hooks for distress signals | [`systems/quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) |
| **Planetary Quest Board** | Quests categorized: Main Story, Sidequest, Faction Contract | [`quest-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/quest-ui.js) |

---

### ✅ Dynamic Galactic Outcomes & Branching Endings

| Feature | Details | Key Files |
|---|---|---|
| **`state.worldFlags` Global State** | Persistent world flags (`factionSway`, `endingReached`, `allianceChoice`, `gameCompleted`) initialized, saved/loaded, and DI-exposed | [`character.js`](file:///d:/source/Roogames/Space%20Adventure/systems/character.js), [`game.js`](file:///d:/source/Roogames/Space%20Adventure/game.js), [`saveload.js`](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js) |
| **World-State Hub Reshaping** | `factionSway` swaps NPCs across planetary districts and intercepts cross-planet dialogue with faction-specific greetings | [`districts-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/districts-ui.js) |
| **Dynamic Faction-Sway Pricing** | Global sway overrides local shop faction (discounts/markups); Coalition sway grants a flat 15% discount | [`shop.js`](file:///d:/source/Roogames/Space%20Adventure/systems/shop.js) |
| **Theatrical Epilogue Text-Crawl** | `showEpilogueCrawl()`: 45s Star-Wars-style crawl (skippable) triggered at Act III conclusion | [`dialogue-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dialogue-ui.js), [`quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) |
| **4 Distinct Endings** | Iron Order (Federation), Lawless Edge (Corsairs), Techno-Singularity (Syndicate), Unified Coalition — evaluated from Act III choice/world flags | [`quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js), [`dialogue-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dialogue-ui.js) |
| **Free-Roam Mode (Post-Epilogue)** | Dedicated post-summit "Free Roam" district states let the player continue interacting after the story concludes | [`districts-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/districts-ui.js) |

> Covered by [`dynamic_outcomes.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/dynamic_outcomes.test.js) (faction sway, Act III ending flags, dynamic pricing, NPC swapping).

---

### ✅ Factions & Economy

| Feature | Details | Key Files |
|---|---|---|
| **3-Faction Reputation** | Galactic Federation, Void Corsairs, Photon Prime Syndicate (−100→+100) | [`character.js`](file:///d:/source/Roogames/Space%20Adventure/systems/character.js) |
| **Dynamic Shop Multipliers** | +30% discount (friendly) to +50% markup (hostile) | [`shop.js`](file:///d:/source/Roogames/Space%20Adventure/systems/shop.js) |
| **Faction Board Contracts** | Gated job contracts requiring ≥+20 standing | [`quest-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/quest-ui.js) |
| **Faction Companion Unlock** | High reputation unlocks companion recruitment; hostile locks it | [`companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) |
| **Dynamic Commodity Market** | 8 commodities with supply/demand fluctuation; 5-tick sparkline charts | [`market.js`](file:///d:/source/Roogames/Space%20Adventure/systems/market.js), [`shop-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/shop-ui.js) |
| **News Event Tickers** | Syndicate Blockade, Solar Flare, Mining Boom, Pirate Raids → price multipliers | [`market.js`](file:///d:/source/Roogames/Space%20Adventure/systems/market.js) |
| **Interstellar Arbitrage** | Buy low at outposts, sell high at hubs, risk pirate intercepts | [`market.js`](file:///d:/source/Roogames/Space%20Adventure/systems/market.js), [`locations.js`](file:///d:/source/Roogames/Space%20Adventure/systems/locations.js) |
| **Shop / Photon Prime Ordering** | Buy/sell; online ordering from anywhere + drop-box pickup system | [`shop.js`](file:///d:/source/Roogames/Space%20Adventure/systems/shop.js) |
| **Crafting System** | Recipe-based crafting; blueprint discovery from derelict boss drops | [`crafting.js`](file:///d:/source/Roogames/Space%20Adventure/systems/crafting.js) |

---

### ✅ Ship & Cybernetics

| Feature | Details | Key Files |
|---|---|---|
| **Ship Module Upgrades** | Engine, Medbay, Cargo Hold, Scanner Array, Deflector Shields, Weapon Systems | [`ship.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ship.js) |
| **Ship Tactical Events** | Void Corsair Raiders, Rogue Drones, Solar Storms, Photon Prime Escorts | [`ship.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ship.js) |
| **Cybernetic Implants** | 4 slots: Head (Targeting Matrix), Arms (Reflex Boosters), Torso (Sub-dermal Plating), Nervous (Synaptic Accelerator) | [`cybernetics.js`](file:///d:/source/Roogames/Space%20Adventure/systems/cybernetics.js) |
| **Nanite Mod Chips** | 2 sub-slots per implant; too many mods → System Instability (combat glitches) | [`cybernetics.js`](file:///d:/source/Roogames/Space%20Adventure/systems/cybernetics.js) |
| **Augmentation Synergies** | Target Lock, Nanite Shielding, Cybernetic Overcharge, Neural Overdrive | [`cybernetics.js`](file:///d:/source/Roogames/Space%20Adventure/systems/cybernetics.js) |

---

### ✅ Companions & Social

| Feature | Details | Key Files |
|---|---|---|
| **Recruit NPCs** | 3 companion archetypes: Cyborg Scrapper, Android Medic, Human Smuggler | [`companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) |
| **Companion Combat Abilities** | Active abilities on cooldown; Scientist Overclock stance reduces cooldowns | [`companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js), [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) |
| **Trust / Loyalty System** | Banter events during travel; resolving disputes → trust increase → synergy traits | [`companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) |
| **Loyalty Missions** | High trust threshold unlocks companion-specific dungeon crawls / side-stories | [`companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) |
| **Crew Cabin UI** | Inspect crew rooms, gift items, configure passive bonuses, banter dialogue | [`companions-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/companions-ui.js) |
| **Companion Trust ↔ Quest Hook** | Dialogue choices modify companion trust in real-time | [`systems/quests.js`](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) |

---

### ✅ Save, Settings & Meta

| Feature | Details | Key Files |
|---|---|---|
| **Multi-Slot Save System** | Multiple named slots; slot-select on new game; overwrite warning | [`saveload.js`](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js) |
| **LocalStorage Persistence** | Full state (including storyline act, NPC memory, narrative flags) | [`saveload.js`](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js) |
| **Auto-Save** | Triggers at key gameplay moments | [`saveload.js`](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js) |
| **Export / Import** | JSON file export and import for backup/sharing | [`saveload.js`](file:///d:/source/Roogames/Space%20Adventure/systems/saveload.js) |
| **Difficulty Settings** | Easy / Normal / Hard with enemy stat scaling | [`settings.js`](file:///d:/source/Roogames/Space%20Adventure/systems/settings.js) |
| **Achievement System** | Milestone tracking across Combat, Exploration, Collection categories | [`achievements.js`](file:///d:/source/Roogames/Space%20Adventure/systems/achievements.js) |

---

### ✅ UI / Visual Polish

| Feature | Details | Key Files |
|---|---|---|
| **Retro Sci-Fi Theme** | CRT amber terminal aesthetic for logs/quests; cyan glows; hologram scanlines | [`style.css`](file:///d:/source/Roogames/Space%20Adventure/style.css) |
| **Dialogue Overlay** | NPC portrait, faction badge, mood indicator (color-coded border), d20 roll animation | [`dialogue-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dialogue-ui.js) |
| **Districts / Hub Rendering** | Planetary districts panel with interactive locations, NPCs, job board | [`districts-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/districts-ui.js) |
| **2×4 Action Console Grid** | Clean, organized bottom console layout (removed ad-hoc boss button) | [`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html) |
| **Map Visualization** | Visual travel map with location highlighting | [`travel-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/travel-ui.js) |
| **Notifications** | Level-up overlays, victory banners, save confirmation toasts | [`notifications.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/notifications.js) |
| **Theme Engine (DOM)** | `data-term` attributes on HTML elements auto-translate via `tToken()` | [`theme-engine.js`](file:///d:/source/Roogames/Space%20Adventure/systems/theme-engine.js), [`data/theme.js`](file:///d:/source/Roogames/Space%20Adventure/data/theme.js) |

---

## 4. Pending / In-Progress Features

These items are **designed but not yet implemented** or have partial implementation.

> [!NOTE]
> **Dynamic Galactic Outcomes** shipped on 2026-07-20 — see [Section 3 → Dynamic Galactic Outcomes & Branching Endings](#-dynamic-galactic-outcomes--branching-endings). All four planned items (`state.worldFlags`, world-state hub reshaping, epilogue crawl, Free-Roam mode) are implemented, and the feature delivered a 4th "Unified Coalition" ending beyond the originally planned three.

### 🔶 Combat Stance Badge Graphics (Low Priority)

- [ ] Replace plain-text stance badge indicators with graphical badge icons in the Combat UI

---

### 🔶 Leaderboard / High Scores

- [ ] Highest Level Reached tracker
- [ ] Most Enemies Defeated counter
- [ ] Best Time Records (speedrun)
- [ ] Leaderboard UI panel

---

### 🔶 Animations & Sound

- [ ] Combat attack/hit animations
- [ ] Floating damage number popups
- [ ] Screen transition effects
- [ ] Particle effects for special abilities
- [ ] Background atmospheric music
- [ ] Sound effects (combat hits, UI clicks, travel)
- [ ] Volume controls / audio manager

---

### 🔶 Settings Expansion

- [ ] Graphics quality options
- [ ] Keybind customization
- [ ] Accessibility: colorblind palettes, adjustable contrast, font size
- [ ] Audio controls (volume sliders, mute toggles)

---

### 🔶 Type Safety

- [ ] TypeScript migration or JSDoc type annotations
- [ ] Better error boundaries

---

## 5. Future Roadmap

These are **fully designed but not yet started** — larger-scope features.

### 🔮 Fleet Command & Tactical Grid Battles

Turn-based **grid-based space combat** replacing text-option ship events.

- **Fighter Pilot Recruitment:** Hire pilot crew with unique commands and fighter loadouts
- **Grid-Based Space Combat:** Fleet positioning, fire arcs, shield sectors determine victory
- **Carrier Hangar Bays:** Upgrade ship to build fighter hangars, drone repair bays, planetary bombardment artillery

**Primary files to create/modify:** [`ship.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ship.js), new `systems/fleet.js`

---

### 🔮 Engine Generalization (Strategic Goal)

> See [Section 6](#6-theme-engine--adapting-to-other-genres) for the full guide.

The primary engine is designed to be genre-agnostic. Once vocabulary is externalized, the same engine can power **fantasy, steampunk, superhero,** or any other setting with only a new `data/theme.js` and `data/` content pack.

---

## 6. Theme Engine — Adapting to Other Genres

> [!IMPORTANT]
> This section explains how to re-skin the engine for a completely different genre. The vocabulary audit in [`scifi_vocabulary_report.md`](file:///d:/source/Roogames/Space%20Adventure/docs/scifi_vocabulary_report.md) identified all genre-specific terms. The steps below form the official generalization roadmap.

### How the Theme Engine Works Now

1. **[`data/theme.js`](file:///d:/source/Roogames/Space%20Adventure/data/theme.js)** exports a `theme` object with all player-visible UI token strings.
2. **[`systems/theme-engine.js`](file:///d:/source/Roogames/Space%20Adventure/systems/theme-engine.js)** exports `tToken(key)` and `applyThemeToDOM()`.
3. **[`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html)** uses `data-term="shipHub"` attributes on elements; `applyThemeToDOM()` replaces their text with the token value from `theme.js`.

### Step-by-Step: Creating a New Genre Theme

#### Step 1 — Create a New `data/theme.js`

Copy the existing `data/theme.js` and replace the token values for your genre:

```javascript
// Fantasy Theme Example
export const theme = {
    gameTitle: "Realm of Echoes",
    currency: "Gold",
    currencyAbbrev: "GP",
    shipHub: "🏰 Guild Hall",
    shipHubTitle: "Guild Operations & Upgrades",
    cybernetics: "✨ Enchantments",
    cyberneticsTitle: "Magical Enhancements",
    derelictVessel: "⚠️ Cursed Dungeon",
    derelictTitle: "⚠️ CURSED DUNGEON",
    derelictDesc: "Dark magic permeates the air. Life force draining.",
    oxygenLabel: "LIFE FORCE RESERVE",
    oxygenBar: "Life Force",
    exploreDeeper: "Venture Deeper (-1 Life Force)",
    escapeToShip: "Escape to Base",
    tradeShop: "🛒 Market / Bazaar",
    jobBoard: "📋 Notice Board",
    skillsTalents: "✨ Spells & Talents",
    attributes: "📊 Attributes",
    scanSignals: "🔮 Scry Area",
    achievements: "🏆 Deeds",
    engine: "Mount Speed",
    medbay: "Alchemy Lab",
    cargo: "Pack Storage",
    scanner: "Scout Network",
    shield: "Magic Ward",
    weapons: "Siege Equipment",
    implants: "Enchantments"
};
```

Token mapping table for common genres:

| Token | Sci-Fi | Fantasy | Steampunk | Superhero |
|---|---|---|---|---|
| `shipHub` | 🚀 Ship Hub | 🏰 Guild Hall | ⚙️ Zeppelin Dock | 🦸 Hero HQ |
| `currency` | Credits | Gold | Steam Shillings | Hero Points |
| `cybernetics` | Cybernetics | Enchantments | Augmentations | Enhancements |
| `derelictVessel` | Derelict Ship | Cursed Dungeon | Abandoned Factory | Villain's Lair |
| `oxygenLabel` | Oxygen Reserve | Life Force | Steam Pressure | Power Cells |
| `medbay` | Medical Bay | Alchemy Lab | Infirmary | Med Suite |
| `cargo` | Cargo Hold | Pack Storage | Steam Vault | Equipment Bay |
| `engine` | Engine | Mount Speed | Boiler Power | Propulsion |
| `scanner` | Scanner Array | Scout Network | Telegraph Array | Sensor Grid |
| `shield` | Deflector Shields | Magic Ward | Iron Plating | Energy Barrier |

#### Step 2 — Rename Schema Keys (State Object Generalization)

In `systems/character.js` and `systems/saveload.js`, these sci-fi-specific state keys need generic equivalents:

| Current (Sci-Fi) | Generic | Notes |
|---|---|---|
| `state.character.ship` | `state.character.base` | The player's "home base" (ship/guild/zeppelin/HQ) |
| `state.character.cybernetics` | `state.character.enhancements` | Enhancement slots (implants/enchantments/augments) |
| `state.derelict` | `state.dungeon` | The roguelike dungeon run state |
| `state.derelict.oxygen` | `state.dungeon.resourceTimer` | The survival resource (O2/Life Force/Steam/Cells) |
| `credits` | `currency` | The monetary unit |

#### Step 3 — Swap `data/` Content Packs

Replace these data files with genre-appropriate equivalents (or add a new content pack subfolder):

| Current File | What It Defines | Fantasy Equivalent Example |
|---|---|---|
| [`data/enemies.js`](file:///d:/source/Roogames/Space%20Adventure/data/enemies.js) | Space enemies & bosses | Goblins, Liches, Dragon bosses |
| [`data/items.js`](file:///d:/source/Roogames/Space%20Adventure/data/items.js) | Weapons, armor, consumables | Swords, robes, potions |
| [`data/locations.js`](file:///d:/source/Roogames/Space%20Adventure/data/locations.js) | Planets & space stations | Villages, dungeons, capital cities |
| [`data/quests.js`](file:///d:/source/Roogames/Space%20Adventure/data/quests.js) | Story quests & NPCs | Dark lord arc, guild contracts |
| [`data/cybernetics.js`](file:///d:/source/Roogames/Space%20Adventure/data/cybernetics.js) | Implants & mod chips | Spell gems & rune slots |

#### Step 4 — Rename System Files (Optional, for Clarity)

For a clean new theme project, rename genre-specific files to mechanical terms:

| Current Filename | Mechanical Name | Reason |
|---|---|---|
| `ship.js` | `base-operations.js` | Manages the player's home base (any genre) |
| `cybernetics.js` | `enhancements.js` | Handles the enhancement/augmentation system |
| `derelict.js` | `dungeon.js` | The roguelike dungeon exploration system |

#### Step 5 — Update CSS Theme Class

The visual aesthetic is defined in [`style.css`](file:///d:/source/Roogames/Space%20Adventure/style.css) with sci-fi class names. The `applyThemeToDOM()` function in [`theme-engine.js`](file:///d:/source/Roogames/Space%20Adventure/systems/theme-engine.js) already supports adding a `theme-{name}` class to `document.body`, enabling global CSS overrides without touching the existing sci-fi stylesheet:

```css
/* style.css — add a theme override block */
body.theme-fantasy .crt-cyan-large   { /* parchment aesthetic */ }
body.theme-fantasy .cyber-panel-cyan { /* wood panel aesthetic */ }
body.theme-fantasy .stars-background { background: url('forest-bg.png'); }
```

#### Step 6 — Hardcoded Strings Still Needing Externalization

The vocabulary audit identified these strings **still hardcoded** in logic files. These need to be moved to `theme.js` or data files for full generalization:

| Location | Hardcoded String | Should Become |
|---|---|---|
| [`districts-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/districts-ui.js) | `"Terra Prime"`, `"Nebula Outpost"`, plot vocabulary | Location names → `data/locations.js` |
| [`companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) | `"Cyborg Scrapper"`, `"Android Medic"`, greeting strings | Companion profiles → `data/companions.js` |
| [`companions-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/companions-ui.js) | Quarters names, inspection descriptions | Companion data → `data/companions.js` |
| [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) | `"Vacuum: Drained 1 unit of Oxygen!"`, `"CYBERNETICS: Reflex Boosters activated!"` | Combat log templates → `theme.js` or `data/` |
| [`locations.js`](file:///d:/source/Roogames/Space%20Adventure/systems/locations.js) | Ambush alert strings, medbay travel text | Log strings → `theme.js` |

---

## 7. Testing Infrastructure

The project has a comprehensive Jest unit test suite (35 test files).

**Run all tests:**
```bash
npm test
```

### Test Coverage Map

| Test File | What It Covers |
|---|---|
| [`character.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/character.test.js) | Character creation, leveling, stat allocation |
| [`combat.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/combat.test.js) | Core combat mechanics |
| [`combat_tactical.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/combat_tactical.test.js) | Elemental combos, stagger, stances |
| [`combat_thematic.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/combat_thematic.test.js) | Environmental modifiers, thematic enemies |
| [`branching_quests.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/branching_quests.test.js) | Narrative state machine, faction allegiance, NPC memory |
| [`class_quests_turnin.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/class_quests_turnin.test.js) | Class quest variants, NPC turn-in gating |
| [`derelict.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/derelict.test.js) | Dungeon exploration, boss encounter, blueprint drops |
| [`cybernetics.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/cybernetics.test.js) | Implant install/uninstall, synergy activation |
| [`cybernetics_modding.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/cybernetics_modding.test.js) | Nanite mod chips, system instability |
| [`specialization_tree.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/specialization_tree.test.js) | Tech tree branching (Heavy Combat, Nano-Biotech, Cyber-Hacking) |
| [`companions.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/companions.test.js) | Companion recruitment, abilities |
| [`loyalty_companions.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/loyalty_companions.test.js) | Trust system, loyalty missions |
| [`sector_reputation.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/sector_reputation.test.js) | Faction reputation effects, pricing |
| [`market.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/market.test.js) | Commodity price fluctuation, news events |
| [`multi_slot_save.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/multi_slot_save.test.js) | Multi-slot save/load, slot overwrite warning |
| [`saveload.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/saveload.test.js) | Persistence, narrative state serialization |
| [`crafting.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/crafting.test.js) | Recipe crafting, legendary blueprint discovery |
| [`shop.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/shop.test.js) | Buy/sell pricing, Photon Prime orders |
| [`quests.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/quests.test.js) | Quest acceptance, progress, rewards |
| [`locations.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/locations.test.js) | Travel, location unlocking |
| [`ship.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/ship.test.js) | Ship module upgrades |
| [`skills.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/skills.test.js) | Skill tree unlocks |
| [`upgrades.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/upgrades.test.js) | Upgrade management |
| [`achievements.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/achievements.test.js) | Achievement milestones |
| [`attributes.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/attributes.test.js) | Stat point allocation |
| [`rarity.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/rarity.test.js) | Item rarity tier logic |
| [`ui.test.js`](file:///d:/source/Roogames/Space%20Adventure/tests/systems/ui.test.js) | UI render state |

---

## 8. Key Files Quick Reference

| File | Purpose |
|---|---|
| [`game.js`](file:///d:/source/Roogames/Space%20Adventure/game.js) | Coordinator: imports all systems, wires dependencies, exposes globals to HTML |
| [`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html) | Game UI, all DOM structure, keyboard bindings |
| [`style.css`](file:///d:/source/Roogames/Space%20Adventure/style.css) | All visual styling, CRT effects, animations |
| [`data/theme.js`](file:///d:/source/Roogames/Space%20Adventure/data/theme.js) | **PRIMARY GENRE SWITCH** — change token values here to re-theme the game |
| [`data/quests.js`](file:///d:/source/Roogames/Space%20Adventure/data/quests.js) | Full quest library (145KB) — branching narrative, 3-act structure |
| [`systems/combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js) | Core tactical combat engine (87KB) |
| [`systems/derelict.js`](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js) | Dungeon system: maze gen, exploration, boss |
| [`systems/ui/dungeon-renderer.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dungeon-renderer.js) | Raycasting pseudo-3D renderer |
| [`systems/companions.js`](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) | Crew system, trust, banter |
| [`systems/theme-engine.js`](file:///d:/source/Roogames/Space%20Adventure/systems/theme-engine.js) | DOM vocabulary translation engine |
| [`docs/lore.md`](file:///d:/source/Roogames/Space%20Adventure/docs/lore.md) | **UNIVERSE LORE GUIDE** — core factions, planetary ecologies, characters, and expansion hooks |
| [`docs/photon_prime_store_mockup.md`](file:///d:/source/Roogames/Space%20Adventure/docs/photon_prime_store_mockup.md) | **PHOTON PRIME STORE MOCKUP** — visual UI layout mockup and HTML/CSS styles plan for the online ordering interface |
| [`docs/portraits_gallery.md`](file:///d:/source/Roogames/Space%20Adventure/docs/portraits_gallery.md) | **PORTRAITS GALLERY** — visual reference cards for companions, merchants, and hostile biological/mechanical threats |
| [`docs/ui_overhaul_plan.md`](file:///d:/source/Roogames/Space%20Adventure/docs/ui_overhaul_plan.md) | **UI OVERHAUL PLAN** — design tokens, CSS variables, and layout specs extending glassmorphic HUD styling across Combat, Character, Travel, Derelict, and Dialogue interfaces |
| [`docs/walkthrough.md`](file:///d:/source/Roogames/Space%20Adventure/docs/walkthrough.md) | **UI OVERHAUL WALKTHROUGH** — summary of the completed glassmorphic layout updates, color shaders, and testing results |
| [`docs/quest_modules_design.md`](file:///d:/source/Roogames/Space%20Adventure/docs/quest_modules_design.md) | **IMPORTABLE MODULES DESIGN** — technical schema for packaging, linking, and executing modular quests |
| [`docs/scifi_vocabulary_report.md`](file:///d:/source/Roogames/Space%20Adventure/docs/scifi_vocabulary_report.md) | Audit of all hardcoded genre strings — required reading before generalization |

---

## 9. How to Run the Game

### Play

Open `index.html` directly in a browser — no build step required.

```bash
# Or start a simple local server:
npx serve .
```

### Run Tests

```bash
npm test
```

### Build (Production Bundle)

```bash
node build.js
```

---

*This document is a living reference. Update the **Completed Features** table when a feature ships, move items from **Pending** to **Completed**, and add new ideas to **Future Roadmap**.*
