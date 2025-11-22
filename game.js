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

// Quests data
const quests = {
  "quest_001": {
    id: "quest_001",
    title: "First Contact",
    description: "Defeat 3 Xenobots to secure the landing zone.",
    type: "kill",
    target: "Xenobot",
    amount: 3,
    rewards: { xp: 50, items: ["Energy Cell"] },
    isMainStory: true
  },
  "quest_002": {
    id: "quest_002",
    title: "Scrap Collector",
    description: "Collect 2 Scrap Metal pieces for repairs.",
    type: "collect",
    target: "Scrap Metal",
    amount: 2,
    rewards: { xp: 30, items: ["Scanner"] },
    isMainStory: false
  },
  "quest_003": {
    id: "quest_003",
    title: "Bounty Hunt",
    description: "Eliminate a rogue Plasmavore threatening the area.",
    type: "kill",
    target: "Plasmavore",
    amount: 1,
    rewards: { xp: 40, items: ["Energy Drink"] },
    isMainStory: false
  },
  "quest_004": {
    id: "quest_004",
    title: "Artifact Retrieval",
    description: "Find an Alien Crystal in the ruins.",
    type: "collect",
    target: "Alien Crystal",
    amount: 1,
    rewards: { xp: 60, items: ["Data Chip"] },
    isMainStory: false
  },
  "quest_005": {
    id: "quest_005",
    title: "Lost Cargo",
    description: "Recover a lost Data Chip.",
    type: "collect",
    target: "Data Chip",
    amount: 1,
    rewards: { xp: 45, items: ["Energy Cell"] },
    isMainStory: false
  }
};

// Items data (Equipment)
const items = {
  "Energy Cell": { type: "consumable", effect: "heal", value: 30, description: "Restores 30 HP" },
  "Nano Stimpack": { type: "consumable", effect: "heal", value: 50, description: "Restores 50 HP" },
  "Energy Drink": { type: "consumable", effect: "energy", value: 40, description: "Restores 40 Energy" },
  "Scanner": { type: "tool", description: "Used for analyzing objects" },
  "Scrap Metal": { type: "material", description: "Used for repairs and crafting" },
  "Alien Crystal": { type: "material", description: "A glowing crystal with strange energy" },
  "Data Chip": { type: "material", description: "Contains encrypted data" },

  // Weapons
  "Rusty Pipe": { type: "weapon", attack: 2, description: "Better than nothing." },
  "Laser Pistol": { type: "weapon", attack: 5, description: "Standard issue sidearm." },
  "Plasma Rifle": { type: "weapon", attack: 8, description: "High-energy assault weapon." },
  "Void Blade": { type: "weapon", attack: 12, description: "A sword made of pure void energy." },

  // Armor
  "Flight Suit": { type: "armor", defense: 2, description: "Basic protection." },
  "Plasteel Armor": { type: "armor", defense: 5, description: "Durable synthetic armor." },
  "Exoskeleton": { type: "armor", defense: 8, description: "Powered armor that enhances strength." },

  // Accessories
  "Shield Generator": { type: "accessory", defense: 3, description: "Generates a personal forcefield." },
  "Targeting HUD": { type: "accessory", attack: 3, description: "Improves accuracy and damage." }
};

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
    maxEnergy: 100,
    activeQuests: {},
    completedQuests: [],
    equipment: {
      weapon: null,
      armor: null,
      accessory: null
    }
  };

  // Auto-accept first quest
  acceptQuest("quest_001");

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
        span.className = "inventory-item cursor-pointer hover:text-yellow-400";
        span.textContent = item;
        span.onclick = () => equipItem(item);
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

  // Equipment Slots
  if (character.equipment) {
    const weaponEl = document.getElementById("equipWeapon");
    const armorEl = document.getElementById("equipArmor");
    const accessoryEl = document.getElementById("equipAccessory");

    if (weaponEl) weaponEl.textContent = character.equipment.weapon || "Empty";
    if (armorEl) armorEl.textContent = character.equipment.armor || "Empty";
    if (accessoryEl) accessoryEl.textContent = character.equipment.accessory || "Empty";
  }

  // Update logs
  updateMissionLog();
}



