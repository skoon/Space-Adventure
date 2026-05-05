export const enemies = [
  { name: "Xenobot", hp: 50, attack: 10, defense: 3, locations: ["terra_prime", "nebula_outpost"], drops: ["Scrap Metal", "Energy Cell"] },
  { name: "Plasmavore", hp: 40, attack: 12, defense: 2, locations: ["terra_prime", "xylo_delta"], drops: ["Alien Crystal"] },
  { name: "Nano Swarm", hp: 30, attack: 8, defense: 1, locations: ["nebula_outpost"], drops: ["Nano Stimpack", "Scrap Metal"] },
  { name: "Sand Worm", hp: 120, attack: 15, defense: 5, locations: ["xylo_delta"], drops: ["Sand Sample", "Ancient Shard"] },
  { name: "Void Stalker", hp: 80, attack: 18, defense: 2, locations: ["nebula_outpost"], drops: ["Alien Alloy", "Data Chip"] }
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
  }
];
