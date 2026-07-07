import { rollRarity } from './rarity.js';
import { items } from '../data/items.js';
import { checkAchievement } from './achievements.js';
import { initDungeonRenderer } from './ui/dungeon-renderer.js';

let state;
let deps;
let addLog, updateUI, showScreen, gainXp, checkQuestProgress;

export function initDerelict(dependencies) {
    deps = dependencies;
    state = deps.state;

    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
    showScreen = deps.ui.showScreen;
    gainXp = deps.character.gainXp;
    checkQuestProgress = deps.quests.checkQuestProgress;
    
    initDungeonRenderer(state);
}

/**
 * Generate a procedural 8x8 maze for the derelict ship
 */
export function generateDerelictMaze() {
    const SIZE = 8;
    const grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(1)); // All walls initially
    
    // DFS stack starting at (1, 1)
    const stack = [[1, 1]];
    grid[1][1] = 0; // Empty corridor
    
    while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];
        
        // Find adjacent cells 2 steps away
        const dirs = [
            [2, 0], [-2, 0], [0, 2], [0, -2]
        ];
        
        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx > 0 && nx < SIZE - 1 && ny > 0 && ny < SIZE - 1) {
                if (grid[ny][nx] === 1) {
                    neighbors.push([nx, ny]);
                }
            }
        }
        
        if (neighbors.length > 0) {
            // Pick a random neighbor
            const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
            // Carve intermediate corridor
            const ix = cx + (nx - cx) / 2;
            const iy = cy + (ny - cy) / 2;
            grid[iy][ix] = 0;
            grid[ny][nx] = 0;
            
            stack.push([nx, ny]);
        } else {
            stack.pop();
        }
    }
    
    // Airlock position
    grid[1][1] = 5; // Start/Airlock node
    
    // Find all empty cells to place items and boss
    const emptyCells = [];
    for (let y = 1; y < SIZE - 1; y++) {
        for (let x = 1; x < SIZE - 1; x++) {
            if (grid[y][x] === 0) {
                emptyCells.push({ x, y });
            }
        }
    }
    
    // Set boss at the furthest reachable corridor from (1, 1)
    let bossCell = null;
    let maxDist = -1;
    emptyCells.forEach(cell => {
        const dist = Math.abs(cell.x - 1) + Math.abs(cell.y - 1);
        if (dist > maxDist) {
            maxDist = dist;
            bossCell = cell;
        }
    });
    
    if (bossCell) {
        grid[bossCell.y][bossCell.x] = 4; // Boss Sentinel Alpha
        const idx = emptyCells.findIndex(c => c.x === bossCell.x && c.y === bossCell.y);
        if (idx > -1) emptyCells.splice(idx, 1);
    }
    
    // Distribute loot chest and hazards
    const numLoot = Math.min(3, emptyCells.length);
    for (let i = 0; i < numLoot; i++) {
        const idx = Math.floor(Math.random() * emptyCells.length);
        const cell = emptyCells.splice(idx, 1)[0];
        grid[cell.y][cell.x] = 3; // Loot
    }
    
    const numHazards = Math.min(2, emptyCells.length);
    for (let i = 0; i < numHazards; i++) {
        const idx = Math.floor(Math.random() * emptyCells.length);
        const cell = emptyCells.splice(idx, 1)[0];
        grid[cell.y][cell.x] = 2; // Hazard
    }
    
    return grid;
}

/**
 * Start a new derelict run
 */
export function startDerelictRun(destination) {
    if (!state) {
        console.error("Derelict system not initialized: state is undefined");
        return;
    }
    const maxOxygen = 10 + Math.floor(Math.random() * 6); // 10-15 Oxygen
    
    const grid = generateDerelictMaze();
    const visited = Array(8).fill(null).map(() => Array(8).fill(false));
    visited[1][1] = true;
    
    state.derelict = {
        active: true,
        oxygen: maxOxygen,
        maxOxygen: maxOxygen,
        roomsExplored: 1, // Start room counts as explored
        currentLoot: [],
        destination: destination,
        bossDefeated: false,
        map: grid,
        visited: visited,
        x: 1,
        y: 1,
        dirX: 0,
        dirY: 1 // Start facing South
    };

    state.previousGameState = state.gameState;
    state.gameState = "derelict";
    
    addLog("🚨 DISTRESS SIGNAL INTERCEPTED 🚨");
    addLog(`You docked with a derelict vessel. Life support is offline. You have ${maxOxygen} units of oxygen.`);
    
    // Switch to derelict UI
    if (deps.ui.showDerelictScreen) {
        deps.ui.showDerelictScreen();
    }
}

/**
 * Rotate player camera left (CCW)
 */
