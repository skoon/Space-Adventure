// Sci-Fi Space Locations
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
    lootTable: ["Scrap Metal", "Rusty Pipe", "Herb", "Energy Cell", "Credits"],
    controllingFaction: "federation",
    districts: [
      {
        id: "terra_prime_fed_hq",
        name: "Federation Command HQ",
        description: "The heavily fortified headquarters of the local Federation garrison. Captain Vance coordinates sector security from the tactical war room here.",
        npc: "vance",
        icon: "🏢"
      },
      {
        id: "terra_prime_bazaar",
        name: "Bazaar District",
        description: "A bustling marketplace filled with traders, merchants, and colonists hawking local wares.",
        npc: null,
        icon: "🛍️"
      },
      {
        id: "terra_prime_residential",
        name: "Residential Sector",
        description: "A quiet dome containing habitats, gardens, and recreation zones for civilian colonists.",
        npc: null,
        icon: "🏡"
      }
    ]
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
    lootTable: ["Sand Sample", "Ancient Shard", "Scrap Metal", "Plasma Core", "Cargo Container", "Credits"],
    controllingFaction: "corsairs",
    districts: [
      {
        id: "xylo_delta_smugglers_den",
        name: "Smuggler's Den",
        description: "A hidden outpost carved into the canyon walls, serving as a hub for the Void Corsairs. Envoy Nesta runs their regional smuggling network from here.",
        npc: "nesta",
        icon: "☠️"
      },
      {
        id: "xylo_delta_salvage_yard",
        name: "Scavenger Salvage Yard",
        description: "A vast expanse of rusted starship hulls. Jax 'Sparky' Mercer coordinates salvage operations from his workshop.",
        npc: "mercer",
        icon: "🔧"
      }
    ]
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
    lootTable: ["Data Chip", "Alien Alloy", "Quantum Chip", "Energy Cell", "Credits"],
    controllingFaction: "syndicate",
    districts: [
      {
        id: "nebula_outpost_summit_hall",
        name: "Crucible Summit Hall",
        description: "The grand assembly chamber of the outpost, currently hosting the high-stakes Galactic Peace Summit between all major factions.",
        npc: "delegates",
        icon: "🏛️"
      },
      {
        id: "nebula_outpost_hangars",
        name: "Docking Hangars",
        description: "Vast docking bays filled with visiting diplomats' shuttles and starships.",
        npc: null,
        icon: "🛸"
      }
    ]
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
    lootTable: ["Data Chip", "Alien Alloy", "Quantum Chip", "Energy Cell", "Credits"],
    controllingFaction: "syndicate",
    districts: [
      {
        id: "norkon_outpost_lab",
        name: "Syndicate Singularity Lab",
        description: "A state-of-the-art research laboratory operated by the Photon Prime Syndicate. Dr. Elyse Thorne conducts high-risk quantum singularity experiments here.",
        npc: "thorne",
        icon: "🧪"
      },
      {
        id: "norkon_outpost_reactor",
        name: "Singularity Core Reactor",
        description: "The pulsing, experimental core powering the research facility. Heavily shielded and highly unstable.",
        npc: null,
        icon: "⚡"
      }
    ]
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
    environment: "Solar Radiation",
    controllingFaction: "syndicate",
    districts: [
      {
        id: "inferno_ix_refinery",
        name: "Magma Extraction Refinery",
        description: "A scorching industrial facility that refines rare metals harvested from the planet's active lava flows.",
        npc: null,
        icon: "🏭"
      }
    ]
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
    environment: "High Gravity",
    controllingFaction: "federation",
    districts: [
      {
        id: "crio_prime_vault",
        name: "Cryo-Genetic Vault",
        description: "An ancient, frozen facility buried deep beneath the ice sheets, housing classified biological research.",
        npc: null,
        icon: "❄️"
      }
    ]
  },
  "galactic_nexus": {
    id: "galactic_nexus",
    name: "Galactic Nexus Hub",
    description: "The primary commerce and social hub of the sector. Features a live commodities exchange.",
    hazardLevel: 1,
    engineLevelReq: 1,
    coordinates: { x: 450, y: 250 },
    theme: "theme-space",
    travelCost: 150,
    lootTable: ["Data Chip", "Scrap Metal", "Quantum Chip", "Credits"],
    controllingFaction: "federation",
    isNexusHub: true,
    districts: [
      {
        id: "galactic_nexus_plaza",
        name: "Nexus Commerce Plaza",
        description: "The sparkling central plaza of the sector's main hub, filled with glowing holographic displays, trade terminals, and diverse alien species.",
        npc: null,
        icon: "🌌"
      }
    ]
  }
};
