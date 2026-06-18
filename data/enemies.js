export const enemies = [
  { name: "Xenobot", hp: 65, attack: 12, defense: 4, locations: ["terra_prime", "nebula_outpost"], drops: ["Scrap Metal", "Energy Cell"] },
  { name: "Plasmavore", hp: 55, attack: 14, defense: 3, locations: ["terra_prime", "xylo_delta"], drops: ["Alien Crystal"] },
  { name: "Nano Swarm", hp: 45, attack: 10, defense: 2, locations: ["nebula_outpost"], drops: ["Nano Stimpack", "Scrap Metal"] },
  { name: "Sand Worm", hp: 140, attack: 18, defense: 6, locations: ["xylo_delta"], drops: ["Sand Sample", "Ancient Shard"] },
  { name: "Void Stalker", hp: 95, attack: 22, defense: 4, locations: ["nebula_outpost"], drops: ["Alien Alloy", "Data Chip"] },
  // Derelict Specific Enemies
  { name: "Derelict Security Drone", hp: 75, attack: 16, defense: 6, locations: ["derelict"], drops: ["Circuit Board", "Scrap Metal"] },
  { name: "Infestation Swarm", hp: 55, attack: 14, defense: 2, locations: ["derelict"], drops: ["Bio-Gel", "Alien Crystal"] },
  { name: "Mutated Crewmate", hp: 85, attack: 18, defense: 4, locations: ["derelict"], drops: ["Rusty Pipe", "Medical Synthesizer"] },
  { name: "Void Corsair Raider", hp: 100, attack: 24, defense: 5, locations: ["derelict"], drops: ["Energy Cell", "Titanium Ingot"] },
  // Inferno-IX Enemies
  { name: "Magma Elemental", hp: 90, attack: 16, defense: 4, locations: ["inferno_ix"], drops: ["Plasma Core", "Energy Cell"] },
  { name: "Ashen Hulk", hp: 150, attack: 14, defense: 8, locations: ["inferno_ix"], drops: ["Titanium Ingot", "Alien Alloy"] },
  // Crio-Prime Enemies
  { name: "Frost parasite", hp: 70, attack: 12, defense: 3, locations: ["crio_prime"], drops: ["Nano Stimpack", "Bio-Gel"] },
  { name: "Cryo Drake", hp: 120, attack: 20, defense: 6, locations: ["crio_prime"], drops: ["Alien Crystal", "Titanium Ingot"] },
  // Additional Derelict / Anomaly Enemies
  { name: "Eldritch Shade", hp: 80, attack: 18, defense: 2, locations: ["derelict"], drops: ["Ancient Shard", "Alien Crystal"] },
  { name: "Security Sentinel", hp: 90, attack: 15, defense: 8, locations: ["derelict"], drops: ["Circuit Board", "Quantum Chip"] }
];

export const bosses = [
  {
    id: "boss_terra",
    name: "Overlord Xylar",
    locations: ["terra_prime"],
    hp: 200, attack: 20, defense: 5,
    drops: ["Energy Cell", "Alien Crystal"],
    phases: [
      { threshold: 0.5, name: "Enraged", attackBuff: 10, defenseNerf: 2, msg: "Xylar goes into a frenzy, shedding its armor for raw power!" }
    ],
    specialAttacks: [
      { name: "Annihilation Beam", damageMultiplier: 2.0, chance: 0.25, msg: "Xylar fires a massive Annihilation Beam!" }
    ]
  },
  {
    id: "boss_xylo",
    name: "The Great Sandworm",
    locations: ["xylo_delta"],
    hp: 300, attack: 15, defense: 10,
    drops: ["Sand Sample", "Ancient Shard"],
    phases: [
      { threshold: 0.5, name: "Burrowed", attackBuff: 5, defenseBuff: 5, defenseNerf: 0, msg: "The Sandworm burrows deep, increasing its defenses!" }
    ],
    specialAttacks: [
      { name: "Devour", damageMultiplier: 1.5, chance: 0.3, msg: "The Sandworm attempts to devour you whole!" }
    ]
  },
  {
    id: "boss_nebula",
    name: "Void Stalker Alpha",
    locations: ["nebula_outpost"],
    hp: 250, attack: 25, defense: 5,
    drops: ["Alien Alloy", "Data Chip"],
    phases: [
      { threshold: 0.5, name: "Cloaked", attackBuff: 15, defenseBuff: 0, defenseNerf: 0, msg: "The Alpha cloaks itself, striking from the shadows!" }
    ],
    specialAttacks: [
      { name: "Void Strike", damageMultiplier: 1.8, chance: 0.3, msg: "The Alpha strikes you from the void!" }
    ]
  },
  {
    id: "boss_derelict",
    name: "Void Sentinel Alpha",
    locations: ["derelict"],
    hp: 260, attack: 22, defense: 7,
    drops: ["Quantum Shield Core Recipe", "Plasma Targeting HUD Recipe"],
    phases: [
      { threshold: 0.5, name: "Aura Discharged", attackBuff: 12, defenseBuff: 0, defenseNerf: 3, msg: "The Construct vents its outer plating, discharging crackling void energy!" }
    ],
    specialAttacks: [
      { name: "Gravitational Collapse", damageMultiplier: 1.8, chance: 0.3, msg: "The anomaly compresses gravitational fields, causing a localized collapse!" }
    ]
  }
];
