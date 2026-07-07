# Space Adventure - Future Ideas Plan

## ✅ Implemented Ideas

### Deep Space Dungeons: "Derelict Ships & Anomalies" (Completed)
**How it works:** When traveling between planets, there is a chance (10%) to intercept a distress signal from a procedurally generated derelict spaceship or spatial anomaly.
**Mechanics:**
- **Survival Mechanic:** These areas have no life support. The player has a limited amount of Oxygen (10-15 units, functioning as a turn limit) to explore rooms, fight unique alien infestations, and find high-tier loot.
- **Room Exploration Roll:** 
  - Combat (40% base, scaling with depth)
  - Loot (30%)
  - Hazards (20%, causing damage)
  - Empty Rooms (10%)
- **Risk vs. Reward:** The deeper the player goes into the derelict ship, the better the loot (higher tier items like Titanium, Plasma Cores, Nanites, Quantum Chips), but if they run out of oxygen, they pass out, lose all secured loot from the run, and take 25% max HP damage.
- **Escape:** Players can choose to escape with their secured loot at any time.
- **Vessel Schematic Map UI:** Re-wired and fully implemented with a structural mapping layout inside [updateDerelictUI](file:///d:/source/Roogames/Space%20Adventure/systems/ui.js) that renders an airlock, explored rooms, active location node (`👤`), and unexplored path markers (`?`).
- **Integration:** Fully integrated with the game loop, combat system, travel system, and ship medbay healing. Verified via unit tests in [derelict.test.js](file:///d:/source/Roogames/Space%20Adventure/tests/systems/derelict.test.js).

### Cybernetic Implants / Augmentation System (Completed)
**How it works:** A progression layer separate from leveling and traditional equipment. Players have a limited number of "Cyber-Slots" (Head, Arms, Torso, Nervous System) that can be fitted with custom augmentations in the Spacecraft Hub's Augmentation Clinic.
**Mechanics:**
- **Reflex Boosters (Arms):** Grants a 35% chance to start combat with +1 Action Point (AP).
- **Sub-dermal Plating (Torso):** Converts 15% of incoming physical damage into energy drain instead of health loss.
- **Targeting Matrix (Head):** Increases critical damage multiplier by +0.5x.
- **Synaptic Accelerator (Nervous System):** Increases Dodge Action success chance by +15%.
- **Surgical Suite:** Operations consume credits and rare components. Extraction requires a 50 CR surgical fee.

### Faction Reputation & Allegiances (Completed)
**How it works:** Player decisions and quest choices affect standings with three major galactic groups (Galactic Federation, Void Corsairs, and Photon Prime Syndicate).
**Mechanics:**
- **Dynamic Shop Multipliers:** Positive faction reputation rewards players with up to a 30% discount on local items and Syndicate online orders, while negative reputation incurs up to a 50% markup. Selling prices scale similarly.
- **Interplanetary Travel Ambushes:** Traveling to a location while possessing hostile reputation (`< -30`) with either the Corsairs or the Federation triggers a scaled random combat intercept in transit.
- **Integration:** Fully verified via unit tests in [branching_quests.test.js](file:///d:/source/Roogames/Space%20Adventure/tests/systems/branching_quests.test.js).

### Branching Narrative Quest System & Persistent NPCs (Completed)
**How it works:** Refactored the quest system to support multi-stage, choice-based narrative paths featuring persistent named NPCs with unique personalities.
**Mechanics:**
- **Dialogue Choice Engine:** Evaluates active role, race, base stats, and active gear stats (weapons, armor, accessories) in dialogues to dynamically gate choices.
- **Persistent NPCs:** Track disposition rankings (scale `-100` to `100`) and memory flags for Captain Valen Vance, Jax "Sparky" Mercer, Dr. Elyse Thorne, and Envoy Nesta.
- **Environmental Gating:** Gating quest availability based on location (planet-locked) and travel state (derelict distress signals).
- **Action Console Clean-up**: Removed the ad-hoc "Challenge Boss" button from [index.html](file:///d:/source/Roogames/Space%20Adventure/index.html) and reorganized the bottom console into a clean 2x4 grid layout.

### Tactical Combat 2.0 (Combos, Stagger, and Stances) (Completed)
**How it works:** Expands the combat system to introduce elemental damage types/combos, stance-switching, and a posture break/stagger gauge system.
**Mechanics:**
- **Elemental Synergies & Combos:**
  - Weapons and attacks deal Physical, Thermal, Cryo, Plasma, or Corrosive damage.
  - Combos include Shatter (Physical deals 2x damage to Frozen enemy and removes Frozen) and Shock (Plasma on Electrified enemy has a 50% chance to stun and removes Electrified).
  - Status effects: Burning (8 damage/turn), Frozen (-1 starting AP for player), Electrified (susceptible to Shock), and Melted (-5 enemy DEF).
- **Stagger & Break Gauges:** Enemies have secondary Break gauges. Reducing the Break shield to 0 applies the Broken status, which skips their next turn (stun) and causes them to take 2x damage from all attacks.
- **Role Combat Stances:** Players can toggle between two stances or neutral (costing 1 AP):
  - *Warrior:* Vanguard (+5 DEF) vs. Berserker (+100% stagger damage, -3 DEF).
  - *Rogue:* Shadow (100% crit chance on next attack, disables block/dodge, resets to Neutral after attacking) vs. Skirmisher (reduces item AP cost to 0 AP).
  - *Scientist:* Support Overclock (+1 AP/turn regen, companion active cooldowns reduced by 1 extra turn/turn) vs. Disruption Mode (basic attacks apply random elemental status).
- **Weapons & Grenades:** Added Frag Grenade (+50 stagger) and EMP Grenade (+80 stagger, Plasma type, applies Electrified status) as consumables, and Cryo Pistol (Cryo type) and Acid Injector (Corrosive type) as weapons.

### Tactical Space-Combat & Ship Defense Events (Completed)
**How it works:** Added random space combat events while traveling between planets. The player's ship modules (weapons, shields, engines) are put to the test in text-based tactical choices or ship-to-ship battles.
**Mechanics:**
- **Ship Stats:** Introduced Ship Deflector Shields (upgradable module, max 150 shields) and Ship Weapon Systems (upgradable module, deals up to 70 base space damage).
- **UI Integration:** Rendered a Deflector Shields status card in the Ship Systems interface allowing players to recharge shields using Scrap Metal (-1 Scrap, +25 HP) or pay Credits for a full hull repair.
- **Combat Events:** Triggers choice-based tactical dialogs during planetary transit (e.g. Void Corsair Raiders, Rogue Security Drone, Solar Radiation Storm, Photon Prime Escort) testing player ship modules and resource management.

### Sector Reputation & Faction Influence Zone (Completed)
**How it works:** The galaxy is controlled by factions (Federation, Corsairs, Syndicate). The player's faction reputation standing unlocks unique sector perks or hazards.
**Mechanics:**
- **Outpost Perks:** Dynamic merchant factions adjust prices by up to a 30% discount for friendly standings or a 50% markup for hostile standings.
- **Faction Board Contracts:** Gated job contracts appear on planetary boards only if the captain possesses the required standing (min +20). Completing planet-based quests rewards +15 faction reputation.
- **Crew Recruitment Standings:** Unlock unique companion options or friendly standing recruitment discounts (50% fee off), whereas hostile reputation locks recruitment.

### Location-Specific Ecologies & Unique Threats (Completed)
**How it works:** Planetary bodies and derelicts feature custom, thematic enemies with distinct combat mechanics and environmental hazards.
**Mechanics:**
- **Thematic Enemy Types:** Volcanic fire-rock elementals that explode on death, Cryo-parasites that drain AP on hit, phasing shadow-beasts with high physical evasion, and rogue security units that drain shield/energy.
- **Environmental Combat Modifiers:** Planetary hazards modify combat rules: High Gravity (increases AP costs), Solar Radiation (drains energy), and Vacuum (constantly drains Oxygen).

### Multi-Slot Save Management & Saved Games UI (Completed)
**How it works:** Extends the single-slot save system to a multi-slot system, allowing players to select save slots on the main menu, delete unwanted saves, and confirm slot overwriting during new game creation.
**Mechanics:**
- **Start New Game Slot Selector:** Prompts the player to select a slot when starting a new game.
- **Populated Slot Warning:** Warns the player with a confirmation dialog before overwriting an existing save slot.
- **Start Menu Integration:** Displays save slots and metadata, with options to load, delete, or overwrite slots.

### Cybernetic Overcharge & Skill Synergies (Completed)
**How it works:** Connect the Cybernetics system to the character's skill tree/combat.
**Mechanics:**
- **Augmentation Synergy**: Sets of 2 implants unlock synergies:
  - *Target Lock (Head+Arms):* In Berserker stance, each non-critical hit increases Crit Chance by +20% (stacks until next Critical Hit).
  - *Nanite Shielding (Torso+Nervous):* Dr. Lyra's Nano-Heal also grants you a Shield Boost (+6 DEF) for 2 turns.
  - *Cybernetic Overcharge (Head+Torso):* Reduces the Energy cost of all active abilities by 10.
  - *Neural Overdrive (Arms+Nervous):* Grants a 20% chance to refund 1 AP after using an active class ability.
- **Clinic UI Integration:** Displays active synergies in the med-bay Surgical Suite clinic tab with active status indicator and descriptions.

### Derelict Ship Boss Raids & Unique Blueprints (Completed)
**How it works:** Expands derelict ship exploration with a rare end-room boss encounter.
**Mechanics:**
- **Void Sentinel Alpha Boss Encounter:** Reaching the final room (room 6) triggers a boss battle with the formidable `Void Sentinel Alpha` defined in [enemies.js](file:///mnt/d/source/Roogames/Space%20Adventure/data/enemies.js). Exploration is disabled after defeating the boss until the player escapes the derelict.
- **Legendary Blueprint Drops:** Defeating the boss guarantees a drop of either the `Quantum Shield Core Recipe` or `Plasma Targeting HUD Recipe`. To maintain exploration stakes, these drops are secured in the derelict cargo (`state.derelict.currentLoot`) and only transferred to player inventory upon a successful escape.
- **Recipe Discovery:** Players can click on these blueprint items from the inventory screen to dynamically discover and learn the crafting recipes via [inventory-ui.js](file:///mnt/d/source/Roogames/Space%20Adventure/systems/ui/inventory-ui.js).
- **Legendary Accessories:** Once discovered, players can craft the legendary-tier `Quantum Shield Core` (+10 defense) and `Plasma Targeting HUD` (+10 attack) accessories in the crafting tab defined in [recipes.js](file:///mnt/d/source/Roogames/Space%20Adventure/data/recipes.js).
- **Integration & Verification:** Fully integrated into derelict exploration [derelict.js](file:///mnt/d/source/Roogames/Space%20Adventure/systems/derelict.js), combat results [combat.js](file:///mnt/d/source/Roogames/Space%20Adventure/systems/combat.js), and map UI [ui.js](file:///mnt/d/source/Roogames/Space%20Adventure/systems/ui.js). Covered by unit tests in [derelict.test.js](file:///mnt/d/source/Roogames/Space%20Adventure/tests/systems/derelict.test.js), [combat.test.js](file:///mnt/d/source/Roogames/Space%20Adventure/tests/systems/combat.test.js), and [crafting.test.js](file:///mnt/d/source/Roogames/Space%20Adventure/tests/systems/crafting.test.js).

### Pseudo-3D First-Person "Dungeon Crawler" View (Completed)
**How it works:** Replaces the schematic node-based map view during derelict ship exploration with a retro-modern pseudo-3D first-person perspective corridor view rendered on an HTML5 Canvas.
**Mechanics:**
- **Procedural Maze Generation:** When docking with a derelict in [derelict.js](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js), an 8x8 grid-based maze is procedurally generated with walls, hallways, locked doors, and terminals, tracking player coordinates at `state.derelict.x` and `state.derelict.y`.
- **Raycasting Perspective Render Engine:** Renders the player's immediate perspective in a new canvas module [dungeon-renderer.js](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dungeon-renderer.js) by projecting rays through a 60-degree field of view to compute wall distances, rendering flat billboards/sprites representing chests, terminals, hazards, and enemy units with depth shading (ambient space fog).
- **Directional Keyboard Navigation:** Binds controls and keyboard keys (W/A/S/D or arrow keys) in [index.html](file:///d:/source/Roogames/Space%20Adventure/index.html) to turn left/right and move forward with strict wall collision checks.
- **Tactical Radar Minimap:** Renders a localized top-down radar overlay displaying explored cells, nearby signatures, and the path back to the airlock.
- **Event Trigger Integration:** Hooks coordinates into the event engine in [derelict.js](file:///d:/source/Roogames/Space%20Adventure/systems/derelict.js) to trigger combat, hazard checks, loot discovery, and the Void Sentinel Alpha fight. Verified in [derelict.test.js](file:///d:/source/Roogames/Space%20Adventure/tests/systems/derelict.test.js).

### Space Station Hub & Dynamic Market Economy (Completed)
**How it works:** Introduces a major social and trading port ("Galactic Nexus Hub" / "Space Hub") featuring a fluctuating stock and commodity market that responds to simulated galactic news events.
**Mechanics:**
- **Dynamic Commodity Trading:** Prices for rare resources (Scrap Metal, Titanium Ingot, Plasma Core, Circuit Board, Carbon Nanotubes, Quantum Chip, Alien Crystal, Cargo Container) defined in [market.js](file:///d:/source/Roogames/Space%20Adventure/systems/market.js) fluctuate based on supply, demand, and news events.
- **News Event Tickers:** Triggers random sector news headlines (e.g., Syndicate Blockade, Solar Flare, Mining Boom, Pirate Raids) that apply dynamic price multipliers.
- **Market Exchange UI:** A dedicated interface card in [shop-ui.js](file:///d:/source/Roogames/Space%20Adventure/systems/ui/shop-ui.js) displaying active headlines, current buying/selling prices, and 5-tick historical price trend sparklines.
- **Interstellar Arbitrage:** Players can buy resources low in friendly outposts, load them into their cargo hold, and travel to other sectors to sell high, risking pirate intercepts in transit. Covered by unit tests in [market.test.js](file:///d:/source/Roogames/Space%20Adventure/tests/systems/market.test.js).



### Crew Cabin & Companion Social Loop
**How it works:** Expands the companion system into an interactive Spacecraft Cabin screen where players can engage in dialogue with crew members, resolve disputes, and unlock personal loyalty quests.
**Mechanics:**
- **Banter & Disposition Events:** Traveling between planets triggers random inter-crew conversations. Resolving these dialogues increases companion trust and unlocks unique synergy traits.
- **Loyalty Missions:** Reaching high trust thresholds unlocks companion-specific dungeon crawls or choice-driven side-stories.
- **Cabin UI:** A dedicated ship interior tab integrated with [companions.js](file:///d:/source/Roogames/Space%20Adventure/systems/companions.js) allows the captain to inspect crew rooms, gift items, and configure passive bonuses.
---

## 🔮 Future / Planned Ideas

### 2. Advanced Cybernetic Modding & Tech Tree Specialization
**How it works:** Introduces minor sub-augment mod slots for cybernetic implants and unlocks deep class-based active and passive skill paths.
**Mechanics:**
- **Nanite Mod Chips:** Each implant installed in [cybernetics.js](file:///d:/source/Roogames/Space%20Adventure/systems/cybernetics.js) gains 2 sub-slots to insert custom nanite chips (e.g., +5% critical strike chance, fire resistance, +10 HP).
- **Stability Management:** Slotting too many mods increases "System Instability," leading to occasional status glitches during combat if exceeded.
- **Specialization Tree:** Adds distinct branching tech trees (Heavy Combat, Nano-Biotech, Cyber-Hacking) using specialization points.

### 3. Fleet Command Carrier Upgrades & Tactical Grid Battles
**How it works:** Allows the player to purchase fighter wings and command an escort squadron, shifting space combat into tactical turn-based grid battles.
**Mechanics:**
- **Fighter Pilot Recruitment:** Hire pilot crew members with unique fighter commands and loadouts.
- **Grid-Based Space Combat:** Space battles transition from text options in [ship.js](file:///d:/source/Roogames/Space%20Adventure/systems/ship.js) to a tactical grid where fleet positioning, fire arcs, and shield sectors dictate victory.
- **Carrier Hangar Bays:** Upgrade ship modules to construct fighter hangars, drone repair bays, and planetary bombardment artillery.

### 4. Deep Interactive Dialogue Engine & Expanded NPC Questlines
**How it works:** Expands the branching narrative dialogue system to introduce complex multi-tiered conversations with named NPCs, character memories, stateful quest-linking, and consequence-based storyline branches.
**Mechanics:**
- **Tiered Choice Branching:** Multi-stage dialogues with nested conditions assessing player stats, reputation standings, previous quest outcomes, and companion trust.
- **NPC Memory Tracker:** NPCs dynamically remember specific player choices (e.g., choosing to spare or destroy the drone), permanently altering their tone, pricing, and available quests in later acts.
- **Quest Storyline Splits & Linking:** Narrative choices dynamically branch main questlines, enabling players to align with specific factions or NPCs, culminating in multiple distinct game-ending epilogues.
- **Dialogue UI Enhancements:** A revamped dialogue card overlay displaying NPC emotions, action rolls, and success percentages based on character specializations.
- **Integration & Verification:** Integrated into [quests.js](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) and verified via narrative tests in [branching_quests.test.js](file:///d:/source/Roogames/Space%20Adventure/tests/systems/branching_quests.test.js).

**Implementation Plan:**
- [ ] **Step 1: Linkable Quest Chains & Storyline State Machine**
  - Add a successor/trigger mechanism in [quests.js](file:///d:/source/Roogames/Space%20Adventure/data/quests.js) (e.g., `unlocksQuest` field or choice-specific next quests).
  - Update `completeQuest` in [quests.js](file:///d:/source/Roogames/Space%20Adventure/systems/quests.js) to automatically trigger and accept the next quest in the chain.
  - Introduce a `state.storyline` object to track the active narrative branch, current Act, and global story milestones.
- [ ] **Step 2: Enhanced NPC Dialogue Engine & State-Dependent Chats**
  - Refactor NPC interactions in planetary hubs to use dynamic dialogue trees instead of static texts.
  - Support conditional dialogue nodes that check active memory flags, character stats, or active inventory items.
  - Implement a dynamic roll mechanism for skill checks (e.g., rolling a virtual 20-sided die with modifiers based on player stats).
- [ ] **Step 3: Immersive Dialogue UI Overlay & Animations**
  - Build a gorgeous, retro-themed dialogue overlay card in a new UI module or in [ui.js](file:///d:/source/Roogames/Space%20Adventure/systems/ui.js).
  - Render NPC nameplates, faction alignment indicators, and visual mood indicators (e.g., Neutral, Pleased, Hostile).
  - Add micro-animations for option hover states, dice rolling, and quest acceptance/completion banners.
- [ ] **Step 4: Branching Main Storyline & Faction Quest Boards**
  - Add a "Quest Board" interface in planetary hubs, allowing players to accept sidequests and faction contracts.
  - Design a cohesive 3-Act Main Storyline:
    - *Act I: The Signal* (investigating ancient tech, choosing which faction to share findings with).
    - *Act II: The Faction War* (running faction-specific sabotage, diplomacy, or security missions).
    - *Act III: The Galactic Crucible* (final showdown or alliance summit, triggering one of 3 unique endings based on reputation).
  - Add character-specific companion quests that unlock once trust thresholds are met.
- [ ] **Step 5: Testing & Verification Suite**
  - Expand [branching_quests.test.js](file:///d:/source/Roogames/Space%20Adventure/tests/systems/branching_quests.test.js) to cover multi-quest chaining, choice state persistence, and ending path triggers.
  - Verify that the save/load system correctly serializes and restores the entire storyline state and NPC memory matrices.

### 5. Generalize the primary game engine.
**The Goal:** The goal is to create a generic game engine so that other settings like fantasy, superhero, or steampunk can be used with the primary engine.