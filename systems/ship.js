/**
 * Ship Upgrades & Maintenance Module
 * Handles ship module upgrades and bonuses
 */

let state;
let addLog, updateUI, showDialog;
let gainXp;

export function initShip(deps) {
    state = deps.state;
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showDialog = deps.ui.showDialog;
    gainXp = deps.character?.gainXp;
}

export const shipModules = {
    engine: {
        id: 'engine',
        name: 'Engine',
        maxLevel: 3,
        descriptions: [
            "Basic thrusters. Limited range.",
            "Upgraded warp drive. Unlocks Outer Planets.",
            "Advanced hyperdrive. Unlocks Deep Space."
        ],
        costs: [
            { credits: 0, materials: {} }, // Level 1 (base)
            { credits: 500, materials: { "Titanium Ingot": 2, "Energy Cell": 1 } }, // Level 1 -> 2
            { credits: 1500, materials: { "Titanium Ingot": 5, "Plasma Core": 1 } } // Level 2 -> 3
        ]
    },
    medbay: {
        id: 'medbay',
        name: 'Medical Bay',
        maxLevel: 3,
        descriptions: [
            "No automated healing.",
            "Basic first aid. Heals 10 HP after combat/travel.",
            "Advanced surgical pod. Heals 25 HP after combat/travel.",
            "Regenerative nanites. Heals 50 HP after combat/travel."
        ],
        costs: [
            { credits: 200, materials: { "Bio-Gel": 2 } }, // Level 0 -> 1
            { credits: 800, materials: { "Bio-Gel": 5, "Energy Cell": 2 } }, // Level 1 -> 2
            { credits: 2000, materials: { "Bio-Gel": 10, "Plasma Core": 1 } } // Level 2 -> 3
        ]
    },
    cargo: {
        id: 'cargo',
        name: 'Cargo Hold',
        maxLevel: 3,
        descriptions: [
            "Standard storage.",
            "Expanded bay. Increases inventory capacity.",
            "Quantum storage. Vastly increases inventory capacity.",
            "Pocket dimension. Near limitless storage."
        ],
        costs: [
            { credits: 300, materials: { "Titanium Ingot": 3 } },
            { credits: 1000, materials: { "Titanium Ingot": 8, "Energy Cell": 2 } },
            { credits: 2500, materials: { "Titanium Ingot": 15, "Plasma Core": 2 } }
        ]
    },
    scanner: {
        id: 'scanner',
        name: 'Scanner Array',
        maxLevel: 3,
        descriptions: [
            "Basic sensors.",
            "Deep space array. +10% chance for positive events.",
            "Tachyon sensors. +25% chance for positive events.",
            "Omniscient eye. +50% chance for positive events."
        ],
        costs: [
            { credits: 400, materials: { "Circuit Board": 3 } },
            { credits: 1200, materials: { "Circuit Board": 6, "Energy Cell": 2 } },
            { credits: 3000, materials: { "Circuit Board": 12, "Plasma Core": 1 } }
        ]
    },
    shield: {
        id: 'shield',
        name: 'Deflector Shields',
        maxLevel: 3,
        descriptions: [
            "No active deflector shields.",
            "Standard energy barrier. Max Ship Shields: 50.",
            "Heavy deflector shield. Max Ship Shields: 100.",
            "Quantum aegis matrix. Max Ship Shields: 150."
        ],
        costs: [
            { credits: 250, materials: { "Circuit Board": 2, "Energy Cell": 1 } },
            { credits: 750, materials: { "Circuit Board": 5, "Energy Cell": 3 } },
            { credits: 1800, materials: { "Circuit Board": 10, "Plasma Core": 1 } }
        ]
    },
    weapons: {
        id: 'weapons',
        name: 'Ship Weapon Systems',
        maxLevel: 3,
        descriptions: [
            "Unarmed vessel. Evasive actions only.",
            "Light plasma cannons. Deals 20 base space damage.",
            "Dual laser turrets. Deals 40 base space damage.",
            "Anti-matter torpedo launcher. Deals 70 base space damage."
        ],
        costs: [
            { credits: 300, materials: { "Titanium Ingot": 2, "Circuit Board": 1 } },
            { credits: 900, materials: { "Titanium Ingot": 6, "Energy Cell": 2 } },
            { credits: 2000, materials: { "Titanium Ingot": 12, "Plasma Core": 1 } }
        ]
    }
};

