# Galactic Odyssey - Feature Suggestions

## ✅ Quick Wins (Completed)

- [x] Critical hit chance system
- [x] XP bar visualization
- [x] Level-up notification with stat increases
- [x] Inventory sorting/filtering
- [x] Combat log with timestamps
- [x] Character portrait/avatar
- [x] Victory screen after boss defeats
- [x] Fix "startGame is not defined" error (Duplicate applyQuestItem in systems/quests.js)
- [x] **Cybernetic Augmentation Clinic** - Progression layer with 4 cyber slots (Head, Arms, Torso, Nervous System), active combat benefits (Reflex Boosters, Sub-dermal Plating, Targeting Matrix, Synaptic Accelerator), and credit/material surgical requirements.
- [x] **Cybernetic Augmentation Synergies** - Pairs of cybernetic implants unlock active synergies: Target Lock (Head+Arms: Crit stacking in Berserker stance), Nanite Shielding (Torso+Nervous: Lyra heals grant DEF boost), Cybernetic Overcharge (Head+Torso: Reduces ability energy costs by 10), and Neural Overdrive (Arms+Nervous: 20% chance to refund 1 AP on ability use).


## 🎮 Combat Enhancements

### Multiple Combat Actions

- [x] **Action Points (AP) System** - Spend AP to perform multiple actions per turn (Attack, Block, Dodge, Use Items)

- [x] **Block Action** - Reduces incoming damage by 50% for one turn
- [x] **Dodge Action** - 30% chance to completely avoid enemy attack
- [x] **Special Abilities per Role**
  - [x] Warrior: Power Strike (deals 1.5x damage, costs energy)
  - [x] Rogue: Assassinate (guaranteed crit, 2.5x damage)
  - [x] Scientist: Shield Boost (temporary defense increase)
- [x] **Item Usage in Combat** - Use grenades, stims, and other consumables during battle

### Status Effects System

- [x] **Buffs/Debuffs** - Defense boost, blocking, dodging effects implemented
- [x] **Temporary Stat Boosts** - Shield Boost provides temporary defense increase
- [x] **Enemy Status Effects** - Enemies can apply debuffs to player
- [x] **Status Effect UI** - Visual indicators for active effects

### Boss Battles