// Quest System Functions

function acceptQuest(questId) {
  if (!character || character.activeQuests[questId] || character.completedQuests.includes(questId)) return;

  const quest = quests[questId];
  if (!quest) return;

  character.activeQuests[questId] = { progress: 0 };
  addLog(`📜 Quest Accepted: ${quest.title}`);
  showSaveMessage(`Quest Accepted: ${quest.title}`); // Reuse save message for notification
}

function checkQuestProgress(type, target, amount) {
  if (!character) return;

  Object.keys(character.activeQuests).forEach(questId => {
    const quest = quests[questId];
    if (quest.type === type && quest.target === target) {
      const currentProgress = character.activeQuests[questId].progress;
      if (currentProgress < quest.amount) {
        character.activeQuests[questId].progress += amount;
        // Notify progress
        if (character.activeQuests[questId].progress < quest.amount) {
          // Optional: addLog(`Quest Progress: ${quest.title} (${character.activeQuests[questId].progress}/${quest.amount})`);
        }

        if (character.activeQuests[questId].progress >= quest.amount) {
          completeQuest(questId);
        }
      }
    }
  });
}

function completeQuest(questId) {
  if (!character || !character.activeQuests[questId]) return;

  const quest = quests[questId];

  // Grant Rewards
  if (quest.rewards.xp) {
    character.xp += quest.rewards.xp;
    addLog(`Quest Reward: +${quest.rewards.xp} XP`);
    // Check level up logic here if needed, or rely on next combat/action
  }

  if (quest.rewards.items) {
    quest.rewards.items.forEach(item => {
      inventory.push(item);
      addLog(`Quest Reward: +1 ${item}`);
    });
  }

  // Move to completed
  delete character.activeQuests[questId];
  character.completedQuests.push(questId);

  addLog(`✅ Quest Completed: ${quest.title}!`);
  showVictoryMessage(`Quest Completed: ${quest.title}`); // Reuse victory message

  updateUI();
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
  const stats = getEffectiveStats();
  if (combatElements.playerAtk) combatElements.playerAtk.textContent = stats.attack;
  if (combatElements.playerDef) combatElements.playerDef.textContent = stats.defense;
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
  const stats = getEffectiveStats();
  const baseDamage = Math.max(0, stats.attack - enemy.defense);
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
  const stats = getEffectiveStats();
  let damage = Math.max(0, enemy.attack - stats.defense);

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

  // Gain XP
  gainXp(xpGained);

  // Check Quest Progress
  checkQuestProgress("kill", enemy.name, 1);

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

// Simulate exploration events
function simulateExploration() {
  if (gameState !== "exploring") return;

  setTimeout(() => {
    // Check for NPC Quest Encounter (10% chance if quests < 2)
    if (Object.keys(character.activeQuests).length < 2 && Math.random() < 0.10) {
      triggerNPCEvent();
      return;
    }

    const eventChance = Math.random();

    if (eventChance < 0.25) {
      // 25% Chance: Enemy
      encounterEnemy();
    } else if (eventChance < 0.40) {
      // 15% Chance: Abandoned Outpost
      const outpostLoot = ["Energy Cell", "Data Chip", "Rusty Pipe"][Math.floor(Math.random() * 3)];
      addLog(`You discovered an Abandoned Outpost and found a ${outpostLoot}.`);
      inventory.push(outpostLoot);
    } else if (eventChance < 0.55) {
      // 15% Chance: Ancient Ruins
      const xpGain = 15;
      addLog(`You explored Ancient Ruins and deciphered glyphs, gaining ${xpGain} XP.`);
      gainXp(xpGain);
    } else if (eventChance < 0.65) {
      // 10% Chance: Strange Anomaly
      addLog("You encountered a Strange Anomaly. Your energy is restored.");
      character.energy = character.maxEnergy;
    } else if (eventChance < 0.80) {
      // 15% Chance: Scrap Metal
      addLog("You found some scrap metal.");
      inventory.push("Scrap Metal");
      checkQuestProgress("collect", "Scrap Metal", 1);
    } else {
      // 20% Chance: Quiet
      addLog("The landscape is quiet... for now.");
    }

    updateUI();
  }, 2000);
}

// NPC Event Logic
function triggerNPCEvent() {
  const availableQuests = Object.values(quests).filter(q =>
    !character.activeQuests[q.id] && !character.completedQuests.includes(q.id)
  );

  if (availableQuests.length === 0) {
    // Fallback if no quests available
    addLog("You met a traveler, but they had nothing for you.");
    updateUI();
    return;
  }

  const randomQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];

  const modal = document.getElementById("eventModal");
  const title = document.getElementById("eventTitle");
  const desc = document.getElementById("eventDescription");
  const acceptBtn = document.getElementById("eventAcceptBtn");

  if (modal && title && desc && acceptBtn) {
    title.textContent = "NPC Encounter";
    desc.innerHTML = `A mysterious figure approaches you.<br><br>"Greetings, traveler. I have a job for you if you're interested."<br><br><strong>Quest: ${randomQuest.title}</strong><br>${randomQuest.description}`;

    acceptBtn.onclick = () => {
      acceptQuest(randomQuest.id);
      closeEventModal();
      addLog(`You accepted the quest: ${randomQuest.title}`);
      updateUI();
    };

    modal.style.display = "flex";
  }
}

