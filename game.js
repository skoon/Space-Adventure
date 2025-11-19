// Game state
let gameState = "start";
let character = null;
let inventory = [];
let enemy = null;
let log = [];
let playerStatusEffects = [];
let enemyStatusEffects = [];
let levelUpNotification = null;
let victoryMessage = null;

// Enemies data
const enemies = [
  { name: "Xenobot", hp: 50, attack: 10, defense: 3 },
  { name: "Plasmavore", hp: 40, attack: 12, defense: 2 },
  { name: "Nano Swarm", hp: 30, attack: 8, defense: 1 }
];

// Elements
const screens = {
  start: document.getElementById("startScreen"),
  creation: document.getElementById("characterCreationScreen"),
  exploring: document.getElementById("exploringScreen"),
  combat: document.getElementById("combatScreen"),
  defeat: document.getElementById("defeatScreen")
};

// DOM elements for stats
const playerStatsElements = {
  hp: document.getElementById("playerHp"),
  maxHp: document.getElementById("playerMaxHp"),
  xp: document.getElementById("playerXp"),
  level: document.getElementById("playerLevel"),
  hpBar: document.getElementById("hpBar"),
  xpBar: document.getElementById("xpBar"),
  xpToNext: document.getElementById("xpToNext"),
  energy: document.getElementById("playerEnergy"),
  maxEnergy: document.getElementById("playerMaxEnergy"),
  energyBar: document.getElementById("energyBar"),
  avatar: document.getElementById("playerAvatar"),
  characterName: document.getElementById("characterName"),
  characterRaceRole: document.getElementById("characterRaceRole")
};

const inventoryElement = document.getElementById("inventory");
const missionLogElement = document.getElementById("missionLog");

// Combat DOM elements
const combatElements = {
  playerName: document.getElementById("combatPlayerName"),
  playerHp: document.getElementById("combatPlayerHp"),
  playerMaxHp: document.getElementById("combatPlayerMaxHp"),
  playerAtk: document.getElementById("combatPlayerAtk"),
  playerDef: document.getElementById("combatPlayerDef"),
  playerHpBar: document.getElementById("combatHpBar"),
  playerEnergy: document.getElementById("combatPlayerEnergy"),
  playerMaxEnergy: document.getElementById("combatPlayerMaxEnergy"),
  playerEnergyBar: document.getElementById("combatEnergyBar"),
  playerStatusEffects: document.getElementById("playerStatusEffects"),
  playerAvatar: document.getElementById("combatPlayerAvatar"),
  enemyName: document.getElementById("enemyName"),
  enemyHp: document.getElementById("enemyHp"),
  enemyMaxHp: document.getElementById("enemyMaxHp"),
  enemyAtk: document.getElementById("enemyAtk"),
  enemyDef: document.getElementById("enemyDef"),
  enemyHpBar: document.getElementById("enemyHpBar"),
  combatLog: document.getElementById("combatLog")
};

// Heal button
const healButton = document.getElementById("healButton");

// Year in footer
document.getElementById("currentYear").textContent = new Date().getFullYear();

// Get character avatar emoji
function getCharacterAvatar(race, role) {
  const avatars = {
    Human: { Warrior: "🛡️", Rogue: "🗡️", Scientist: "🔬" },
    Cyborg: { Warrior: "⚔️", Rogue: "🔪", Scientist: "🔧" },
    Android: { Warrior: "🤖", Rogue: "⚡", Scientist: "💾" }
  };
  return avatars[race]?.[role] || "👤";
}

// Get status effect icon
function getStatusEffectIcon(type) {
  const icons = {
    blocking: "🛡️",
    dodging: "💨",
    defenseBoost: "🔬",
    attackBoost: "⚔️",
    poison: "☠️",
    burn: "🔥",
    shield: "✨"
  };
  return icons[type] || "⚡";
}

