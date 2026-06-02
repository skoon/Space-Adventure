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
- [ ] **Equipment Upgrades** - Enhance existing equipment
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
- [ ] **Item Comparison** - Compare equipment stats

## 🎯 Game Systems

### Save/Load System

- [x] **LocalStorage Persistence** - Save game state to browser
- [x] **Multiple Save Slots** - Allow multiple playthroughs (via export/import)
- [x] **Auto-Save** - Automatic saving at key moments
- [x] **Save/Load UI** - Interface for managing saves
- [x] **Export/Import** - JSON file export and import functionality

### Achievement System

- [ ] **Achievement Tracking** - Track player milestones
- [ ] **Achievement Rewards** - Unlock rewards for achievements
- [ ] **Achievement Display** - UI showing all achievements
- [ ] **Achievement Categories** - Combat, exploration, collection, etc.

### Difficulty Settings

- [x] **Difficulty Levels** - Easy, Normal, Hard modes
- [x] **Enemy Level Scaling** - Enemies scale dynamically with player level to maintain challenge
- [x] **Enemy Difficulty Scaling** - Adjust enemy strength based on difficulty
- [x] **Reward Scaling** - Higher difficulty = better rewards (Implicit via harder enemies giving more XP/Loot?) - Wait, I didn't implement loot scaling, only stats.
- [x] **Difficulty Selection** - UI for choosing difficulty at start

## 👥 Social & Meta Features

### Companion/Party System

- [ ] **Recruit NPCs** - Add companions to your party
- [ ] **Companion Abilities** - Companions help in combat
- [ ] **Relationship Mechanics** - Build relationships with companions
- [ ] **Companion UI** - Manage party members

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
