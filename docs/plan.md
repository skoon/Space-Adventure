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

---

## 🔮 Future / Planned Ideas

### 1. Derelict Ship Boss Raids & Unique Blueprints
**How it works:** Expand derelict ship exploration with rare end-room Boss encounters.
**Mechanics:**
- **Legendary Blueprint Drops**: Defeating a Derelict Boss drops rare blueprints (e.g., "Quantum Shield Core Recipe").
- **Crafting Extensions**: Players can use the crafting system to craft legendary-tier accessories or cybernetic enhancements.