// Show screen based on game state
function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.remove("active-screen"));
  if (screens[screenName]) {
    screens[screenName].classList.add("active-screen");
  }
}

// Start the game
function startGame() {
  gameState = "characterCreation";
  log = [];
  showScreen("creation");
}

// Create character
function createCharacter(event) {
  event.preventDefault();
  
  const name = document.getElementById("nameInput").value.trim();
  const race = document.getElementById("raceSelect").value;
  const role = document.getElementById("roleSelect").value;

  if (!name || !race || !role) return;

  character = {
    name,
    race,
    role,
    hp: 100,
    maxHp: 100,
    attack: role === "Warrior" ? 15 : role === "Rogue" ? 12 : 10,
    defense: role === "Warrior" ? 8 : role === "Rogue" ? 5 : 6,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    energy: 100,
    maxEnergy: 100
  };
  
  inventory = ["Energy Cell", "Scanner"];
  playerStatusEffects = [];
  enemyStatusEffects = [];
  gameState = "exploring";
  showScreen("exploring");
  updateUI();
  
  // Simulate exploration events
  simulateExploration();
}

// Process status effects at start of turn
function processStatusEffects() {
  playerStatusEffects = playerStatusEffects.map(effect => ({
    ...effect,
    duration: effect.duration - 1
  })).filter(effect => effect.duration > 0);
  
  enemyStatusEffects = enemyStatusEffects.map(effect => ({
    ...effect,
    duration: effect.duration - 1
  })).filter(effect => effect.duration > 0);
}

// Add log entry with timestamp
function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  log.push(`[${timestamp}] ${message}`);
  
  // Keep only the last 50 entries
  if (log.length > 50) {
    log.shift();
  }
  
  // Update both logs
  updateMissionLog();
  updateCombatLog();
}

// Update mission log display
function updateMissionLog() {
  if (!missionLogElement) return;
  missionLogElement.innerHTML = "";
  if (log.length === 0) {
    const div = document.createElement("div");
    div.className = "log-entry text-gray-500 italic";
    div.textContent = "No entries yet...";
    missionLogElement.appendChild(div);
  } else {
    log.forEach(entry => {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.textContent = entry;
      missionLogElement.appendChild(div);
    });
  }
}

// Update combat log display
function updateCombatLog() {
  if (!combatElements.combatLog) return;
  combatElements.combatLog.innerHTML = "";
  log.slice(-8).forEach(entry => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entry;
    combatElements.combatLog.appendChild(div);
  });
}

// Update UI with current character stats
function updateUI() {
  if (character) {
    // Player stats
    if (playerStatsElements.hp) playerStatsElements.hp.textContent = character.hp;
    if (playerStatsElements.maxHp) playerStatsElements.maxHp.textContent = character.maxHp;
    if (playerStatsElements.xp) playerStatsElements.xp.textContent = character.xp;
    if (playerStatsElements.level) playerStatsElements.level.textContent = character.level;
    if (playerStatsElements.xpToNext) playerStatsElements.xpToNext.textContent = character.xpToNextLevel || character.level * 100;
    if (playerStatsElements.energy) playerStatsElements.energy.textContent = character.energy || character.maxEnergy || 100;
    if (playerStatsElements.maxEnergy) playerStatsElements.maxEnergy.textContent = character.maxEnergy || 100;
    
    // HP bar percentage
    if (playerStatsElements.hpBar) {
      const hpPercentage = (character.hp / character.maxHp) * 100;
      playerStatsElements.hpBar.style.width = `${hpPercentage}%`;
    }
    
    // XP bar percentage
    if (playerStatsElements.xpBar) {
      const xpNeeded = character.xpToNextLevel || (character.level * 100);
      const xpPercentage = Math.min(100, (character.xp / xpNeeded) * 100);
      playerStatsElements.xpBar.style.width = `${xpPercentage}%`;
    }
    
    // Energy bar percentage
    if (playerStatsElements.energyBar) {
      const maxEnergy = character.maxEnergy || 100;
      const currentEnergy = character.energy || maxEnergy;
      const energyPercentage = (currentEnergy / maxEnergy) * 100;
      playerStatsElements.energyBar.style.width = `${energyPercentage}%`;
    }
    
    // Character avatar and info
    if (playerStatsElements.avatar) {
      playerStatsElements.avatar.textContent = getCharacterAvatar(character.race, character.role);
    }
    if (playerStatsElements.characterName) {
      playerStatsElements.characterName.textContent = character.name;
    }
    if (playerStatsElements.characterRaceRole) {
      playerStatsElements.characterRaceRole.textContent = `${character.race} ${character.role}`;
    }

    // Inventory (sorted)
    if (inventoryElement) {
      inventoryElement.innerHTML = "";
      const sortedInv = [...inventory].sort();
      sortedInv.forEach(item => {
        const span = document.createElement("span");
        span.className = "inventory-item";
        span.textContent = item;
        inventoryElement.appendChild(span);
      });
    }
  }

  // Heal button state
  if (healButton) {
    const hasHeal = inventory.includes("Energy Cell") && character?.hp < character?.maxHp;
    healButton.disabled = !hasHeal;
    healButton.className = `heal-button ${hasHeal ? "" : "disabled-button"}`;
  }
  
  // Update logs
  updateMissionLog();
}