function closeEventModal() {
  const modal = document.getElementById("eventModal");
  if (modal) {
    modal.style.display = "none";
    addLog("You parted ways with the stranger.");
    updateUI();
  }
}

// Equipment System

function getEffectiveStats() {
  if (!character) return { attack: 0, defense: 0 };

  let attack = character.attack;
  let defense = character.defense;

  // Add equipment stats
  if (character.equipment.weapon) {
    const weapon = items[character.equipment.weapon];
    if (weapon && weapon.stats && weapon.stats.attack) {
      attack += weapon.stats.attack;
    }
  }

  if (character.equipment.armor) {
    const armor = items[character.equipment.armor];
    if (armor && armor.stats && armor.stats.defense) {
      defense += armor.stats.defense;
    }
  }

  if (character.equipment.accessory) {
    const accessory = items[character.equipment.accessory];
    if (accessory && accessory.stats) {
      if (accessory.stats.attack) attack += accessory.stats.attack;
      if (accessory.stats.defense) defense += accessory.stats.defense;
    }
  }

  // Add status effects
  const attackBuff = playerStatusEffects.find(e => e.type === "attackBoost")?.value || 0;
  const defenseBuff = playerStatusEffects.find(e => e.type === "defenseBoost")?.value || 0;

  attack += attackBuff;
  defense += defenseBuff;

  return { attack, defense };
}

function equipItem(itemName) {
  const item = items[itemName];
  if (!item || !["weapon", "armor", "accessory"].includes(item.type)) {
    addLog("Cannot equip this item.");
    return;
  }

  // Remove from inventory
  const index = inventory.indexOf(itemName);
  if (index === -1) return;
  inventory.splice(index, 1);

  // Unequip current item in slot if any
  const slot = item.type;
  if (character.equipment[slot]) {
    unequipItem(slot);
  }

  // Equip new item
  character.equipment[slot] = itemName;
  addLog(`Equipped ${itemName}.`);
  updateUI();
}

function unequipItem(slot) {
  const itemName = character.equipment[slot];
  if (!itemName) return;

  character.equipment[slot] = null;
  inventory.push(itemName);
  addLog(`Unequipped ${itemName}.`);
  updateUI();
}

