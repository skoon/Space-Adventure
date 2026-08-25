/**
 * Settings UI Module
 * Handles settings modal
 */

import { VERSION } from '../../data/version.js';

let deps;
let showDialog;

export function initSettingsUI(dependencies, showDialogFn) {
    deps = dependencies;
    showDialog = showDialogFn;
}

/**
 * Show Settings Modal
 */
export function showSettingsModal() {
    if (!deps.settings) return;
    
    const currentDiff = deps.settings.getDifficulty();
    const showImages = deps.settings.getShowImages ? deps.settings.getShowImages() : true;
    
    showDialog(
        "Settings",
        `
        <div class="text-left">
            <h3 class="font-bold text-yellow-400 mb-2">Difficulty</h3>
            <select id="inGameDifficultySelect" class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2">
                <option value="easy" ${currentDiff.id === 'easy' ? 'selected' : ''}>Easy - Story Focus</option>
                <option value="normal" ${currentDiff.id === 'normal' ? 'selected' : ''}>Normal - Standard</option>
                <option value="hard" ${currentDiff.id === 'hard' ? 'selected' : ''}>Hard - Veteran</option>
            </select>
            <p id="inGameDifficultyDesc" class="text-xs text-gray-400 mb-4">${currentDiff.description}</p>

            <h3 class="font-bold text-yellow-400 mb-2">Display</h3>
            <label class="flex items-center gap-2 text-sm text-gray-300 mb-1 cursor-pointer">
                <input type="checkbox" id="inGameShowImages" class="accent-cyan-500" ${showImages ? 'checked' : ''}>
                Viewscreen Imagery
            </label>
            <p class="text-xs text-gray-400 mb-4">Off shows emoji only — lighter on slow connections.</p>
            
            <div class="mt-4 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
                Version: <span class="text-gray-400 font-mono">${VERSION}</span>
            </div>
        </div>
        `,
        (() => {
            const options = [];
            if (deps.state && deps.state.character) {
                options.push({
                    text: "Exit to Main Menu",
                    action: () => {
                        import('./saveload-ui.js').then(m => m.exitToMainMenu());
                    }
                });
            }
            options.push({
                text: "Close",
                action: () => {}
            });
            return options;
        })()
    );

    // Attach listener
    setTimeout(() => {
        const select = document.getElementById("inGameDifficultySelect");
        const desc = document.getElementById("inGameDifficultyDesc");
        if (select) {
            select.addEventListener("change", (e) => {
                const level = e.target.value;
                deps.settings.setDifficulty(level);
                const newDiff = deps.settings.getDifficulty();
                if (desc) desc.textContent = newDiff.description;
            });
        }

        const imagesToggle = document.getElementById("inGameShowImages");
        if (imagesToggle && deps.settings.setShowImages) {
            imagesToggle.addEventListener("change", (e) => {
                deps.settings.setShowImages(e.target.checked);
                if (deps.ui && deps.ui.repaintViewscreen) deps.ui.repaintViewscreen();
                if (deps.ui && deps.ui.updateUI) deps.ui.updateUI();
            });
        }
    }, 100);
}