// Simulate exploration events
function simulateExploration() {
  if (gameState !== "exploring") return;

  setTimeout(() => {
    const eventChance = Math.random();
    
    if (eventChance < 0.4) {
      encounterEnemy();
    } else if (eventChance < 0.7) {
      addLog("You found some scrap metal.");
      inventory.push("Scrap Metal");
    } else {
      addLog("The landscape is quiet... for now.");
    }
    
    updateUI();
  }, 2000);
}

// Encounter an enemy
function encounterEnemy() {
  const randomEnemy = { ...enemies[Math.floor(Math.random() * enemies.length)] };
  randomEnemy.hp = Math.floor(randomEnemy.hp * (0.8 + Math.random() * 0.4));
  randomEnemy.maxHp = randomEnemy.hp;
  
  enemy = randomEnemy;
  playerStatusEffects = [];
  enemyStatusEffects = [];
  gameState = "combat";
  showScreen("combat");
  updateCombatUI();
  addLog(`You encountered a ${enemy.name}!`);
}

// Update combat UI
function updateCombatUI() {
  if (!character || !enemy) return;

  const activeDefenseBoost = playerStatusEffects.find(e => e.type === "defenseBoost");
  const effectiveDefense = character.defense + (activeDefenseBoost?.value || 0);
  const currentEnergy = character.energy ?? character.maxEnergy ?? 100;
  const maxEnergy = character.maxEnergy || 100;

  // Player stats
  if (combatElements.playerName) combatElements.playerName.textContent = character.name;
  if (combatElements.playerHp) combatElements.playerHp.textContent = character.hp;
  if (combatElements.playerMaxHp) combatElements.playerMaxHp.textContent = character.maxHp;
  if (combatElements.playerAtk) combatElements.playerAtk.textContent = character.attack;
  if (combatElements.playerDef) combatElements.playerDef.textContent = effectiveDefense;
  if (combatElements.playerEnergy) combatElements.playerEnergy.textContent = currentEnergy;
  if (combatElements.playerMaxEnergy) combatElements.playerMaxEnergy.textContent = maxEnergy;
  if (combatElements.playerAvatar) combatElements.playerAvatar.textContent = getCharacterAvatar(character.race, character.role);
  
  const combatHpPercentage = (character.hp / character.maxHp) * 100;
  if (combatElements.playerHpBar) combatElements.playerHpBar.style.width = `${combatHpPercentage}%`;
  
  const energyPercentage = (currentEnergy / maxEnergy) * 100;
  if (combatElements.playerEnergyBar) combatElements.playerEnergyBar.style.width = `${energyPercentage}%`;
  
  // Status effects
  if (combatElements.playerStatusEffects) {
    combatElements.playerStatusEffects.innerHTML = "";
    playerStatusEffects.forEach((effect, i) => {
      const span = document.createElement("span");
      span.className = "status-effect-icon";
      span.textContent = getStatusEffectIcon(effect.type);
      span.title = effect.type;
      combatElements.playerStatusEffects.appendChild(span);
    });
  }

  // Enemy stats
  if (combatElements.enemyName) combatElements.enemyName.textContent = enemy.name;
  if (combatElements.enemyHp) combatElements.enemyHp.textContent = enemy.hp;
  if (combatElements.enemyMaxHp) combatElements.enemyMaxHp.textContent = enemy.maxHp || enemy.hp;
  if (combatElements.enemyAtk) combatElements.enemyAtk.textContent = enemy.attack;
  if (combatElements.enemyDef) combatElements.enemyDef.textContent = enemy.defense;
  
  const enemyHpPercentage = ((enemy.maxHp || enemy.hp) > 0 ? enemy.hp / (enemy.maxHp || enemy.hp) : 0) * 100;
  if (combatElements.enemyHpBar) combatElements.enemyHpBar.style.width = `${enemyHpPercentage}%`;
  
  // Update special ability button
  const specialButton = document.getElementById("specialAbilityButton");
  if (specialButton) {
    specialButton.disabled = currentEnergy < 30;
    specialButton.className = `special-button ${currentEnergy >= 30 ? "" : "disabled-button"}`;
    // Update button text based on role
    if (character.role === "Warrior") {
      specialButton.textContent = "⭐ Power Strike";
    } else if (character.role === "Rogue") {
      specialButton.textContent = "⭐ Assassinate";
    } else if (character.role === "Scientist") {
      specialButton.textContent = "⭐ Shield Boost";
    }
  }
}