// Gain XP and check for level up
function gainXp(amount) {
  if (!character) return;

  character.xp += amount;

  // Check for level up
  const xpToNext = character.level * 100;
  if (character.xp >= xpToNext) {
    character.level++;
    character.xp -= xpToNext;

    // Stat increases
    const statIncreases = {
      maxHp: 10,
      attack: 2,
      defense: 1
    };

    character.maxHp += statIncreases.maxHp;
    character.hp = character.maxHp; // Full heal on level up
    character.attack += statIncreases.attack;
    character.defense += statIncreases.defense;
    character.maxEnergy += 10;
    character.energy = character.maxEnergy;

    showLevelUpNotification(character.level, statIncreases);
    addLog(`🎉 LEVEL UP! You reached Level ${character.level}!`);
  }

  updateUI();
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

// ============================================
// SAVE/LOAD SYSTEM
// ============================================

const SAVE_VERSION = "1.0";
const STORAGE_KEY = "galacticOdyssey_save";

// Get current game state as serializable object
function getGameState() {
  return {
    version: SAVE_VERSION,
    timestamp: new Date().toISOString(),
    gameState: gameState,
    character: character,
    inventory: inventory,
    enemy: enemy,
    log: log,
    playerStatusEffects: playerStatusEffects,
    enemyStatusEffects: enemyStatusEffects
  };
}

// Save game to localStorage
function saveGame() {
  if (!character) {
    alert("No game to save! Please create a character first.");
    return false;
  }

  try {
    const saveData = getGameState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    addLog("💾 Game saved successfully!");
    showSaveMessage("Game Saved!");
    return true;
  } catch (error) {
    console.error("Error saving game:", error);
    alert("Failed to save game. Please try again.");
    return false;
  }
}

// Load game from localStorage
function loadGame() {
  try {
    const saveDataStr = localStorage.getItem(STORAGE_KEY);
    if (!saveDataStr) {
      alert("No saved game found!");
      return false;
    }

    const saveData = JSON.parse(saveDataStr);

    // Validate save data
    if (!saveData.character) {
      alert("Invalid save file!");
      return false;
    }

    // Restore game state
    gameState = saveData.gameState || "exploring";
    character = saveData.character;
    inventory = saveData.inventory || [];
    enemy = saveData.enemy || null;
    log = saveData.log || [];
    playerStatusEffects = saveData.playerStatusEffects || [];
    enemyStatusEffects = saveData.enemyStatusEffects || [];

    // Clear notifications
    levelUpNotification = null;
    victoryMessage = null;

    // Update UI
    showScreen(gameState);
    updateUI();
    if (gameState === "combat" && enemy) {
      updateCombatUI();
    }

    addLog("📂 Game loaded successfully!");
    showSaveMessage("Game Loaded!");
    return true;
  } catch (error) {
    console.error("Error loading game:", error);
    alert("Failed to load game. The save file may be corrupted.");
    return false;
  }
}

// Export game state as JSON file
// Export game state as JSON file
function exportGame() {
  if (!character) {
    alert("No game to export! Please create a character first.");
    return;
  }

  try {
    const saveData = getGameState();
    const jsonStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `galactic-odyssey-save-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addLog("📤 Game exported successfully!");
    showSaveMessage("Game Exported!");
  } catch (error) {
    console.error("Error exporting game:", error);
    alert("Failed to export game. Please try again.");
  }
}

// Import game state from JSON file
function importGame() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const saveDataStr = event.target.result;
        localStorage.setItem(STORAGE_KEY, saveDataStr);
        loadGame();
        addLog("📥 Game imported successfully!");
      } catch (error) {
        console.error("Error importing game:", error);
        alert("Failed to import game. Invalid file.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ============================================
// QUEST UI SYSTEM
// ============================================

let currentQuestTab = "active";

function toggleQuestLog() {
  const modal = document.getElementById("questLogModal");
  if (!modal) return;

  if (modal.classList.contains("hidden")) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
    renderQuestList();
  } else {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
}

function switchQuestTab(tab) {
  currentQuestTab = tab;

  // Update tab styles
  const activeBtn = document.getElementById("activeQuestsTab");
  const completedBtn = document.getElementById("completedQuestsTab");

  if (tab === "active") {
    activeBtn.className = "flex-1 py-2 px-4 bg-yellow-600 text-white rounded font-bold";
    completedBtn.className = "flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded font-bold hover:bg-gray-600";
  } else {
    activeBtn.className = "flex-1 py-2 px-4 bg-gray-700 text-gray-300 rounded font-bold hover:bg-gray-600";
    completedBtn.className = "flex-1 py-2 px-4 bg-yellow-600 text-white rounded font-bold";
  }

  renderQuestList();
}

function renderQuestList() {
  const list = document.getElementById("questList");
  if (!list || !character) return;

  list.innerHTML = "";

  const questIds = currentQuestTab === "active"
    ? Object.keys(character.activeQuests)
    : character.completedQuests;

  if (questIds.length === 0) {
    list.innerHTML = `<div class="text-gray-400 text-center italic p-4">No ${currentQuestTab} quests.</div>`;
    return;
  }

  questIds.forEach(questId => {
    const quest = quests[questId];
    if (!quest) return;

    const div = document.createElement("div");
    div.className = "bg-gray-700 p-4 rounded border border-gray-600";

    let progressText = "";
    if (currentQuestTab === "active") {
      const progress = character.activeQuests[questId].progress;
      const percentage = Math.min(100, (progress / quest.amount) * 100);
      progressText = `
        <div class="mt-2">
          <div class="flex justify-between text-sm text-gray-300 mb-1">
            <span>Progress: ${progress}/${quest.amount} ${quest.target}s</span>
            <span>${Math.round(percentage)}%</span>
          </div>
          <div class="w-full bg-gray-800 rounded-full h-2">
            <div class="bg-yellow-500 h-2 rounded-full" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    } else {
      progressText = `<div class="mt-2 text-green-400 text-sm font-bold">✅ Completed</div>`;
    }

    div.innerHTML = `
      <h3 class="text-lg font-bold text-yellow-400">${quest.title}</h3>
      <p class="text-gray-300 text-sm mt-1">${quest.description}</p>
      <div class="mt-2 text-xs text-gray-400">
        Rewards: ${quest.rewards.xp ? `${quest.rewards.xp} XP` : ""} ${quest.rewards.items ? `+ ${quest.rewards.items.join(", ")}` : ""}
      </div>
      ${progressText}
    `;

    list.appendChild(div);
  });
}