export function getUpgradeCost(moduleId, currentLevel) {
    const module = shipModules[moduleId];
    if (!module || currentLevel >= module.maxLevel) return null;
    
    // For engine, index 0 is base cost (0), index 1 is upgrade to level 2
    // For others, index 0 is upgrade to level 1
    const costIndex = moduleId === 'engine' ? currentLevel : currentLevel;
    
    if (costIndex < module.costs.length) {
        return module.costs[costIndex];
    }
    return null;
}

export function canAffordUpgrade(cost) {
    if (!cost) return false;
    
    if (state.character.credits < cost.credits) return false;
    
    // Check materials
    for (const [material, amount] of Object.entries(cost.materials)) {
        const count = state.inventory.filter(i => i === material).length;
        if (count < amount) return false;
    }
    
    return true;
}

export function upgradeModule(moduleId) {
    if (!state.character || !state.character.ship) return false;
    
    const moduleKey = moduleId + 'Level';
    const currentLevel = state.character.ship[moduleKey];
    const moduleInfo = shipModules[moduleId];
    
    if (currentLevel >= moduleInfo.maxLevel) {
        addLog(`❌ ${moduleInfo.name} is already at maximum level.`);
        return false;
    }
    
    const cost = getUpgradeCost(moduleId, currentLevel);
    if (!cost) return false;
    
    if (!canAffordUpgrade(cost)) {
        addLog(`❌ Cannot afford ${moduleInfo.name} upgrade.`);
        return false;
    }
    
    // Deduct credits
    state.character.credits -= cost.credits;
    
    // Deduct materials
    for (const [material, amount] of Object.entries(cost.materials)) {
        for (let i = 0; i < amount; i++) {
            const index = state.inventory.indexOf(material);
            if (index > -1) {
                state.inventory.splice(index, 1);
            }
        }
    }
    
    // Upgrade
    state.character.ship[moduleKey]++;
    
    if (moduleId === 'shield') {
        const lvl = state.character.ship.shieldLevel;
        state.character.ship.maxShields = lvl * 50;
        state.character.ship.shields = state.character.ship.maxShields;
    }
    
    addLog(`🚀 ${moduleInfo.name} upgraded to level ${state.character.ship[moduleKey]}!`);
    updateUI();
    return true;
}

// Hooks
export function getMedbayHealAmount() {
    if (!state || !state.character || !state.character.ship) return 0;
    const level = state.character.ship.medbayLevel;
    if (level === 1) return 10;
    if (level === 2) return 25;
    if (level === 3) return 50;
    return 0;
}

export function getScannerBonus() {
    if (!state || !state.character || !state.character.ship) return 0;
    const level = state.character.ship.scannerLevel;
    // Return extra weight for good events
    if (level === 1) return 10; // +10% weight
    if (level === 2) return 25;
    if (level === 3) return 50;
    return 0;
}

export function getEngineLevel() {
    if (!state || !state.character || !state.character.ship) return 1;
    return state.character.ship.engineLevel;
}

/**
 * Apply damage to the ship, draining shields first, then character HP if shields are depleted.
 */
export function applyShipDamage(amount) {
    const ship = state.character.ship;
    const currentShields = ship.shields || 0;
    const maxShields = ship.maxShields || (ship.shieldLevel * 50);
    
    if (currentShields >= amount) {
        ship.shields -= amount;
        addLog(`🛡️ Deflector shields absorbed the impact, taking ${amount} shield damage. (Shields: ${ship.shields}/${maxShields})`);
        return { shieldDmg: amount, hullDmg: 0 };
    } else {
        const leftover = amount - currentShields;
        ship.shields = 0;
        const hpDmg = Math.ceil(leftover / 2);
        const oldHp = state.character.hp || 0;
        state.character.hp = Math.max(1, oldHp - hpDmg);
        addLog(`💥 Shield collapsed! The remaining impact breached the hull, dealing ${hpDmg} damage to your character! (HP: ${state.character.hp}/${state.character.maxHp})`);
        return { shieldDmg: currentShields, hullDmg: hpDmg };
    }
}

/**
 * Tactical Space-Combat & Ship Defense Events List
 */