// Player attacks
function playerAttack() {
  if (!character || !enemy) return;
  processStatusEffects();

  // Critical hit chance (15% base, higher for Rogues)
  const critChance = character.role === "Rogue" ? 0.25 : 0.15;
  const isCritical = Math.random() < critChance;
  const critMultiplier = isCritical ? 2 : 1;
  
  // Check for attack buffs
  const attackBuff = playerStatusEffects.find(e => e.type === "attackBoost")?.value || 0;
  const baseDamage = Math.max(0, (character.attack + attackBuff) - enemy.defense);
  const damage = Math.floor(baseDamage * critMultiplier);
  enemy.hp -= damage;
  
  if (isCritical) {
    addLog(`💥 CRITICAL HIT! You hit the ${enemy.name} for ${damage} damage!`);
  } else {
    addLog(`You hit the ${enemy.name} for ${damage} damage.`);
  }
  updateCombatLog();

  if (enemy.hp <= 0) {
    winCombat();
  } else {
    enemyTurn();
  }
  
  updateCombatUI();
}

// Block action - reduces incoming damage by 50%
function playerBlock() {
  if (!character || !enemy) return;
  processStatusEffects();
  
  playerStatusEffects = [
    ...playerStatusEffects.filter(e => e.type !== "blocking"),
    { type: "blocking", duration: 1 }
  ];
  
  addLog("🛡️ You raise your guard, ready to block the next attack!");
  updateCombatLog();
  updateCombatUI();
  enemyTurn();
}

// Dodge action - 30% chance to avoid attack
function playerDodge() {
  if (!character || !enemy) return;
  processStatusEffects();
  
  playerStatusEffects = [
    ...playerStatusEffects.filter(e => e.type !== "dodging"),
    { type: "dodging", duration: 1 }
  ];
  
  addLog("💨 You prepare to dodge the next attack!");
  updateCombatLog();
  updateCombatUI();
  enemyTurn();
}

