/**
 * Crafting UI Module
 * Handles crafting interface
 */

let state;
let craftItem;

export function initCraftingUI(deps) {
    state = deps.state;
    // We can't easily get craftItem here if it's not in deps
    // But craftItem is in systems/crafting.js.
    // We can import it dynamically when needed or pass it in deps if we update game.js
    // For now, let's rely on dynamic import for actions.
}

/**
 * Show crafting screen
 */
export function showCraftingUI() {
    // Remove existing if any
    const existing = document.getElementById('craftingModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'craftingModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-gray-800 border-2 border-purple-500 rounded-lg max-w-4xl w-full p-6 relative shadow-[0_0_15px_rgba(168,85,247,0.5)]">
            <button onclick="document.getElementById('craftingModal').remove()" 
                    class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold">&times;</button>
            
            <h2 class="text-3xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                <span>🔨</span> Crafting Station
            </h2>
            <div id="recipeList" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    updateCraftingUI();
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * Update crafting UI content
 */
export function updateCraftingUI() {
    const list = document.getElementById('recipeList');
    if (!list) return;
    
    list.innerHTML = '';
    
    const knownRecipes = state.character.knownRecipes || {};
    
    if (Object.keys(knownRecipes).length === 0) {
        list.innerHTML = '<div class="col-span-2 text-center text-gray-500 italic p-8">No recipes known yet. Explore the galaxy to discover crafting schematics!</div>';
        return;
    }
    
    Object.entries(knownRecipes).forEach(([id, recipe]) => {
        // Check materials
        let canCraft = true;
        const currentMaterials = {};
        state.inventory.forEach(i => currentMaterials[i] = (currentMaterials[i] || 0) + 1);
        
        let reqHtml = '';
        Object.entries(recipe.requires).forEach(([mat, amt]) => {
            const have = currentMaterials[mat] || 0;
            if (have < amt) canCraft = false;
            
            reqHtml += `<div class="flex justify-between text-xs mb-1">
                <span class="text-gray-300">${mat}</span>
                <span class="${have >= amt ? 'text-green-400' : 'text-red-400'} font-mono">${have}/${amt}</span>
            </div>`;
        });
        
        const card = document.createElement("div");
        card.className = `bg-gray-700 p-4 rounded border-l-4 ${canCraft ? 'border-green-500' : 'border-gray-600 opacity-75'}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="font-bold text-yellow-400 text-lg">${recipe.name}</div>
                ${canCraft ? '<span class="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Ready</span>' : ''}
            </div>
            <div class="text-sm text-gray-400 mb-3 italic">${recipe.description}</div>
            
            <div class="bg-gray-800 p-3 rounded mb-3">
                <div class="text-xs font-bold text-gray-500 uppercase mb-2">Required Materials</div>
                ${reqHtml}
            </div>
            
            <button onclick="window.craftItemFromUI('${id}')" 
                    class="w-full py-2 px-4 rounded font-bold transition-colors ${canCraft ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}"
                    ${!canCraft ? 'disabled' : ''}>
                ${canCraft ? 'Combine Materials' : 'Missing Materials'}
            </button>
        `;
        list.appendChild(card);
    });
}

// Global helper
window.craftItemFromUI = function(recipeId) {
    import('../crafting.js').then(m => {
        if (m.craftItem(recipeId)) {
            updateCraftingUI(); // Refresh list to update material counts
        }
    });
};