export function turnLeft() {
    if (!state.derelict || !state.derelict.active) return;
    const dirX = state.derelict.dirX;
    const dirY = state.derelict.dirY;
    state.derelict.dirX = dirY === 0 ? 0 : dirY;
    state.derelict.dirY = -dirX === 0 ? 0 : -dirX;
    addLog("🔄 Turned left.");
    updateUI();
}

/**
 * Rotate player camera right (CW)
 */
export function turnRight() {
    if (!state.derelict || !state.derelict.active) return;
    const dirX = state.derelict.dirX;
    const dirY = state.derelict.dirY;
    state.derelict.dirX = -dirY === 0 ? 0 : -dirY;
    state.derelict.dirY = dirX === 0 ? 0 : dirX;
    addLog("🔄 Turned right.");
    updateUI();
}

/**
 * Perform a U-turn (Turn around)
 */
export function uTurn() {
    if (!state.derelict || !state.derelict.active) return;
    state.derelict.dirX = -state.derelict.dirX === 0 ? 0 : -state.derelict.dirX;
    state.derelict.dirY = -state.derelict.dirY === 0 ? 0 : -state.derelict.dirY;
    addLog("🔄 Turned around.");
    updateUI();
}

/**
 * Explore deeper into the derelict (Move Forward)
 */
export function exploreRoom() {
    if (!state.derelict || !state.derelict.active) return;

    if (state.derelict.bossDefeated && state.derelict.map[state.derelict.y][state.derelict.x] !== 5) {
        // Boss defeated and player is not at Airlock
        addLog("⚠️ The derelict vessel's structural integrity is failing. You must return to the Airlock and escape immediately!");
        return;
    }

    if (state.derelict.oxygen <= 0) {
        failRun();
        return;
    }

    const nextX = state.derelict.x + state.derelict.dirX;
    const nextY = state.derelict.y + state.derelict.dirY;
    
    // Bounds check
    const SIZE = 8;
    if (nextX < 0 || nextX >= SIZE || nextY < 0 || nextY >= SIZE) {
        addLog("🛑 Cannot move forward: Out of bounds.");
        return;
    }

    // Wall check
    const cellValue = state.derelict.map[nextY][nextX];
    if (cellValue === 1) {
        addLog("🛑 Solid bulkhead ahead. Choose another direction.");
        return;
    }

    // Deduct oxygen
    state.derelict.oxygen -= 1;
    
    // Move player
    state.derelict.x = nextX;
    state.derelict.y = nextY;
    
    // Mark visited
    if (!state.derelict.visited[nextY][nextX]) {
        state.derelict.visited[nextY][nextX] = true;
        state.derelict.roomsExplored += 1;
    }

    addLog(`Venturing deeper... (Oxygen: ${state.derelict.oxygen}/${state.derelict.maxOxygen})`);

    // Check failure immediately if oxygen runs out during the step
    if (state.derelict.oxygen <= 0) {
        addLog("⚠️ Oxygen depleted! You are suffocating!");
        failRun();
        return;
    }

    // Process cell value triggers
    if (cellValue === 2) {
        // Hazard
        triggerHazard();
        state.derelict.map[nextY][nextX] = 0; // Clear hazard
    } else if (cellValue === 3) {
        // Loot
        findLoot();
        state.derelict.map[nextY][nextX] = 0; // Clear loot
    } else if (cellValue === 4) {
        // Boss Encounter
        triggerBossCombat();
    } else if (cellValue === 5) {
        addLog("🚪 Airlock reached. Ready for escape.");
    } else {
        // 0 = Empty Corridor: small chance of random ambush (15%)
        if (Math.random() < 0.15) {
            triggerCombat();
        } else {
            addLog("The corridor is silent.");
        }
    }

    updateUI();
}

function triggerCombat() {
    // Save current location momentarily to force derelict enemies
    const originalLocation = state.currentLocation;
    state.currentLocation = "derelict";
    
    // We encounter enemy using standard combat system
    if (deps.combat && deps.combat.encounterEnemy) {
        addLog("⚠️ Hostiles detected!");
        deps.combat.encounterEnemy();
    }
    
    // Restore location
    state.currentLocation = originalLocation;
}

function triggerBossCombat() {
    const originalLocation = state.currentLocation;
    state.currentLocation = "derelict";
    
    if (deps.combat && deps.combat.encounterBoss) {
        addLog("🚨 WARNING: ANOMALY SOURCE DETECTED! You have entered the central chamber!");
        deps.combat.encounterBoss();
    }
    
    state.currentLocation = originalLocation;
}

