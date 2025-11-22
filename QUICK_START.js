/**
 * QUICK START: Integrating combat-simple.js
 * 
 * This is the easiest way to start modularizing your code.
 */

// ============================================
// STEP 1: Update index.html
// ============================================

/*
Change your script tag from:
  <script src="game.js"></script>

To:
  <script type="module" src="game.js"></script>
*/

// ============================================
// STEP 2: At the TOP of game.js, add this import:
// ============================================

import { Combat } from './systems/combat-simple.js';

// ============================================
// STEP 3: After all your variables are defined, initialize Combat
// ============================================

// Put this AFTER you've defined all your game state variables
// (gameState, character, enemy, etc.) and DOM elements

Combat.init({
    // State references (these will be mutated by Combat)
    get gameState() { return gameState; },
    set gameState(val) { gameState = val; },
    get character() { return character; },
    set character(val) { character = val; },
    get enemy() { return enemy; },
    set enemy(val) { enemy = val; },
    get inventory() { return inventory; },
    set inventory(val) { inventory = val; },
    get playerStatusEffects() { return playerStatusEffects; },
    set playerStatusEffects(val) { playerStatusEffects = val; },
    get enemyStatusEffects() { return enemyStatusEffects; },
    set enemyStatusEffects(val) { enemyStatusEffects = val; },

    // Data
    enemies,
    combatElements,

    // Functions Combat needs
    addLog,
    updateCombatLog,
    showScreen,
    updateUI,
    getEffectiveStats,
    getCharacterAvatar,
    getStatusEffectIcon,
    gainXp,
    checkQuestProgress,
    showVictoryMessage,
    simulateExploration
});

// ============================================
// STEP 4: Replace your combat functions with Combat calls
// ============================================

// Find and REPLACE these function definitions in game.js:

// OLD:
// function encounterEnemy() { ... }
// NEW:
function encounterEnemy() {
    Combat.encounterEnemy();
}

// OLD:
// function updateCombatUI() { ... }
// NEW:
function updateCombatUI() {
    Combat.updateCombatUI();
}

// OLD:
// function playerAttack() { ... }
// NEW:
function playerAttack() {
    Combat.playerAttack();
}

// OLD:
// function playerBlock() { ... }
// NEW:
function playerBlock() {
    Combat.playerBlock();
}

// OLD:
// function playerDodge() { ... }
// NEW:
function playerDodge() {
    Combat.playerDodge();
}

// OLD:
// function useSpecialAbility() { ... }
// NEW:
function useSpecialAbility() {
    Combat.useSpecialAbility();
}

// OLD:
// function enemyTurn() { ... }
// NEW:
function enemyTurn() {
    Combat.enemyTurn();
}

// OLD:
// function winCombat() { ... }
// NEW:
function winCombat() {
    Combat.winCombat();
}

// OLD:
// function processStatusEffects() { ... }
// NEW:
function processStatusEffects() {
    Combat.processStatusEffects();
}

// ============================================
// STEP 5: Test it!
// ============================================

/*
1. Open the game in your browser
2. Create a character
3. Trigger combat (Travel Deeper)
4. Try attacking, blocking, dodging
5. Everything should work exactly as before!
*/

// ============================================
// BENEFITS:
// ============================================

/*
✅ All combat code is now in one file (systems/combat-simple.js)
✅ game.js is ~300 lines shorter
✅ Easy to find and modify combat logic
✅ Can test combat independently
✅ Your HTML onclick handlers still work
✅ No breaking changes to existing code
*/

// ============================================
// NEXT STEPS:
// ============================================

/*
Once this works, you can create similar modules for:

1. systems/quests-simple.js
   - acceptQuest, checkQuestProgress, completeQuest, etc.

2. systems/equipment-simple.js
   - getEffectiveStats, equipItem, unequipItem

3. systems/exploration-simple.js
   - simulateExploration, triggerNPCEvent, etc.

4. systems/character-simple.js
   - createCharacter, gainXp, showLevelUpNotification

5. systems/saveLoad-simple.js
   - saveGame, loadGame, exportGame, importGame

Each module follows the same pattern:
- Export an object with methods
- Call .init() with dependencies
- Replace old functions with module calls
*/