// Check if save exists
function hasSaveGame() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Delete save game
function deleteSaveGame() {
  if (!hasSaveGame()) {
    alert("No saved game to delete!");
    return;
  }

  if (confirm("Are you sure you want to delete your saved game? This cannot be undone.")) {
    localStorage.removeItem(STORAGE_KEY);
    addLog("🗑️ Saved game deleted.");
    showSaveMessage("Save Deleted!");
  }
}

// Auto-save function (called at key moments)
function autoSave() {
  if (character && gameState !== "start" && gameState !== "characterCreation" && gameState !== "defeat") {
    try {
      const saveData = getGameState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      console.log("Auto-saved game");
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }
}

// Show save message notification
function showSaveMessage(message) {
  const saveMsg = document.getElementById("saveMessage");
  if (saveMsg) {
    saveMsg.textContent = message;
    saveMsg.style.display = "block";
    setTimeout(() => {
      saveMsg.style.display = "none";
    }, 2000);
  }
}

// Initialize: Check for existing save on page load
function initializeSaveSystem() {
  // Check if there's a saved game and show option to load
  const loadButton = document.getElementById("loadGameButton");
  if (hasSaveGame()) {
    const saveInfo = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saveInfo && saveInfo.timestamp) {
      const saveDate = new Date(saveInfo.timestamp);
      const saveDateStr = saveDate.toLocaleString();
      console.log(`Save game found from ${saveDateStr}`);
      if (loadButton) {
        loadButton.style.display = "block";
        loadButton.title = `Last saved: ${saveDateStr}`;
      }
    }
  } else {
    if (loadButton) {
      loadButton.style.display = "none";
    }
  }
}