export const spaceEvents = [
    {
        id: 'void_pirates',
        name: 'Void Corsair Raiders',
        trigger: (location, onComplete) => {
            const ship = state.character.ship;
            const currentShields = ship.shields || 0;
            const maxShields = ship.maxShields || (ship.shieldLevel * 50);
            const weaponsLevel = ship.weaponsLevel || 0;
            const engineLevel = ship.engineLevel || 1;
            
            const title = "🚨 Hostile Contact: Void Corsair Raiders";
            const text = `A sleek Void Corsair interceptor drops out of warp, locking weapons onto your vessel!
                <br><br>
                <strong>Ship Status:</strong><br>
                🛡️ Deflector Shields: <span class="font-mono text-cyan-400 font-bold">${currentShields}/${maxShields}</span> (LVL ${ship.shieldLevel || 0})<br>
                ⚔️ Weapons System: <span class="font-mono text-amber-400 font-bold">LVL ${weaponsLevel}</span><br>
                🚀 Engine System: <span class="font-mono text-emerald-400 font-bold">LVL ${engineLevel}</span>`;
            
            const options = [];
            
            // Choice 1: Attack
            options.push({
                text: weaponsLevel === 0 ? "🔥 Fire Weapons (Requires Weapons Module)" : `🔥 Fire Weapons (LVL ${weaponsLevel})`,
                disabled: weaponsLevel === 0,
                action: () => {
                    if (weaponsLevel === 1) {
                        const dmgResult = applyShipDamage(15);
                        let feedback = `You fire your light plasma cannons. The pirate ship is hit and retreats, but they returned fire, dealing 15 damage to your ship.`;
                        if (dmgResult.hullDmg > 0) {
                            feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                        }
                        gainXp(20);
                        state.character.credits += 50;
                        showDialog("Battle Report", `${feedback}<br><br>Gained +20 XP, +50 Credits.`, [{ text: "Proceed to Destination", action: onComplete }]);
                    } else if (weaponsLevel === 2) {
                        const dmgResult = applyShipDamage(5);
                        let feedback = `You open fire with dual laser turrets! The pirate shield collapses. They scrape your shields for 5 damage before fleeing.`;
                        if (dmgResult.hullDmg > 0) {
                            feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                        }
                        gainXp(25);
                        state.character.credits += 100;
                        state.inventory.push("Scrap Metal");
                        showDialog("Battle Report", `${feedback}<br><br>Gained +25 XP, +100 Credits, +1 Scrap Metal.`, [{ text: "Proceed to Destination", action: onComplete }]);
                    } else if (weaponsLevel >= 3) {
                        gainXp(35);
                        state.character.credits += 150;
                        state.inventory.push("Energy Cell");
                        showDialog(
                            "Battle Report",
                            `You lock on and launch an Anti-matter Torpedo! The pirate ship is instantly vaporized in a spectacular flash. No damage taken.<br><br>Gained +35 XP, +150 Credits, +1 Energy Cell.`,
                            [{ text: "Proceed to Destination", action: onComplete }]
                        );
                    }
                }
            });
            
            // Choice 2: Evasive maneuvers
            options.push({
                text: `✈️ Evasive Maneuvers (Engine LVL ${engineLevel})`,
                action: () => {
                    const successChance = 35 + engineLevel * 20; // 55%, 75%, 95%
                    const roll = Math.random() * 100;
                    if (roll < successChance) {
                        gainXp(15);
                        showDialog(
                            "Escape Successful",
                            `You pull off complex evasive maneuvers, cleanly outrunning the pirate's targeting computers and escaping into warp!<br><br>Gained +15 XP.`,
                            [{ text: "Proceed to Destination", action: onComplete }]
                        );
                    } else {
                        const dmgResult = applyShipDamage(30);
                        let feedback = `Your engine fails to fire in time! The pirate blasts your ship's hull for 30 damage as you desperately jump away.`;
                        if (dmgResult.hullDmg > 0) {
                            feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                        }
                        gainXp(5);
                        showDialog(
                            "Escape Failed",
                            `${feedback}<br><br>Gained +5 XP.`,
                            [{ text: "Proceed to Destination", action: onComplete }]
                        );
                    }
                }
            });
            
            // Choice 3: Recharge shields during battle
            const scrapCount = state.inventory.filter(i => i === 'Scrap Metal').length;
            options.push({
                text: `🔧 Recharge Shields (-2 Scrap Metal, +30 Shields)`,
                disabled: scrapCount < 2 || currentShields >= maxShields,
                action: () => {
                    // Spend scrap
                    for (let i = 0; i < 2; i++) {
                        const idx = state.inventory.indexOf('Scrap Metal');
                        if (idx > -1) state.inventory.splice(idx, 1);
                    }
                    
                    // Recharge shields
                    ship.shields = Math.min(maxShields, currentShields + 30);
                    addLog(` Spent 2 Scrap Metal to recharge Deflector Shields during combat.`);
                    
                    // Engage engines but take a light hit
                    const dmgResult = applyShipDamage(10);
                    let feedback = `You frantically dump scrap into the shields, recovering 30 Shield points, then punch the warp drive. You take 10 shield damage on the way out.`;
                    if (dmgResult.hullDmg > 0) {
                        feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                    }
                    
                    showDialog(
                        "Shields Restored & Escaped",
                        `${feedback}`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            // Choice 4: Pay bribe
            const credits = state.character.credits || 0;
            options.push({
                text: credits >= 100 ? `💳 Pay Bribe (-100 Credits)` : `💳 Pay Bribe (Requires 100 Credits)`,
                disabled: credits < 100,
                action: () => {
                    state.character.credits = Math.max(0, credits - 100);
                    showDialog(
                        "Bribe Accepted",
                        `The pirates accept your 100 Credits payment, mock you, and jump away.`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            showDialog(title, text, options);
        }
    },
    {
        id: 'solar_flare',
        name: 'Solar Radiation Storm',
        trigger: (location, onComplete) => {
            const ship = state.character.ship;
            const currentShields = ship.shields || 0;
            const maxShields = ship.maxShields || (ship.shieldLevel * 50);
            const shieldLevel = ship.shieldLevel || 0;
            const engineLevel = ship.engineLevel || 1;
            const characterEnergy = state.character.energy || 0;
            const hasEnergyCell = state.inventory.includes('Energy Cell');
            
            const title = "☀️ Environmental Alert: Solar Radiation Storm";
            const text = `Your ship is buffeted by intense radiation from a nearby star's solar flare! High-energy particles are overloading your systems.
                <br><br>
                <strong>Ship Status:</strong><br>
                🛡️ Deflector Shields: <span class="font-mono text-cyan-400 font-bold">${currentShields}/${maxShields}</span> (LVL ${shieldLevel})<br>
                🚀 Engine System: <span class="font-mono text-emerald-400 font-bold">LVL ${engineLevel}</span>`;
            
            const options = [];
            
            // Choice 1: Divert suit/character energy to deflectors
            options.push({
                text: shieldLevel === 0 ? "⚡ Divert Power (Requires Deflector Shields)" : `⚡ Divert Power (-10 character Energy)`,
                disabled: shieldLevel === 0 || characterEnergy < 10,
                action: () => {
                    state.character.energy = Math.max(0, characterEnergy - 10);
                    gainXp(15);
                    showDialog(
                        "Shields Stabilized",
                        `You divert 10 energy from your personal systems to supercharge the deflector shields. The solar storm passes harmlessly.<br><br>Gained +15 XP.`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            // Choice 2: Fly behind asteroid (requires engine level >= 2)
            options.push({
                text: engineLevel < 2 ? "☄️ Hide Behind Asteroid (Requires Engine LVL 2)" : "☄️ Hide Behind Asteroid",
                disabled: engineLevel < 2,
                action: () => {
                    gainXp(15);
                    showDialog(
                        "Safe Cover",
                        `Using your advanced engine level ${engineLevel}, you expertly pilot the ship behind a massive, metallic asteroid, shielding it completely from the radiation.<br><br>Gained +15 XP.`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            // Choice 3: Recharge shields with Energy Cell
            options.push({
                text: hasEnergyCell ? "🔋 Use Energy Cell to Max Shields" : "🔋 Use Energy Cell (Requires Energy Cell)",
                disabled: !hasEnergyCell,
                action: () => {
                    const idx = state.inventory.indexOf('Energy Cell');
                    if (idx > -1) state.inventory.splice(idx, 1);
                    
                    ship.shields = maxShields;
                    gainXp(10);
                    showDialog(
                        "Shield Capacitor Overload",
                        `You load an Energy Cell into the deflector grid, boosting shield integrity to maximum. The shields easily deflect the storm's fury.<br><br>Gained +10 XP.`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            // Choice 4: Brace
            options.push({
                text: "🛡️ Brace for Impact",
                action: () => {
                    const dmgResult = applyShipDamage(25);
                    let feedback = `The solar storm pummels your ship, dealing 25 shield damage.`;
                    
                    if (dmgResult.hullDmg > 0) {
                        feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                        // Rupture cargo bay and lose a random item
                        if (state.inventory.length > 0) {
                            const itemIdx = Math.floor(Math.random() * state.inventory.length);
                            const lostItem = state.inventory.splice(itemIdx, 1)[0];
                            feedback += `<br><br><span class="text-amber-500 font-bold">📦 Cargo Containment Rupture: You lost 1x ${lostItem}!</span>`;
                        }
                    }
                    
                    showDialog(
                        "Storm Buffeted",
                        `${feedback}`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            showDialog(title, text, options);
        }
    },
    {
        id: 'rogue_drone',
        name: 'Rogue Security Drone',
        trigger: (location, onComplete) => {
            const ship = state.character.ship;
            const currentShields = ship.shields || 0;
            const maxShields = ship.maxShields || (ship.shieldLevel * 50);
            const weaponsLevel = ship.weaponsLevel || 0;
            const engineLevel = ship.engineLevel || 1;
            const scannerLevel = ship.scannerLevel || 0;
            const isScientist = state.character.role === 'Scientist';
            
            const title = "🤖 Alert: Rogue Security Drone";
            const text = `An ancient, automated security drone detaches from a nearby derelict platform and activates its targeting lasers!
                <br><br>
                <strong>Ship Status:</strong><br>
                🛡️ Deflector Shields: <span class="font-mono text-cyan-400 font-bold">${currentShields}/${maxShields}</span> (LVL ${ship.shieldLevel || 0})<br>
                ⚔️ Weapons System: <span class="font-mono text-amber-400 font-bold">LVL ${weaponsLevel}</span><br>
                🚀 Engine System: <span class="font-mono text-emerald-400 font-bold">LVL ${engineLevel}</span>`;
                
            const options = [];
            
            // Choice 1: Shoot it
            options.push({
                text: weaponsLevel === 0 ? "🔫 Target Drone (Requires Weapons Module)" : `🔫 Target Drone (LVL ${weaponsLevel})`,
                disabled: weaponsLevel === 0,
                action: () => {
                    const dmgResult = applyShipDamage(10);
                    let feedback = `You fire your ship weapons, destroying the drone. It detonates close to your ship, dealing 10 damage to your deflector shields.`;
                    if (dmgResult.hullDmg > 0) {
                        feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                    }
                    gainXp(20);
                    state.inventory.push("Circuit Board");
                    showDialog(
                        "Drone Destroyed",
                        `${feedback}<br><br>Gained +20 XP, +1 Circuit Board.`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            // Choice 2: Hack it
            const canHack = scannerLevel >= 2 || isScientist;
            options.push({
                text: "💾 Hack Drone (Requires Scientist or Scanner LVL 2)",
                disabled: !canHack,
                action: () => {
                    gainXp(25);
                    state.inventory.push("Energy Cell");
                    showDialog(
                        "Hack Successful",
                        `You transmit an override signal using your ship's scanner arrays. The drone shuts down, and you harvest its active core.<br><br>Gained +25 XP, +1 Energy Cell.`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            // Choice 3: Evasive
            options.push({
                text: `✈️ Evasive maneuvers (Engine LVL ${engineLevel})`,
                action: () => {
                    const successChance = 30 + engineLevel * 20; // 50%, 70%, 90%
                    const roll = Math.random() * 100;
                    if (roll < successChance) {
                        gainXp(10);
                        showDialog(
                            "Outmaneuvered",
                            `You dodge the drone's lasers and accelerate away into warp speed.<br><br>Gained +10 XP.`,
                            [{ text: "Proceed to Destination", action: onComplete }]
                        );
                    } else {
                        const dmgResult = applyShipDamage(20);
                        let feedback = `The drone lands a laser blast on your thruster array! Your shields take 20 damage.`;
                        if (dmgResult.hullDmg > 0) {
                            feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                        }
                        gainXp(5);
                        showDialog(
                            "Escape Failed",
                            `${feedback}<br><br>Gained +5 XP.`,
                            [{ text: "Proceed to Destination", action: onComplete }]
                        );
                    }
                }
            });
            
            // Choice 4: Brace
            options.push({
                text: "🛡️ Brace for Laser Fire",
                action: () => {
                    const dmgResult = applyShipDamage(35);
                    let feedback = `The security drone pummels your deflector shields with continuous laser fire, dealing 35 shield damage.`;
                    if (dmgResult.hullDmg > 0) {
                        feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                    }
                    showDialog(
                        "Damage Report",
                        `${feedback}`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            showDialog(title, text, options);
        }
    },
    {
        id: 'photon_escort',
        name: 'Photon Prime Escort',
        trigger: (location, onComplete) => {
            const ship = state.character.ship;
            const currentShields = ship.shields || 0;
            const maxShields = ship.maxShields || (ship.shieldLevel * 50);
            const weaponsLevel = ship.weaponsLevel || 0;
            const shieldLevel = ship.shieldLevel || 0;
            
            const title = "📦 Distress Signal: Photon Prime Escort";
            const text = `You intercept a distress signal from a Photon Prime delivery freighter under attack by Void Corsair scavengers!
                <br><br>
                <strong>Ship Status:</strong><br>
                🛡️ Deflector Shields: <span class="font-mono text-cyan-400 font-bold">${currentShields}/${maxShields}</span> (LVL ${shieldLevel})<br>
                ⚔️ Weapons System: <span class="font-mono text-amber-400 font-bold">LVL ${weaponsLevel}</span>`;
                
            const options = [];
            
            // Choice 1: Attack Raiders
            options.push({
                text: weaponsLevel === 0 ? "⚔️ Intervene & Attack Raiders (Requires Weapons)" : `⚔️ Intervene & Attack Raiders (LVL ${weaponsLevel})`,
                disabled: weaponsLevel === 0,
                action: () => {
                    if (weaponsLevel === 1) {
                        const dmgResult = applyShipDamage(20);
                        let feedback = `You launch an attack on the raider ship. You successfully destroy it, but your ship takes 20 shield damage in the crossfire.`;
                        if (dmgResult.hullDmg > 0) {
                            feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                        }
                        gainXp(20);
                        state.character.credits += 100;
                        state.inventory.push("Energy Cell");
                        showDialog(
                            "Raiders Defeated",
                            `${feedback}<br><br>The freighter captain sends over a reward.<br><br>Gained +20 XP, +100 Credits, +1 Energy Cell.`,
                            [{ text: "Proceed to Destination", action: onComplete }]
                        );
                    } else {
                        gainXp(30);
                        state.character.credits += 200;
                        state.inventory.push("Plasma Core");
                        showDialog(
                            "Raiders Decimated",
                            `You easily blast the raider ships to pieces with your advanced weapon systems (LVL ${weaponsLevel}). No damage taken. The grateful freighter captain rewards you handsomely.<br><br>Gained +30 XP, +200 Credits, +1 Plasma Core.`,
                            [{ text: "Proceed to Destination", action: onComplete }]
                        );
                    }
                }
            });
            
            // Choice 2: Shield the Freighter
            options.push({
                text: shieldLevel < 2 ? "🛡️ Interpose Ship (Requires Deflector Shields LVL 2)" : "🛡️ Interpose Ship & Absorb Damage",
                disabled: shieldLevel < 2,
                action: () => {
                    const dmgResult = applyShipDamage(15);
                    let feedback = `You steer your ship between the raiders and the freighter, deflector shields flares bright under the enemy's fire, taking 15 shield damage. The freighter maneuvers away and escapes. The raiders retreat.`;
                    if (dmgResult.hullDmg > 0) {
                        feedback += `<br><br><span class="text-red-500 font-bold">⚠️ Hull damage sustained! Your character took ${dmgResult.hullDmg} HP damage.</span>`;
                    }
                    gainXp(20);
                    state.character.credits += 150;
                    state.inventory.push("Scrap Metal");
                    state.inventory.push("Scrap Metal");
                    showDialog(
                        "Freighter Saved",
                        `${feedback}<br><br>Gained +20 XP, +150 Credits, +2 Scrap Metal.`,
                        [{ text: "Proceed to Destination", action: onComplete }]
                    );
                }
            });
            
            // Choice 3: Ignore
            options.push({
                text: "🚶 Ignore Distress Signal",
                action: () => {
                    if (state.character.factions && state.character.factions.syndicate !== undefined) {
                        state.character.factions.syndicate = Math.max(-100, state.character.factions.syndicate - 5);
                        addLog(`📉 Your Photon Prime Syndicate reputation decreased by 5 for ignoring their distress signal.`);
                    }
                    onComplete();
                }
            });
            
            showDialog(title, text, options);
        }
    }
];

/**
 * Trigger a random space combat or ship defense event during travel
 */
export function triggerSpaceCombatEvent(location, onComplete) {
    if (!state.character || !state.character.ship) {
        onComplete();
        return;
    }
    
    // Choose a random event from our list
    const randomIndex = Math.floor(Math.random() * spaceEvents.length);
    const event = spaceEvents[randomIndex];
    
    event.trigger(location, onComplete);
}