// Special abilities per role
function useSpecialAbility() {
  if (!character || !enemy) return;
  
  const energyCost = 30;
  const currentEnergy = character.energy ?? character.maxEnergy ?? 100;
  if (currentEnergy < energyCost) {
    addLog("⚠️ Not enough energy to use special ability!");
    updateCombatLog();
    return;
  }
  
  processStatusEffects();
  
  character.energy = Math.max(0, currentEnergy - energyCost);
  
  if (character.role === "Warrior") {
    // Power Strike - 1.5x damage
    const baseDamage = Math.max(0, character.attack - enemy.defense);
    const damage = Math.floor(baseDamage * 1.5);
    enemy.hp -= damage;
    
    addLog(`⚔️ POWER STRIKE! You unleash a devastating blow for ${damage} damage!`);
    updateCombatLog();
    
    if (enemy.hp <= 0) {
      winCombat();
    } else {
      enemyTurn();
    }
  } else if (character.role === "Rogue") {
    // Guaranteed Critical Hit - 2.5x damage
    const baseDamage = Math.max(0, character.attack - enemy.defense);
    const damage = Math.floor(baseDamage * 2.5);
    enemy.hp -= damage;
    
    addLog(`🗡️ ASSASSINATE! You strike a critical weak point for ${damage} damage!`);
    updateCombatLog();
    
    if (enemy.hp <= 0) {
      winCombat();
    } else {
      enemyTurn();
    }
  } else if (character.role === "Scientist") {
    // Shield Boost - temporary defense increase
    playerStatusEffects = [
      ...playerStatusEffects.filter(e => e.type !== "defenseBoost"),
      { type: "defenseBoost", value: 5, duration: 3 }
    ];
    addLog("🔬 You activate a defensive shield! Defense increased for 3 turns.");
    updateCombatLog();
    enemyTurn();
  }
  
  updateCombatUI();
}

// Enemy attacks
function enemyTurn() {
  if (!character || !enemy) return;

  // Check if player is dodging
  const isDodging = playerStatusEffects.some(e => e.type === "dodging");
  if (isDodging) {
    const dodgeSuccess = Math.random() < 0.3; // 30% chance
    if (dodgeSuccess) {
      addLog(`💨 You successfully dodged ${enemy.name}'s attack!`);
      updateCombatLog();
      // Regenerate energy
      character.energy = Math.min(character.maxEnergy, (character.energy || character.maxEnergy) + 5);
      updateCombatUI();
      return;
    } else {
      addLog(`💨 You tried to dodge but ${enemy.name} still hit you!`);
      updateCombatLog();
    }
  }

  // Check if player is blocking
  const isBlocking = playerStatusEffects.some(e => e.type === "blocking");
  let damage = Math.max(0, enemy.attack - character.defense);
  
  // Apply defense boost if active
  const defenseBoost = playerStatusEffects.find(e => e.type === "defenseBoost")?.value || 0;
  damage = Math.max(0, enemy.attack - (character.defense + defenseBoost));
  
  if (isBlocking) {
    damage = Math.floor(damage * 0.5); // 50% damage reduction
    addLog(`🛡️ You blocked ${enemy.name}'s attack, reducing damage!`);
    updateCombatLog();
  }
  
  character.hp -= damage;

  addLog(`${enemy.name} hits you for ${damage} damage.`);
  updateCombatLog();

  // Regenerate energy (5 per turn)
  character.energy = Math.min(character.maxEnergy, (character.energy || character.maxEnergy) + 5);

  if (character.hp <= 0) {
    addLog("You have been defeated...");
    gameState = "defeat";
    showScreen("defeat");
  }
  
  updateCombatUI();
  updateUI();
}