// Call auto-save at key moments
// Auto-save after combat victory
const originalWinCombat = winCombat;
winCombat = function () {
  originalWinCombat();
  setTimeout(autoSave, 500); // Auto-save after UI updates
};

// Auto-save after level up
const originalShowLevelUpNotification = showLevelUpNotification;
showLevelUpNotification = function (level, statIncreases) {
  originalShowLevelUpNotification(level, statIncreases);
  setTimeout(autoSave, 500);
};

// Auto-save when character is created
const originalCreateCharacter = createCharacter;
createCharacter = function (event) {
  originalCreateCharacter(event);
  setTimeout(autoSave, 500);
};

// Initialize save system on page load
window.addEventListener("DOMContentLoaded", initializeSaveSystem);

// Combat Item System

function openCombatItemMenu() {
  const modal = document.getElementById("combatItemModal");
  const list = document.getElementById("combatItemList");
  if (!modal || !list) return;

  list.innerHTML = "";

  // Filter for consumable items in inventory
  const consumables = inventory.filter(itemName => {
    const item = items[itemName];
    return item && item.type === "consumable";
  });

  // Get unique items and counts
  const itemCounts = {};
  consumables.forEach(item => {
    itemCounts[item] = (itemCounts[item] || 0) + 1;
  });

  if (Object.keys(itemCounts).length === 0) {
    const div = document.createElement("div");
    div.className = "text-gray-400 italic text-center p-4";
    div.textContent = "No usable items.";
    list.appendChild(div);
  } else {
    Object.entries(itemCounts).forEach(([itemName, count]) => {
      const item = items[itemName];
      const button = document.createElement("button");
      button.className = "w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 flex justify-between items-center group transition-colors";
      button.onclick = () => useCombatItem(itemName);

      const content = `
        <div>
          <div class="font-bold text-white group-hover:text-yellow-400 transition-colors">${itemName} x${count}</div>
          <div class="text-xs text-gray-400">${item.description}</div>
        </div>
        <div class="text-green-400 font-bold bg-gray-800 px-3 py-1 rounded group-hover:bg-green-600 group-hover:text-white transition-colors">Use</div>
      `;
      button.innerHTML = content;
      list.appendChild(button);
    });
  }

  modal.style.display = "flex";
}

function closeCombatItemMenu() {
  const modal = document.getElementById("combatItemModal");
  if (modal) {
    modal.style.display = "none";
  }
}

function useCombatItem(itemName) {
  if (!character || !enemy) return;

  const item = items[itemName];
  if (!item || item.type !== "consumable") return;

  // Remove 1 from inventory
  const index = inventory.indexOf(itemName);
  if (index === -1) return;
  inventory.splice(index, 1);

  // Apply effect
  if (item.effect === "heal") {
    const healAmount = item.value || 0;
    const oldHp = character.hp;
    character.hp = Math.min(character.maxHp, character.hp + healAmount);
    const healed = character.hp - oldHp;
    addLog(`💊 You used ${itemName} and recovered ${healed} HP.`);
  } else if (item.effect === "energy") {
    const energyAmount = item.value || 0;
    character.energy = Math.min(character.maxEnergy, (character.energy || 0) + energyAmount);
    addLog(`⚡ You used ${itemName} and restored ${energyAmount} Energy.`);
  } else {
    addLog(`You used ${itemName} but nothing happened.`);
  }

  updateCombatLog();
  updateCombatUI();
  closeCombatItemMenu();

  // Enemy turn
  setTimeout(enemyTurn, 500);
}
