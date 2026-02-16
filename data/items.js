export const items = {
  "Energy Cell": { type: "consumable", category: "consumable", effect: "heal", value: 30, description: "Restores 30 HP", price: 50, stackable: true},
  "Nano Stimpack": { type: "consumable", category: "consumable", effect: "heal", value: 50, description: "Restores 50 HP", price: 100, stackable: true },
  "Advanced Medkit": { type: "consumable", category: "consumable", effect: "heal", value: 75, description: "Restores 75 HP (crafted)", price: 150, stackable: true },
  "Alien Crystal": { type: "material", category: "material", description: "A mysterious glowing crystal.", price: 200, stackable: true },
  "Data Chip": { type: "material", category: "material", description: "Contains encrypted data.", price: 150, stackable: true },
  "Scrap Metal": { type: "material", category: "material", description: "Useful for crafting.", price: 20, stackable: true },
  "Rusty Pipe": { type: "material", category: "material", description: "An old metal pipe.", price: 10, stackable: true },

  // Weapons
  "Plasma Rifle": { type: "weapon", category: "equipment", stats: { attack: 5 }, description: "A powerful energy weapon.", price: 500, stackable: false },
  "Enhanced Plasma Rifle": { type: "weapon", category: "equipment", stats: { attack: 8 }, description: "An upgraded energy weapon with alien tech.", price: 1000, stackable: false },
  "Laser Blade": { type: "weapon", category: "equipment", stats: { attack: 7 }, description: "A high-tech melee weapon.", price: 750, stackable: false },
  "Photon Cannon": { type: "weapon", category: "equipment", stats: { attack: 10 }, description: "Devastating ranged weapon.", price: 1200, stackable: false },

  // Armor
  "Kevlar Vest": { type: "armor", category: "equipment", stats: { defense: 4 }, description: "Basic protective armor.", price: 400, stackable: false },
  "Titanium Plating": { type: "armor", category: "equipment", stats: { defense: 6 }, description: "Heavy-duty armor plating.", price: 800, stackable: false },
  "Exoskeleton": { type: "armor", category: "equipment", stats: { defense: 8 }, description: "Powered armor that enhances strength.", price: 1500, stackable: false },
  "Makeshift Plating": { type: "armor", category: "equipment", stats: { defense: 5 }, description: "Crude but effective armor.", price: 350, stackable: false },

  // Accessories
  "Shield Generator": { type: "accessory", category: "equipment", stats: { defense: 3 }, description: "Generates a personal forcefield.", price: 600, stackable: false },
  "Targeting HUD": { type: "accessory", category: "equipment", stats: { attack: 3 }, description: "Improves accuracy and damage.", price: 600, stackable: false }
};