// Win combat
function winCombat() {
  const xpGained = Math.floor(enemy.attack * 2 + enemy.defense * 3);
  const loot = ["Energy Cell", "Alien Crystal", "Data Chip"][Math.floor(Math.random() * 3)];

  // Restore energy on victory
  character.energy = character.maxEnergy;

  const newXp = character.xp + xpGained;
  const oldLevel = character.level;
  const xpNeeded = character.xpToNextLevel || (character.level * 100);
  
  // Check for level up
  if (newXp >= xpNeeded) {
    const newLevel = oldLevel + 1;
    const newXpToNextLevel = newLevel * 100;
    
    // Stat increases on level up
    const hpIncrease = 20;
    const attackIncrease = character.role === "Warrior" ? 3 : character.role === "Rogue" ? 2 : 1;
    const defenseIncrease = character.role === "Warrior" ? 2 : character.role === "Rogue" ? 1 : 1;
    
    // Show level up notification
    showLevelUpNotification(newLevel, {
      maxHp: hpIncrease,
      attack: attackIncrease,
      defense: defenseIncrease
    });
    
    character.hp = Math.min(character.maxHp + hpIncrease, character.hp + 20 + hpIncrease);
    character.maxHp += hpIncrease;
    character.attack += attackIncrease;
    character.defense += defenseIncrease;
    character.xp = newXp - xpNeeded; // Carry over excess XP
    character.level = newLevel;
    character.xpToNextLevel = newXpToNextLevel;
    character.maxEnergy += 10; // Increase max energy on level up
    character.energy = character.maxEnergy; // Restore to new max
  } else {
    character.hp = Math.min(character.maxHp, character.hp + 20);
    character.xp = newXp;
  }

  // Add loot
  inventory.push(loot);
  
  addLog(`You defeated the ${enemy.name}!`);
  addLog(`You gained ${xpGained} XP and found a ${loot}.`);
  
  // Show victory message
  showVictoryMessage(`Victory! ${enemy.name} defeated!`);

  enemy = null;
  gameState = "exploring";
  showScreen("exploring");
  updateUI();
  simulateExploration();
}

// Show level up notification
function showLevelUpNotification(level, statIncreases) {
  levelUpNotification = { level, statIncreases };
  const notification = document.getElementById("levelUpNotification");
  if (notification) {
    notification.style.display = "flex";
    document.getElementById("levelUpLevel").textContent = level;
    document.getElementById("levelUpHp").textContent = `+${statIncreases.maxHp} Max HP`;
    document.getElementById("levelUpAttack").textContent = `+${statIncreases.attack} Attack`;
    document.getElementById("levelUpDefense").textContent = `+${statIncreases.defense} Defense`;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      hideLevelUpNotification();
    }, 5000);
  }
}

function hideLevelUpNotification() {
  const notification = document.getElementById("levelUpNotification");
  if (notification) {
    notification.style.display = "none";
  }
  levelUpNotification = null;
}

// Show victory message
function showVictoryMessage(message) {
  victoryMessage = message;
  const victoryEl = document.getElementById("victoryMessage");
  if (victoryEl) {
    victoryEl.innerHTML = `<span class="text-2xl">✨</span> <span>${message}</span>`;
    victoryEl.style.display = "flex";
    victoryEl.style.alignItems = "center";
    victoryEl.style.gap = "0.5rem";
    setTimeout(() => {
      victoryEl.style.display = "none";
      victoryMessage = null;
    }, 2000);
  }
}

// Heal using item
function useHealItem() {
  if (!character || character.hp >= character.maxHp) return;
  
  const healAmount = 30;
  const newHp = Math.min(character.maxHp, character.hp + healAmount);
  
  character.hp = newHp;
  
  // Remove one Energy Cell from inventory
  const index = inventory.indexOf("Energy Cell");
  if (index > -1) {
    inventory.splice(index, 1);
  }
  
  addLog("You used an Energy Cell to heal 30 HP.");
  updateUI();
}

// Travel deeper into the world
function travelDeeper() {
  addLog("Venturing deeper into the unknown...");
  simulateExploration();
}

// Restart the game
function restartGame() {
  location.reload();
}
