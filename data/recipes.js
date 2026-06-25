const recipeEntries = {
  "advanced_heal": {
      id: "advanced_heal",
      name: "Advanced Medkit",
      creates: "Advanced Medkit",
      requires: {
          "Energy Cell": 2,
          "Scrap Metal": 1
      },
      description: "Combine energy cells with scrap to create a powerful healing item."
  },
  "upgrade_weapon": {
      id: "upgrade_weapon",
      name: "Enhanced Plasma Rifle",
      creates: "Enhanced Plasma Rifle",
      requires: {
          "Plasma Rifle": 1,
          "Alien Crystal": 2
      },
      description: "Enhance a plasma rifle with alien technology."
  },
  "makeshift_armor": {
      id: "makeshift_armor",
      name: "Makeshift Plating",
      creates: "Makeshift Plating",
      requires: {
          "Scrap Metal": 3,
          "Rusty Pipe": 1
      },
      description: "Forge basic armor from scrap materials."
  },
  "quantum_shield_core": {
      id: "quantum_shield_core",
      name: "Quantum Shield Core",
      creates: "Quantum Shield Core",
      requires: {
          "Quantum Chip": 2,
          "Plasma Core": 1,
          "Circuit Board": 3
      },
      description: "A legendary accessory that forms an impenetrable energy field."
  },
  "plasma_targeting_hud": {
      id: "plasma_targeting_hud",
      name: "Plasma Targeting HUD",
      creates: "Plasma Targeting HUD",
      requires: {
          "Quantum Chip": 1,
          "Plasma Core": 2,
          "Carbon Nanotubes": 4
      },
      description: "A legendary accessory that grants extreme tactical targeting data."
  }
};

export const recipes = recipeEntries;
