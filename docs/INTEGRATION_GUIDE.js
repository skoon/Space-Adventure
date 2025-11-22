/**
 * Example: How to integrate the combat module into game.js
 * 
 * This file demonstrates the integration pattern.
 * You would add this to your index.html and modify game.js accordingly.
 */

// ============================================
// STEP 1: Add module script to index.html
// ============================================
/*
In index.html, change the script tag to:

<script type="module" src="game.js"></script>

And add before the closing </body> tag:
<script type="module" src="systems/combat.js"></script>
*/

// ============================================
// STEP 2: In game.js, import the combat module
// ============================================

// At the top of game.js, add:
import {
    initCombat,
    processStatusEffects,
    encounterEnemy,
    updateCombatUI,
    playerAttack,
    playerBlock,
    playerDodge,
    useSpecialAbility,
    enemyTurn,
    winCombat
} from './systems/combat.js';

// ============================================
// STEP 3: Initialize the combat module
// ============================================

// After all your state variables and DOM elements are defined,
// call initCombat with dependencies:

function initializeGame() {
    // Initialize combat module with dependencies
    initCombat({
        state: {
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
            set enemyStatusEffects(val) { enemyStatusEffects = val; }
        },
        data: {
            enemies
        },
        dom: {
            combatElements
        },
        ui: {
            addLog,
            updateCombatLog,
            showScreen,
            updateUI,
            getStatusEffectIcon,
            showVictoryMessage
        },
        equipment: {
            getEffectiveStats
        },
        character: {
            getCharacterAvatar,
            gainXp
        },
        quests: {
            checkQuestProgress
        },
        exploration: {
            simulateExploration
        }
    });
}

// Call this after DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);

// ============================================
// STEP 4: Remove old combat functions from game.js
// ============================================

/*
You can now safely delete these functions from game.js:
- processStatusEffects()
- encounterEnemy()
- updateCombatUI()
- playerAttack()
- playerBlock()
- playerDodge()
- useSpecialAbility()
- enemyTurn()
- winCombat()

The module exports will make them available globally.
*/

// ============================================
// STEP 5: Make functions globally accessible (if needed)
// ============================================

// If you need these functions to be called from HTML onclick attributes,
// attach them to window:

window.playerAttack = playerAttack;
window.playerBlock = playerBlock;
window.playerDodge = playerDodge;
window.useSpecialAbility = useSpecialAbility;

// ============================================
// Benefits of this approach:
// ============================================

/*
1. **Separation of Concerns**: Combat logic is isolated
2. **Easier Testing**: You can test combat.js independently
3. **Better Organization**: Related functions are grouped together
4. **Dependency Injection**: Clear dependencies, no hidden globals
5. **Maintainability**: Changes to combat don't affect other systems
6. **Scalability**: Easy to add more modules (quests, equipment, etc.)
*/

// ============================================
// Next Steps:
// ============================================

/*
1. Create similar modules for:
   - systems/quests.js
   - systems/equipment.js
   - systems/exploration.js
   - systems/character.js
   - ui/uiManager.js
   - data/gameData.js

2. Gradually refactor game.js to use all modules

3. Eventually, game.js becomes just the initialization and glue code
*/
