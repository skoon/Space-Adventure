/**
 * Save/Load UI Module
 * Handles Save/Load slots selection and Exit to Main Menu
 */

import { saveGame, loadGame, deleteSaveGame, getSlotInfo, exitToMainMenu as exitCore, startNewGame } from '../saveload.js';
import { showDialog, hideDialog } from './notifications.js';

/**
 * Render HTML for save/load slots
 */
function renderSlotsHtml(mode) {
    let html = `<div class="space-y-4 text-left w-full max-w-lg mx-auto mt-2">`;
    for (let slot = 1; slot <= 3; slot++) {
        const info = getSlotInfo(slot);
        if (info.exists) {
            const dateStr = new Date(info.timestamp).toLocaleString();
            html += `
            <div class="p-4 bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                <div class="flex-1 w-full">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-blue-400 uppercase tracking-wider">Slot ${slot}</span>
                        <span class="text-xs text-gray-500">${dateStr}</span>
                    </div>
                    <div class="text-lg font-bold text-white">${info.name}</div>
                    <div class="text-sm text-gray-300">Level ${info.level} ${info.role} • ${info.locationName}</div>
                </div>
                <div class="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                    ${mode === 'save' ? `
                        <button id="action-btn-${slot}" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded text-sm transition-colors cursor-pointer flex-1 sm:flex-none">
                            🔄 Overwrite
                        </button>
                    ` : mode === 'newgame' ? `
                        <button id="action-btn-${slot}" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded text-sm transition-colors cursor-pointer flex-1 sm:flex-none">
                            ⚠️ Overwrite
                        </button>
                    ` : `
                        <button id="action-btn-${slot}" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm transition-colors cursor-pointer flex-1 sm:flex-none">
                            📂 Load
                        </button>
                    `}
                    <button id="delete-btn-${slot}" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm transition-colors cursor-pointer hover:text-white" title="Delete Save">
                        🗑️
                    </button>
                </div>
            </div>`;
        } else {
            html += `
            <div class="p-4 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors opacity-75">
                <div class="flex-1 w-full">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Slot ${slot}</span>
                    <div class="text-lg font-bold text-gray-500 mt-1">Empty Slot</div>
                    <div class="text-sm text-gray-600">No saved game</div>
                </div>
                <div class="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                    ${mode === 'save' ? `
                        <button id="action-btn-${slot}" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-sm transition-colors cursor-pointer flex-1 sm:flex-none">
                            💾 Save
                        </button>
                    ` : mode === 'newgame' ? `
                        <button id="action-btn-${slot}" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-sm transition-colors cursor-pointer flex-1 sm:flex-none">
                            🆕 New Game
                        </button>
                    ` : `
                        <button id="action-btn-${slot}" class="px-4 py-2 bg-gray-700 text-gray-500 font-bold rounded text-sm cursor-not-allowed flex-1 sm:flex-none" disabled>
                            📂 Load
                        </button>
                    `}
                </div>
            </div>`;
        }
    }
    html += `</div>`;
    return html;
}

/**
 * Attach button click event listeners programmatically
 */
function attachListeners(mode, container) {
    for (let slot = 1; slot <= 3; slot++) {
        const actionBtn = container.querySelector(`#action-btn-${slot}`);
        if (actionBtn && !actionBtn.disabled) {
            actionBtn.onclick = () => {
                if (mode === 'save') {
                    if (saveGame(slot)) {
                        hideDialog();
                    }
                } else if (mode === 'newgame') {
                    const info = getSlotInfo(slot);
                    if (info.exists) {
                        if (confirm(`Are you sure you want to overwrite Save Slot ${slot}? This will permanently delete the existing character and progress.`)) {
                            startNewGame(slot);
                            hideDialog();
                        }
                    } else {
                        startNewGame(slot);
                        hideDialog();
                    }
                } else {
                    if (loadGame(slot)) {
                        hideDialog();
                    }
                }
            };
        }
        const deleteBtn = container.querySelector(`#delete-btn-${slot}`);
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                if (deleteSaveGame(slot)) {
                    // Re-render internally without closing the dialog
                    container.innerHTML = renderSlotsHtml(mode);
                    attachListeners(mode, container);
                }
            };
        }
    }
}

/**
 * Show Save/Load dialog with 3 Slots selection
 */
export function showSaveLoadUI(mode) {
    const title = mode === 'save' ? "Save Game" : mode === 'newgame' ? "Start New Game" : "Load Game";
    
    showDialog(
        title,
        `<div id="saveLoadSlotsContainer" class="w-full"></div>`,
        [
            {
                text: "Cancel",
                action: () => {}
            }
        ]
    );

    setTimeout(() => {
        const container = document.getElementById("saveLoadSlotsContainer");
        if (container) {
            container.innerHTML = renderSlotsHtml(mode);
            attachListeners(mode, container);
        }
    }, 100);
}

/**
 * Show exit confirmation dialog and perform clean up
 */
export function exitToMainMenu() {
    if (confirm("Exit to Main Menu? Any unsaved progress will be lost.")) {
        exitCore();
    }
}