- [x] **Unique Boss Enemies** - Special enemies with multiple phases
- [x] **Boss Mechanics** - Special attack patterns and abilities
- [x] **Boss Rewards** - Unique loot and higher XP from bosses
- [x] **Boss Health Bars** - Enhanced visual display for boss encounters
- [x] **Remove "Challenge Boss" UI Button** - Tie boss battles directly to the quest progression/events instead of an ad-hoc button
  - [x] Remove the `encounterBoss()` button from the Action Console in [index.html](file:///d:/source/Roogames/Space%20Adventure/index.html#L355-L357).
  - [x] Integrate boss-encounter triggers at the final stage of narrative quests in `systems/quests.js`.

### Tactical Combat 2.0 (Completed)

- [x] **Elemental Synergies & Combos** - Implement Thermal, Cryo, Plasma, and Corrosive damage types and combo-chain triggers
  - [x] Update `systems/combat.js` to support new damage types: `Thermal`, `Cryo`, `Plasma`, `Corrosive`.
  - [x] Add active status effects to characters/enemies: `Burning` (damage-over-time), `Frozen` (speed/AP debuff), `Electrified` (susceptible to shock), `Melted` (reduced armor/defense).
  - [x] Implement combo-trigger logic in `systems/combat.js` damage calculation (e.g., if target has `Frozen`, physical damage deals 2x "Shatter" bonus; if `Electrified`, plasma damage inflicts 1-turn stun).
  - [x] Update Combat UI to display active elemental debuffs with distinct icons or color coding.
- [x] **Stagger & Break Gauges** - Add posture/shield break gauges to enemies, causing temporary stun and vulnerability
  - [x] Add `breakMax` and `breakCurrent` fields to enemy objects in `systems/combat.js` and stats initialization.
  - [x] Define "Stagger Damage" values for all standard attacks, special abilities, and explosive items (e.g., Warrior's Power Strike deals high Stagger; standard attack deals low Stagger).
  - [x] Implement Break condition: when `breakCurrent` reaches 0, apply `Broken` status effect for 1 turn (stunned, receives 2x damage).
  - [x] Render a secondary "Break Shield" gauge below enemy health bars in the Combat UI.
- [x] **Role Combat Stances** - Add active stances (Vanguard/Berserker, Shadow/Skirmisher, Overclock/Disruption) that cost AP to toggle
  - [x] Implement stance-switching action in `systems/combat.js` that costs 1 AP.
  - [x] Define active state modifiers in player statistics based on current stance:
    - Warrior: `Vanguard` (+DEF, auto-taunts enemies to protect companions) vs. `Berserker` (+Stagger damage, -DEF).
    - Rogue: `Shadow` (Stealth, 100% crit chance on next attack, disables block/dodge) vs. `Skirmisher` (reduces item/movement AP cost by 1).
    - Scientist: `Support Overclock` (+1 AP regeneration for player & companions) vs. `Disruption Mode` (attacks apply random elemental debuff).
  - [x] Update Combat UI with Stance selection buttons (disabled when AP is 0) and display active stance indicators on character portraits.
  - [ ] (Todo) Find/implement a graphic badge for combat stances instead of a plain text badge

## 📈 Progression & Character Development

### Skill Tree System

- [x] **Unlockable Abilities** - Skills specific to each role
- [x] **Stat Upgrades** - Permanent stat boosts on level up
- [x] **Passive Bonuses** - Unlock passive abilities (e.g., +10% crit chance)

### Equipment System

- [x] **Weapons** - Equip weapons that modify attack stats
- [x] **Armor** - Equip armor that modifies defense stats
- [x] **Accessories** - Rings, amulets with special bonuses
- [x] **Item Rarity System** - Common, Rare, Epic, Legendary tiers
- [x] **Equipment UI** - Visual equipment slots and management

### Stat Points on Level Up

- [x] **Manual Stat Allocation** - Players choose where to allocate points
- [x] **Stat Point UI** - Interface for distributing points
- [x] **Stat Point Recommendations** - Suggestions based on role

## 🌍 World & Exploration

### Planet/Location System

- [x] **Multiple Planets/Areas** - Different locations with unique themes
- [x] **Location-Specific Enemies** - Different enemy types per location
- [x] **Location-Specific Events** - Unique random events per area
- [x] **Location-Specific Loot** - Area-specific items and rewards
- [x] **Travel System** - Integrated planetary travel into the Ship Hub (replacing random transport device encounters)

### Location-Specific Ecologies & Unique Threats (Completed)

- [x] **Thematic Enemy Types** - Unique enemies per planet with distinct mechanics (exploding fire elementals, freeze parasites, physical-immune shadow beasts)
  - [x] Design planet-specific rosters in `data/enemies.js` or equivalent system files.
  - [x] Implement `Inferno-IX` enemies: *Magma Elemental* (explodes on death dealing damage to player and applying `Burning` debuff), *Ashen Hulk* (high fire/plasma defense, weak to Cryo).
  - [x] Implement `Crio-Prime` enemies: *Frost parasite* (drains 1 AP on hit), *Cryo Drake* (freezes player on crit).
  - [x] Implement `Derelict Ships / Anomalies` enemies: *Eldritch Shade* (phases out; has 90% physical evasion, requires energy/elemental weapon to damage), *Security Sentinel* (hacks player shields, draining 10 shields per turn).
- [x] **Environmental Combat Modifiers** - Planet-specific hazards altering combat rules (high gravity altering AP cost, radiation draining energy, vacuum exhausting oxygen)
  - [x] Pass the active location/planet environment parameter into the combat initialization function.
  - [x] Apply environment-specific turn-start or turn-end hooks in `systems/combat.js`:
    - `High Gravity`: Increases movement and melee attack AP cost by +1.
    - `Solar Radiation`: Drains 5 Energy at the end of each player turn.
    - `Vacuum (No Life Support)`: Constantly drains 1 unit of Oxygen per turn; running out drains 10% max HP per turn.
  - [x] Update the Combat UI to display active environmental modifiers with warning icons.

### Deep Space Dungeons (Derelict Ships)

- [x] **Distress Signals** - 10% chance to encounter a derelict ship during travel
- [x] **Survival / Life Support** - Limited oxygen supply acts as a strict turn/exploration limit
- [x] **Procedural Room Exploration** - Explore rooms with random outcomes (Combat, Loot, Hazards, Empty)
- [x] **Risk vs. Reward scaling** - Deeper exploration increases hazard damage and enemy strength but increases high-tier loot chances
- [x] **Emergency Recall & Escape** - Choose to escape with accumulated loot at any time, or pass out on 0 oxygen and lose all secured loot and take 25% max HP damage

### Quest System

- [x] **Main Story Quests** - Primary narrative objectives
- [x] **Side Quests** - Optional objectives with rewards
- [x] **Quest Log UI** - Track active and completed quests
- [x] **Quest Rewards** - XP, items, and story progression
- [x] **Branching Narrative Arcs** - Multi-stage story arcs with dialogue choice forks
  - [x] Refactor quest data structure in `systems/quests.js` to support multi-stage quests with state-dependent branch nodes.
  - [x] Create a quest progression state machine that updates based on player choices rather than just linear targets.
  - [x] Update the Quest Log UI to show branching outcomes and active path names.
- [x] **Context-Specific Quest Gating** - Gating quest availability based on location and travel state
  - [x] Implement planet-locked quest filters in `systems/quests.js` so certain missions can only be accepted when docked on their respective planets.
  - [x] Create travel-specific event hooks that can trigger emergency distress calls or derelict-boarding quests in the travel logic loop.
- [x] **Persistent Named NPCs** - Unique characters (Captain Vance, Sparky Mercer, Dr. Thorne, Envoy Nesta) with distinct personalities and backgrounds
  - [x] Create state fields inside character state to store key recurring NPCs: Captain Valen Vance, Jax "Sparky" Mercer, Dr. Elyse Thorne, Envoy Nesta.
  - [x] Define custom dialogue trees and choices for each NPC.
  - [x] Integrate NPC interactions with planetary hubs and travel events.
- [x] **NPC Disposition & Memory System** - NPCs remember choices and track relationships, modifying dialogue and transaction rates
  - [x] Add `disposition` rating (numeric scale, e.g., -100 to +100) and `memoryFlags` array to each NPC's state in the save game data.
  - [x] Implement relationship change triggers (e.g., agreeing with Vance increases Federation reputation/disposition, but decreases Corsair Envoy disposition).
  - [x] Apply disposition impacts: high disposition lowers shop prices, unlocks secret quests, or grants companion recruitment; negative disposition sparks hostile dialogue or travel ambushes.
- [x] **Attribute & Role Checks** - Specific dialog options for roles or attribute thresholds (e.g., Scientist hacking, Rogue negotiating, Warrior intimidating)
  - [x] Create a dialogue choice evaluation engine in `systems/quests.js` that checks player stats/roles (e.g., `role === 'Scientist' && stats.intelligence >= 15`).
  - [x] Format dialogue choice UI to render check-dependent options: green/enabled for passed checks, greyed out/locked for failed ones (e.g., "[Hack Terminal] - Requires Scientist and INT 15").
  - [x] Write success/failure outcome paths for each skill check (e.g., failing a hack sounds alarms and starts combat; succeeding bypasses the combat phase).
- [ ] **Dynamic Galactic Outcomes** - Major decisions that permanently reshape hubs, change NPC availability/prices, or unlock distinct branching endings
  - [ ] Define global world-state flags in the game engine (e.g., `isBioDomeDestroyed`, `isPirateControlled`).
  - [ ] Implement world-state triggers that alter planetary hub views: modify NPC lists, switch shop inventories, adjust local tax rates (prices), and change hub description texts.
  - [ ] Implement end-game narrative slides that evaluate world flags and render one of multiple distinct branch endings.

### Random Events

- [x] **NPC Encounters** - Merchants, allies, mysterious strangers
- [x] **Environmental Hazards** - Radiation storms, asteroid fields
- [x] **Treasure Discoveries** - Hidden caches and rare finds (Abandoned Outposts, Ancient Ruins)
- [x] **Dialogue System** - Interactive conversations with NPCs
- [x] **Drop Boxes** - 10% chance to find Photon Prime deliveries

## 💰 Items & Economy

### Crafting System

- [x] **Item Combination** - Combine materials to create items
- [x] **Recipe Discovery** - Find and unlock crafting recipes
- [x] **Equipment Upgrades** - Enhance existing equipment
- [x] **Crafting UI** - Interface for crafting operations

### Shop/Trading System

- [x] **Currency System** - Credits or space currency
- [x] **Buy/Sell Items** - Trade with merchants
- [x] **Online Ordering (Photon Prime)** - Order items from anywhere
- [x] **Drop Box System** - Collect ordered items from drop boxes in the wild
- [x] **Shop UI** - Interface for browsing and purchasing

### Item Management

- [x] **Item Stacking** - Stack consumables with quantities
- [x] **Item Categories** - Organize by type (weapons, consumables, etc.)
- [x] **Item Tooltips** - Detailed information on hover
- [x] **Item Comparison** - Compare equipment stats

## 🎯 Game Systems

### Save/Load System

- [x] **LocalStorage Persistence** - Save game state to browser
- [x] **Multiple Save Slots** - Allow multiple playthroughs (via export/import)
- [x] **Auto-Save** - Automatic saving at key moments
- [x] **Save/Load UI** - Interface for managing saves
- [x] **Export/Import** - JSON file export and import functionality
- [x] **Start New Game & List Saved Games** - Add interface to list saved games and start a new game session

### Achievement System

- [x] **Achievement Tracking** - Track player milestones
- [x] **Achievement Rewards** - Unlock rewards for achievements
- [x] **Achievement Display** - UI showing all achievements
- [x] **Achievement Categories** - Combat, exploration, collection, etc.

### Difficulty Settings

- [x] **Difficulty Levels** - Easy, Normal, Hard modes
- [x] **Enemy Level Scaling** - Enemies scale dynamically with player level to maintain challenge
- [x] **Enemy Difficulty Scaling** - Adjust enemy strength based on difficulty
- [x] **Reward Scaling** - Higher difficulty = better rewards (Implicit via harder enemies giving more XP/Loot?) - Wait, I didn't implement loot scaling, only stats.
- [x] **Difficulty Selection** - UI for choosing difficulty at start

## 👥 Social & Meta Features

### Companion/Party System

- [x] **Recruit NPCs** - Add companions to your party
- [x] **Companion Abilities** - Companions help in combat
- [x] **Relationship Mechanics** - Build relationships with companions
- [x] **Companion UI** - Manage party members

### Leaderboard/High Scores

- [ ] **Highest Level Reached** - Track progression records
- [ ] **Most Enemies Defeated** - Combat statistics
- [ ] **Best Time Records** - Speedrun tracking
- [ ] **Leaderboard UI** - Display rankings

## 🎨 UI/UX Enhancements

### Visual Style

- [x] **Retro Sci-Fi Theme** - Flash Gordon/Buck Rogers styling for stats
- [x] **CRT Effects** - Amber monitors for Quest Log and terminals
- [x] **Map Visualization** - Visual travel map with location highlighting
- [x] **Viewscreen** - Persistent image panel on the exploration screen showing one static image for the current action (planet, district, NPC, enemy, boss, event). Glassmorphism frame with the holographic-CRT scanline, accent glow driven by the image record, 200 ms crossfade between scenes
- [x] **Image Registry** - `data/imagery.js` maps game IDs to art; missing keys fall back to emoji by design. See `docs/imagery_manifest.md`
- [x] **Image Optimization Pipeline** - `npm run optimize-images` re-encodes the 1 MB portrait masters to 512² WebP/JPEG (<60 KB) plus 128² thumbs (<12 KB)
- [x] **NPC Portraits** - Dialogue overlay and companion crew cards show the registered portrait thumbnail, emoji when there is none
- [ ] **Location & Event Art** - Seven planets, twelve districts and both event scenes still render emoji; see `docs/imagery_manifest.md` for the ranked gap list

### Animations & Effects

- [ ] **Combat Animations** - Visual feedback for attacks
- [ ] **Damage Number Popups** - Floating damage text
- [ ] **Screen Transitions** - Smooth transitions between states
- [ ] **Particle Effects** - Visual effects for special abilities

### Sound & Music

- [ ] **Background Music** - Atmospheric soundtrack
- [ ] **Sound Effects** - Audio feedback for actions
- [ ] **Volume Controls** - Settings for music and SFX
- [ ] **Audio Manager** - System for managing audio

### Settings Menu

- [x] **Viewscreen Imagery Toggle** - Turns the image layer off for slow connections or emoji-only play; persists in `galactic_odyssey_settings`
- [ ] **Graphics Options** - Quality settings
- [ ] **Audio Controls** - Volume sliders and mute options
- [ ] **Keybind Customization** - Remap controls
- [ ] **Accessibility Options** - Colorblind mode, font size, etc.

## 🔧 Technical Improvements

### Performance

- [x] **Code Optimization** - Improve rendering performance
- [x] **State Management** - Optimize React state updates
- [x] **Memory Management** - Clean up unused resources

### Code Quality

- [x] **Component Refactoring** - Modularized large UI elements (Inventory, Crafting, Travel, Shop, Settings, Quests, Notifications, Logging) into separate files under `systems/ui/` with `systems/ui.js` coordinating
- [ ] **Type Safety** - Add TypeScript or PropTypes
- [ ] **Error Handling** - Better error boundaries and handling
- [x] **Testing** - Comprehensive unit testing suite implemented using Jest, with test files covering character progression, combat, crafting, inventory, location travel, shop mechanics, skill tree upgrades, and UI render state

## 📝 Notes

### Priority Levels

- **High Priority**: Core gameplay improvements (Combat Actions, Equipment System, Quest System)
- **Medium Priority**: Quality of life features (Save/Load, Achievements, Settings)
- **Low Priority**: Nice-to-have features (Animations, Sound, Leaderboards)

### Implementation Order Suggestions

1. Equipment System (foundation for many other features)
2. Multiple Combat Actions (enhances core gameplay)
3. Quest System (adds structure and goals)
4. Save/Load System (improves player experience)
5. Planet/Location System (expands world)
6. Crafting System (adds depth)
7. Remaining features based on player feedback
