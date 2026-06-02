/**
 * Crafting System Module
 * Handles recipe management and item creation
 */

import { rollRarity } from './rarity.js';

let state;
let addLog, updateUI;
let items;

/**
 * Initialize crafting module
 */
export function initCrafting(deps) {
    state = deps.state;
    items = deps.data.items;
    
    addLog = deps.ui.addLog;
    updateUI = deps.ui.updateUI;
}

/**
 * Craft an item from a recipe
 */
export function craftItem(recipeId) {
    const recipe = state.character.knownRecipes?.[recipeId];
    if (!recipe) {
        addLog("❌ Recipe not known!");
        return false;
    }
    
    // Check if player has required materials
    const materialCounts = {};
    state.inventory.forEach(item => {
        materialCounts[item] = (materialCounts[item] || 0) + 1;
    });
    
    for (const [material, amount] of Object.entries(recipe.requires)) {
        if ((materialCounts[material] || 0) < amount) {
            addLog(`❌ Missing ${material} (need ${amount}, have ${materialCounts[material] || 0})`);
            return false;
        }
    }
    
    // Remove materials from inventory
    for (const [material, amount] of Object.entries(recipe.requires)) {
        for (let i = 0; i < amount; i++) {
            const idx = state.inventory.indexOf(material);
            if (idx > -1) state.inventory.splice(idx, 1);
        }
    }
    
    // Add crafted item
    const finalItem = rollRarity(recipe.creates, 0.15); // crafting has a higher baseline for upgrades!
    state.inventory.push(finalItem);
    if (finalItem !== recipe.creates) {
        addLog(`🎉 Masterwork! Your crafted ${recipe.creates} turned out as a ${finalItem}!`);
    } else {
        addLog(`✨ Crafted ${recipe.creates}!`);
    }
    updateUI();
    return true;
}

/**
 * Discover a new recipe
 */
export function discoverRecipe(recipeId, recipeDef) {
    if (!state.character.knownRecipes) {
        state.character.knownRecipes = {};
    }
    
    if (!state.character.knownRecipes[recipeId]) {
        state.character.knownRecipes[recipeId] = recipeDef;
        addLog(`[!] Discovered recipe: ${recipeDef.name}!`);
        updateUI();
        return true;
    }
    return false;
}

/**
 * Get all known recipes
 */
export function getKnownRecipes() {
    return state.character.knownRecipes || {};
}

/**
 * Check if recipe can be crafted
 */
export function canCraft(recipeId) {
    const recipe = state.character.knownRecipes?.[recipeId];
    if (!recipe) return false;
    
    const materialCounts = {};
    state.inventory.forEach(item => {
        materialCounts[item] = (materialCounts[item] || 0) + 1;
    });
    
    for (const [material, amount] of Object.entries(recipe.requires)) {
        if ((materialCounts[material] || 0) < amount) {
            return false;
        }
    }
    return true;
}
