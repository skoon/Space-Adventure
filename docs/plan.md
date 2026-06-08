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
- **Integration:** Fully integrated with the game loop, combat system, travel system, and ship medbay healing.

### Cybernetic Implants / Augmentation System (Completed)
**How it works:** A progression layer separate from leveling and traditional equipment. Players have a limited number of "Cyber-Slots" (Head, Arms, Torso, Nervous System) that can be fitted with custom augmentations in the Spacecraft Hub's Augmentation Clinic.
**Mechanics:**
- **Reflex Boosters (Arms):** Grants a 35% chance to start combat with +1 Action Point (AP).
- **Sub-dermal Plating (Torso):** Converts 15% of incoming physical damage into energy drain instead of health loss.
- **Targeting Matrix (Head):** Increases critical damage multiplier by +0.5x.
- **Synaptic Accelerator (Nervous System):** Increases Dodge Action success chance by +15%.
- **Surgical Suite:** Operations consume credits and rare components. Extraction requires a 50 CR surgical fee.

---

## 🔮 Future / Planned Ideas

### 1. Faction Reputation & Allegiances
**How it works:** Expand the existing quest and NPC systems by introducing major galactic factions (e.g., The Galactic Federation, The Void Corsairs [Space Pirates], and the Photon Prime Syndicate). 
**Why it fits:** Adds narrative depth and gives more weight to the "Main Story" and "Side Quests" systems. 
**Mechanics:**
- Completing quests for one faction raises your reputation with them but lowers it with their rivals.
- **Perks:** High reputation with Photon Prime might give a 20% discount on online orders and exclusive high-tier drop boxes.
- **Consequences:** Negative reputation with the Void Corsairs means you get ambushed by pirate boarding parties during planetary travel.

### 2. Branching Narrative Quest System
**How it works:** Transition the quest system from simple tasks to multi-stage story arcs with branching decisions, skill checks, persistent NPCs, and outcomes that change the game world.
**Why it fits:** Provides players with a stronger narrative drive, letting roleplaying choices impact the state of the galaxy.
**Mechanics:**
- **Persistent Named NPCs:** Rather than generic quest-givers, players interact with key recurring characters with unique names, backgrounds, and distinct personalities (which also affect their quest rewards and dialogues).
  - *Captain Valen Vance:* The cynical, duty-bound Galactic Federation commander who values order and discipline but hides a soft spot for lost causes.
  - *Jax "Sparky" Mercer:* A hyperactive, eccentric Rogue mechanic who operates in grey markets, loves illegal cybernetics, and speaks in fast-paced space-slang.
  - *Dr. Elyse Thorne:* A cold, calculating scientist obsessed with ancient alien relics, who values knowledge and technology over morality.
  - *Nesta, Void Corsair Envoy:* A charismatic, ruthless space pirate representative who respects raw strength and cunning negotiation.
- **NPC Disposition & Memory:** Recurring NPCs remember your past choices, dialogue responses, and faction standing, altering how they greet you, the prices they offer, or if they cooperate at all.
- **Context-Specific Quest Availability:** Quests are bound to specific environments. Certain missions are only offered while docked on specific planets (e.g., searching for thermal cores on Inferno-IX), while others trigger as emergent events during travel (e.g., intercepting emergency transmissions or finding anomalies that lead to derelict-only storylines).
- **Attribute / Class Checks:** Dialogues that allow specialized options based on role or stats (e.g., Scientist using Science/Hack skills to bypass security, Rogue using Charisma/Stealth to negotiate, Warrior using Strength to intimidate).
- **Galactic Outcomes:** Major decisions at the end of quest lines (e.g., choosing to save a bio-dome, side with a corporate syndicate, or help a group of rebel colonists) that permanently modify planetary hubs, NPC services, and active side quests.
- **Branching Endings:** Distinct narrative endings based on quest outcomes, faction allegiances, and player choices.

### 3. Location-Specific Ecologies & Unique Threats
**How it works:** Rework the enemy generation system so that each planetary body or space dungeon features custom, thematic enemies with distinct combat mechanics.
**Why it fits:** Enhancing location-specific threats rewards strategic loadout planning and gives each planet a unique identity.
**Mechanics:**
- **Thematic Enemy Types:**
  - *Volcanic Planet (Inferno-IX):* Volcanic fire-rock elementals that explode on death and apply permanent "Burn" damage over time unless blocked.
  - *Ice Planet (Crio-Prime):* Cryo-parasites that drain AP (Action Points) on hit or freeze character actions.
  - *Derelict Ships / Anomalies:* Phasing shadow-beasts that are immune to physical attacks (requiring energy weapons or shields) and rogue security units that hack shield capacitors.
- **Environmental Combat Modifiers:** Planetary hazards modify the combat arena (e.g., high gravity doubling AP cost for heavy movement/attacks, solar radiation draining energy per turn, vacuum environments constantly depleting Oxygen).

### 4. Tactical Combat 2.0 (Combos, Stagger, and Stances)
**How it works:** Expand the combat system to introduce elemental damage interactions, stance-switching, and a posture-breaking system to add layer-based strategy to every turn.
**Why it fits:** Elevates combat from a simple cycle of attacks/blocks into a deeper tactical game where actions build toward powerful synergies.
**Mechanics:**
- **Elemental Synergies & Combos:**
  - Introduce Thermal (burn), Cryo (freeze), Plasma (shock), and Corrosive (acid) damage.
  - Trigger combo-chains (e.g., applying Cryo first to slow an enemy, then hitting them with physical damage to shatter them for 2x damage; or using Plasma on a wet/conductive target to stun them).
- **Stagger & Break System:** Enemies (especially Bosses and Elites) possess a second "Break Shield/Posture" gauge. Certain heavy attacks (like Warrior's Power Strike or grenades) deal high Stagger. Reducing the gauge to zero breaks the enemy, stunning them for one turn and doubling all incoming damage.
- **Role Combat Stances:** Toggleable stances that modify turn-by-turn performance:
  - *Warrior:* Vanguard Stance (taunts enemies, absorbs companion damage) vs. Berserker Stance (attacks deal double stagger, but receives 20% more damage).
  - *Rogue:* Shadow Stance (stealth, guaranteed crits, cannot block/dodge) vs. Skirmisher Stance (reduced AP cost for movement and item usage).
  - *Scientist:* Support Overclock (increases AP generation for the player and companions) vs. Disruption Mode (normal attacks apply random debuffs like EMP or Corrosive).

