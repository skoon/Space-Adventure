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

---

## 🔮 Future / Planned Ideas

### 1. Location-Specific Ecologies & Unique Threats
**How it works:** Rework the enemy generation system so that each planetary body or space dungeon features custom, thematic enemies with distinct combat mechanics.
**Why it fits:** Enhancing location-specific threats rewards strategic loadout planning and gives each planet a unique identity.
**Mechanics:**
- **Thematic Enemy Types:**
  - *Volcanic Planet (Inferno-IX):* Volcanic fire-rock elementals that explode on death and apply permanent "Burn" damage over time unless blocked.
  - *Ice Planet (Crio-Prime):* Cryo-parasites that drain AP (Action Points) on hit or freeze character actions.
  - *Derelict Ships / Anomalies:* Phasing shadow-beasts that are immune to physical attacks (requiring energy weapons or shields) and rogue security units that hack shield capacitors.
- **Environmental Combat Modifiers:** Planetary hazards modify the combat arena (e.g., high gravity doubling AP cost for heavy movement/attacks, solar radiation draining energy per turn, vacuum environments constantly depleting Oxygen).