function findLoot() {
    // Loyalty Quest Items injection
    if (state.character && state.character.activeQuests) {
        if (state.character.activeQuests.loyalty_vance && 
            state.character.activeQuests.loyalty_vance.progress === 0 && 
            !state.derelict.currentLoot.includes("Cybernetic Core") && 
            !state.inventory.includes("Cybernetic Core")) {
            
            const item = "Cybernetic Core";
            state.derelict.currentLoot.push(item);
            addLog(`📦 You secured the quest item: ${item}!`);
            return;
        }
        
        if (state.character.activeQuests.loyalty_lyra && 
            state.character.activeQuests.loyalty_lyra.progress === 0 && 
            !state.derelict.currentLoot.includes("Encryption Key") && 
            !state.inventory.includes("Encryption Key")) {
            
            const item = "Encryption Key";
            state.derelict.currentLoot.push(item);
            addLog(`📦 You secured the quest item: ${item}!`);
            return;
        }
    }

    // Add a chance to find random equipment (scaled with rooms explored)
    const equipmentChance = 0.05 + (state.derelict.roomsExplored * 0.03);
    if (Math.random() < equipmentChance) {
        const equipmentPool = Object.keys(items).filter(k => ["weapon", "armor", "accessory"].includes(items[k].type));
        if (equipmentPool.length > 0) {
            const randomEquip = equipmentPool[Math.floor(Math.random() * equipmentPool.length)];
            const bonusChance = 0.05 + (state.derelict.roomsExplored * 0.05);
            const rolledEquip = rollRarity(randomEquip, bonusChance);
            state.derelict.currentLoot.push(rolledEquip);
            addLog(`📦 You secured an anomalies-infused equipment: ${rolledEquip}!`);
            return;
        }
    }

    // Base items
    const baseLoot = ["Scrap Metal", "Energy Cell", "Data Chip", "Rusty Pipe"];
    // High tier items (Higher chance with depth)
    const highTierLoot = ["Titanium Ingot", "Plasma Core", "Circuit Board", "Nanites", "Quantum Chip"];
    
    let isHighTier = Math.random() < (0.1 + (state.derelict.roomsExplored * 0.05));
    const lootPool = isHighTier ? highTierLoot : baseLoot;
    const item = lootPool[Math.floor(Math.random() * lootPool.length)];
    
    state.derelict.currentLoot.push(item);
    addLog(`📦 You secured a ${item}!`);
}

function triggerHazard() {
    const damage = 5 + Math.floor(Math.random() * 10) + state.derelict.roomsExplored;
    state.character.hp -= damage;
    addLog(`💥 A plasma conduit ruptured! You took ${damage} damage.`);
    
    if (state.character.hp <= 0) {
        addLog("You succumbed to your injuries inside the derelict...");
        state.gameState = "defeat";
        showScreen("defeat");
    }
}

/**
 * Escape with the loot
 */
export function escapeShip() {
    if (!state.derelict || !state.derelict.active) return;

    const lootCount = state.derelict.currentLoot.length;
    
    // Transfer loot
    state.derelict.currentLoot.forEach(item => {
        state.inventory.push(item);
    });

    addLog(`🚀 You escaped the derelict and returned to your ship with ${lootCount} items!`);
    
    // Stats tracking and Achievement check
    state.stats = state.stats || {};
    state.stats.derelictsCompleted = (state.stats.derelictsCompleted || 0) + 1;
    checkAchievement("derelict", { completed: true });

    finishRun();
}

/**
 * Fail run due to lack of oxygen
 */
export function failRun() {
    if (!state.derelict || !state.derelict.active) return;

    // HP Damage penalty
    const damage = Math.floor(state.character.maxHp * 0.25); // 25% max HP damage
    state.character.hp = Math.max(1, state.character.hp - damage); // Leave at 1 HP min
    
    addLog(`☠️ You passed out from lack of oxygen! The ship's emergency recall pulled you out, but you lost all secured loot and took ${damage} damage!`);

    finishRun();
}

function finishRun() {
    const destination = state.derelict.destination;
    
    state.derelict.active = false;
    state.derelict.currentLoot = [];
    
    // Complete the original travel
    state.currentLocation = destination.id;
    addLog(`🚀 Resuming travel to ${destination.name}...`);
    addLog(`ARRIVAL: ${destination.description}`);
    
    // Trigger medbay healing from ship.js
    if (deps.ship && deps.ship.getMedbayHealAmount) {
        const heal = deps.ship.getMedbayHealAmount();
        if (heal > 0 && state.character.hp < state.character.maxHp) {
            const oldHp = state.character.hp;
            state.character.hp = Math.min(state.character.maxHp, state.character.hp + heal);
            addLog(`🩺 Medbay healed you for ${state.character.hp - oldHp} HP during travel.`);
        }
    }

    state.gameState = "exploring";
    showScreen("exploring");
    updateUI();
}
