export const locations = {
  "terra_prime": {
    id: "terra_prime",
    name: "Terra Prime",
    description: "A lush, earth-like planet with basic resources.",
    hazardLevel: 1,
    engineLevelReq: 1,
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
    engineLevelReq: 2,
    coordinates: { x: 400, y: 150 },
    theme: "theme-desert",
    travelCost: 100,
    lootTable: ["Sand Sample", "Ancient Shard", "Scrap Metal", "Plasma Core", "Cargo Container", "Credits"]
  },
  "nebula_outpost": {
    id: "nebula_outpost",
    name: "Nebula Outpost",
    description: "An abandoned space station drifting in the void.",
    hazardLevel: 3,
    engineLevelReq: 3,
    coordinates: { x: 600, y: 400 },
    theme: "theme-space",
    travelCost: 250,
    lootTable: ["Data Chip", "Alien Alloy", "Quantum Chip", "Energy Cell", "Credits"]
  },
  "norkon_outpost": {
    id: "norkon_outpost",
    name: "Norkon Outpost",
    description: "A space station drifting in the void.",
    hazardLevel: 3,
    engineLevelReq: 1,
    coordinates: { x: 200, y: 100 },
    theme: "theme-space",
    travelCost: 250,
    lootTable: ["Data Chip", "Alien Alloy", "Quantum Chip", "Energy Cell", "Credits"]
  },
  "inferno_ix": {
    id: "inferno_ix",
    name: "Inferno-IX",
    description: "A volcanic hellscape rich in rare metals, but plagued by extreme heat.",
    hazardLevel: 4,
    engineLevelReq: 2,
    coordinates: { x: 300, y: 350 },
    theme: "theme-volcanic",
    travelCost: 300,
    lootTable: ["Titanium Ingot", "Plasma Core", "Scrap Metal", "Credits"],
    environment: "Solar Radiation"
  },
  "crio_prime": {
    id: "crio_prime",
    name: "Crio-Prime",
    description: "An icy wasteland where sub-zero temperatures freeze machinery and flesh alike.",
    hazardLevel: 4,
    engineLevelReq: 3,
    coordinates: { x: 700, y: 200 },
    theme: "theme-ice",
    travelCost: 400,
    lootTable: ["Alien Crystal", "Bio-Gel", "Quantum Chip", "Credits"],
    environment: "High Gravity"
  }
};
