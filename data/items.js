// Sci-Fi Space Items
export const items = {
  "Energy Cell": { type: "consumable", category: "consumable", effect: "heal", value: 30, description: "Restores 30 HP", price: 50, stackable: true},
  "Nano Stimpack": { type: "consumable", category: "consumable", effect: "heal", value: 50, description: "Restores 50 HP", price: 100, stackable: true },
  "Advanced Medkit": { type: "consumable", category: "consumable", effect: "heal", value: 75, description: "Restores 75 HP (crafted)", price: 150, stackable: true },
  "Frag Grenade": { type: "consumable", category: "consumable", effect: "damage", value: 30, stagger: 50, description: "Deals 30 damage and 50 stagger.", price: 150, stackable: true },
  "EMP Grenade": { type: "consumable", category: "consumable", effect: "damage", value: 10, stagger: 80, damageType: "Plasma", applyStatus: "Electrified", description: "Deals 10 Plasma damage, 80 stagger, and Electrifies.", price: 200, stackable: true },
  "Alien Crystal": { type: "material", category: "material", description: "A mysterious glowing crystal.", price: 200, stackable: true },
  "Data Chip": { type: "material", category: "material", description: "Contains encrypted data.", price: 150, stackable: true },
  "Scrap Metal": { type: "material", category: "material", description: "Useful for crafting.", price: 20, stackable: true },
  "Rusty Pipe": { type: "material", category: "material", description: "An old metal pipe.", price: 10, stackable: true },
  "Titanium Ingot": { type: "material", category: "material", description: "An ingot of Titanium.", price: 600, stackable: true },
  "Plasma Core": { type: "material", category: "material", description: "A core of plasma.", price: 1200, stackable: true },
  "Circuit Board": { type: "material", category: "material", description: "A circuit board.", price: 300, stackable: true },
  "Bio-Gel": { type: "material", category: "material", description: "A gel that heals wounds.", price: 200, stackable: true },
  "Nanites": { type: "material", category: "material", description: "Nanites that heal wounds.", price: 200, stackable: true },
  "Laser Capacitor": { type: "material", category: "material", description: "A capacitor that stores energy.", price: 400, stackable: true },
  "Robotic Arm": { type: "material", category: "material", description: "A robotic arm.", price: 500, stackable: true },
  "Hydraulic Press": { type: "material", category: "material", description: "A hydraulic press.", price: 1000, stackable: true }, 
  "Tungsten Ore": { type: "material", category: "material", description: "An ingot of Tungsten.", price: 600, stackable: true },
  "Carbon Nanotubes": { type: "material", category: "material", description: "A bundle of carbon nanotubes.", price: 800, stackable: true },
  "Quantum Chip": { type: "material", category: "material", description: "A chip that stores quantum data.", price: 1500, stackable: true },
  "Rare Earth Elements": { type: "material", category: "material", description: "Rare earth elements used in advanced technology.", price: 1000, stackable: true },  
  "Industrial Compressor": { type: "material", category: "material", description: "An industrial compressor for compressing materials.", price: 1200, stackable: true },  
  "Medical Synthesizer": { type: "material", category: "material", description: "A medical synthesizer for creating medical supplies.", price: 1500, stackable: true },
  "Cargo Container": { type: "material", category: "material", description: "A heavy shipping crate containing valuable cargo.", price: 400, stackable: true },
  
  // Weapons
  "Plasma Rifle": { type: "weapon", category: "equipment", stats: { attack: 5 }, description: "A powerful energy weapon.", price: 500, stackable: false },
  "Enhanced Plasma Rifle": { type: "weapon", category: "equipment", stats: { attack: 8 }, description: "An upgraded energy weapon with alien tech.", price: 1000, stackable: false },
  "Laser Blade": { type: "weapon", category: "equipment", stats: { attack: 7 }, description: "A high-tech melee weapon.", price: 750, stackable: false },
  "Photon Cannon": { type: "weapon", category: "equipment", stats: { attack: 10 }, description: "Devastating ranged weapon.", price: 1200, stackable: false },
  "Cryo Pistol": { type: "weapon", category: "equipment", stats: { attack: 4 }, description: "Fires cryo-beams that freeze enemies.", price: 600, stackable: false },
  "Acid Injector": { type: "weapon", category: "equipment", stats: { attack: 6 }, description: "Injects corrosive acid that melts armor.", price: 800, stackable: false },

  // Armor
  "Kevlar Vest": { type: "armor", category: "equipment", stats: { defense: 4 }, description: "Basic protective armor.", price: 400, stackable: false },
  "Titanium Plating": { type: "armor", category: "equipment", stats: { defense: 6 }, description: "Heavy-duty armor plating.", price: 800, stackable: false },
  "Exoskeleton": { type: "armor", category: "equipment", stats: { defense: 8 }, description: "Powered armor that enhances strength.", price: 1500, stackable: false },
  "Makeshift Plating": { type: "armor", category: "equipment", stats: { defense: 5 }, description: "Crude but effective armor.", price: 350, stackable: false },

  // Accessories
  "Shield Generator": { type: "accessory", category: "equipment", stats: { defense: 3 }, description: "Generates a personal forcefield.", price: 600, stackable: false },
  "Targeting HUD": { type: "accessory", category: "equipment", stats: { attack: 3 }, description: "Improves accuracy and damage.", price: 600, stackable: false },
  "Quantum Shield Core": { type: "accessory", category: "equipment", stats: { defense: 10 }, description: "A legendary accessory that forms an impenetrable energy field.", price: 3000, rarity: "Legendary", stackable: false },
  "Plasma Targeting HUD": { type: "accessory", category: "equipment", stats: { attack: 10 }, description: "A legendary accessory that grants extreme tactical targeting data.", price: 3000, rarity: "Legendary", stackable: false },
  "Quantum Shield Core Recipe": { type: "material", category: "material", recipeId: "quantum_shield_core", description: "Use this blueprint from inventory to discover the Quantum Shield Core crafting recipe.", price: 1000, stackable: true },
  "Plasma Targeting HUD Recipe": { type: "material", category: "material", recipeId: "plasma_targeting_hud", description: "Use this blueprint from inventory to discover the Plasma Targeting HUD crafting recipe.", price: 1000, stackable: true },
  "Cybernetic Core": { type: "material", category: "material", description: "A high-fidelity CPU core required for cybernetic diagnostics and retrofits.", price: 0, stackable: true },
  "Encryption Key": { type: "material", category: "material", description: "A cryptographic key used to unlock restricted data sectors in medical androids.", price: 0, stackable: true },
  "Bounty Hunter Emblem": { type: "material", category: "material", description: "Proof of defeating a Void Corsair Bounty Hunter, needed to clear outstanding debts.", price: 0, stackable: true }
};
