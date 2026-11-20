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
    const currentLocale = deps.settings.getLocale ? deps.settings.getLocale() : 'en';
    const currentVolume = deps.settings.getVolume ? deps.settings.getVolume() : 1.0;
    const isMuted = deps.settings.getMuted ? deps.settings.getMuted() : false;
    
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

            <h3 class="font-bold text-yellow-400 mb-2">Audio</h3>
            <label class="flex items-center gap-2 text-sm text-gray-300 mb-2 cursor-pointer">
                <input type="checkbox" id="inGameMuteAudio" class="accent-cyan-500" ${isMuted ? 'checked' : ''}>
                Mute Audio
            </label>
            <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-300 mb-1">
                    <label for="inGameVolumeSlider">Master Volume</label>
                    <span id="inGameVolumeValue" class="font-mono text-cyan-400">${Math.round(currentVolume * 100)}%</span>
                </div>
                <input type="range" id="inGameVolumeSlider" min="0" max="100" step="5" value="${Math.round(currentVolume * 100)}" class="w-full accent-cyan-500">
            </div>

            <h3 class="font-bold text-yellow-400 mb-2">Language / Idioma</h3>
            <select id="inGameLocaleSelect" class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4">
                <option value="en" ${currentLocale === 'en' ? 'selected' : ''}>English</option>
                <option value="es" ${currentLocale === 'es' ? 'selected' : ''}>Español</option>
            </select>
            
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

        const muteCheckbox = document.getElementById("inGameMuteAudio");
        if (muteCheckbox && deps.settings.setMuted) {
            muteCheckbox.addEventListener("change", (e) => {
                deps.settings.setMuted(e.target.checked);
            });
        }

        const volumeSlider = document.getElementById("inGameVolumeSlider");
        const volumeValue = document.getElementById("inGameVolumeValue");
        if (volumeSlider && deps.settings.setVolume) {
            const handleVolumeChange = (e) => {
                const val = Number(e.target.value) / 100;
                if (volumeValue) volumeValue.textContent = `${Math.round(val * 100)}%`;
                deps.settings.setVolume(val);
            };
            volumeSlider.addEventListener("input", handleVolumeChange);
            volumeSlider.addEventListener("change", handleVolumeChange);
        }

        const localeSelect = document.getElementById("inGameLocaleSelect");
        if (localeSelect && deps.settings.setLocale) {
            localeSelect.addEventListener("change", (e) => {
                deps.settings.setLocale(e.target.value);
                if (deps.ui && deps.ui.updateUI) deps.ui.updateUI();
            });
        }
    }, 100);
}
