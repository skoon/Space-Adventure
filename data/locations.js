export const locations = {
  "terra_prime": {
    id: "terra_prime",
    name: "Terra Prime",
    description: "A lush, earth-like planet with basic resources.",
    hazardLevel: 1,
    unlocked: true,
    coordinates: { x: 100, y: 300 },
    theme: "theme-terra",
    travelCost: 0,
    lootTable: ["Scrap Metal", "Rusty Pipe", "Herb", "Energy Cell", "Credits"]
  },
  "xylo_delta": {
    id: "xylo_delta",
    name: "Xylo Delta",
    description: "A desert world filled with dangerous scavengers.",
    hazardLevel: 2,
    unlocked: true,
    coordinates: { x: 400, y: 150 },
    theme: "theme-desert",
    travelCost: 100,
    lootTable: ["Sand Sample", "Ancient Shard", "Scrap Metal", "Credits"]
  },
  "nebula_outpost": {
    id: "nebula_outpost",
    name: "Nebula Outpost",
    description: "An abandoned space station drifting in the void.",
    hazardLevel: 3,
    unlocked: true,
    coordinates: { x: 600, y: 400 },
    theme: "theme-space",
    travelCost: 250,
    lootTable: ["Data Chip", "Alien Alloy", "Energy Cell", "Credits"]
  }
};
