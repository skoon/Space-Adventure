/**
 * Codex UI Module
 * Handles presentation and modal interaction for the Galactic Codex / Archives.
 */

import { CODEX_CATEGORIES, CODEX_CATEGORY_META } from '../../data/codex.js';
import { IMAGE_BASE, npcImages, enemyImages, bossImages, locationImages, districtImages } from '../../data/imagery.js';
import {
    getCodexEntries,
    getCodexProgress,
    markCodexRead,
    isCodexUnlocked,
    unlockCodexEntry
} from '../codex.js';
import { t } from '../theme-engine.js';

let state = null;
let currentCategory = 'all';
let selectedEntryId = null;

let codexModule = {
    getCodexEntries,
    getCodexProgress,
    markCodexRead,
    isCodexUnlocked,
    unlockCodexEntry
};

/**
 * Initialize Codex UI with dependencies.
 * @param {Object} deps - Dependency object with { state, codex, ... }
 */
export function initCodexUI(deps = {}) {
    state = deps.state || null;
    if (deps.codex) {
        codexModule = { ...codexModule, ...deps.codex };
    }
}

/**
 * Safely retrieves or dynamically creates the codex modal container in the DOM.
 * @returns {HTMLElement|null}
 */
function getOrCreateCodexModal() {
    if (typeof document === 'undefined') return null;

    let modal = document.getElementById("codexModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "codexModal";
        modal.className = "quest-log-modal hidden";
        modal.style.display = "none";
        document.body.appendChild(modal);
    }
    return modal;
}

/**
 * Open the Codex modal.
 */
export function showCodexUI() {
    if (state && !codexModule.isCodexUnlocked('terra_prime') && typeof codexModule.unlockCodexEntry === 'function') {
        codexModule.unlockCodexEntry('terra_prime');
    }
    const modal = getOrCreateCodexModal();
    if (modal) {
        renderCodexModal(currentCategory);
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    }
}

/**
 * Close the Codex modal.
 */
export function closeCodexUI() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById("codexModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
}

/**
 * Render the full Codex modal layout.
 * @param {string} category - Category filter ('all', 'locations', 'factions', etc.)
 */
export function renderCodexModal(category = 'all') {
    const modal = getOrCreateCodexModal();
    if (!modal) return;

    currentCategory = category;

    const progress = codexModule.getCodexProgress();
    const entries = codexModule.getCodexEntries(currentCategory);

    // If selected entry is not in current list, pick the first one
    if (!selectedEntryId || !entries.some(e => e.id === selectedEntryId)) {
        selectedEntryId = entries.length > 0 ? entries[0].id : null;
    }

    // Auto mark as read if an unlocked entry is currently selected
    if (selectedEntryId && codexModule.isCodexUnlocked(selectedEntryId)) {
        codexModule.markCodexRead(selectedEntryId);
    }

    modal.innerHTML = `
        <div class="quest-log-content crt-container-cyan cyber-panel max-w-4xl w-full">
            <div class="terminal-screen crt-cyan-large p-4 flex flex-col h-[80vh] max-h-[85vh]">
                <!-- Terminal Header -->
                <div class="terminal-header flex justify-between items-center mb-3 border-b border-cyan-800 pb-2">
                    <div class="flex items-center gap-2">
                        <h2 class="text-2xl font-bold text-cyan-400 tracking-widest cyber-glow-text font-mono" data-term="codexTitle">
                            >> ${t('GALACTIC ARCHIVES // CODEX')} <<
                        </h2>
                    </div>
                    <button id="codexCloseBtn" class="text-cyan-500 hover:text-cyan-300 font-bold text-xl font-mono px-2 py-1">
                        [X]
                    </button>
                </div>

                <!-- Progress / Status Bar -->
                <div id="codexProgressBar" class="mb-3 p-2 bg-cyan-950/40 rounded border border-cyan-900/60 flex flex-wrap justify-between items-center text-xs font-mono">
                    <!-- Injected by renderProgressBar -->
                </div>

                <!-- Category Tabs -->
                <div id="codexCategoryTabs" class="flex flex-wrap gap-1 border-b border-cyan-900/50 pb-2 mb-3">
                    <!-- Injected by renderCategoryTabs -->
                </div>

                <!-- Main Content: Split List & Detail -->
                <div class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-hidden">
                    <!-- Left List: Entries List -->
                    <div id="codexEntriesList" class="md:col-span-5 flex flex-col gap-1.5 overflow-y-auto pr-1.5 custom-scrollbar-cyan">
                        <!-- Injected by renderEntriesList -->
                    </div>

                    <!-- Right Detail: Entry Lore & Telemetry -->
                    <div id="codexDetailPane" class="md:col-span-7 bg-cyan-950/20 border border-cyan-900/50 rounded p-4 overflow-y-auto custom-scrollbar-cyan flex flex-col">
                        <!-- Injected by renderDetailPane -->
                    </div>
                </div>

                <!-- Terminal Footer -->
                <div class="mt-2 text-[10px] text-cyan-700 font-mono text-center border-t border-cyan-900/50 pt-1">
                    TERMINAL_ID: CDX-7700 // ENCRYPTION: AES-QUANTUM-256
                </div>
            </div>
        </div>
    `;

    // Hook up close button
    const closeBtn = modal.querySelector('#codexCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = () => closeCodexUI();
    }

    renderProgressBar();
    renderCategoryTabs();
    renderEntriesList();
    renderDetailPane();
}

/**
 * Render the progress overview bar.
 */
function renderProgressBar() {
    const bar = document.getElementById("codexProgressBar");
    if (!bar) return;

    const progress = codexModule.getCodexProgress();

    bar.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-cyan-300 font-bold">PROGRESS:</span>
            <span class="text-white">${progress.unlockedCount}/${progress.totalCount} Decrypted</span>
            <span class="text-cyan-400 font-bold">(${progress.percentage}%)</span>
            ${progress.unreadCount > 0 ? `<span class="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded text-[10px] animate-pulse">● ${progress.unreadCount} NEW</span>` : ''}
        </div>
        <div class="w-full sm:w-48 bg-gray-900 rounded-full h-2 mt-1 sm:mt-0 border border-cyan-950">
            <div class="bg-cyan-400 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]" style="width: ${progress.percentage}%"></div>
        </div>
    `;
}

/**
 * Render category navigation tabs.
 */
function renderCategoryTabs() {
    const tabsContainer = document.getElementById("codexCategoryTabs");
    if (!tabsContainer) return;

    tabsContainer.innerHTML = "";

    const allCategories = [
        { id: 'all', label: 'All', icon: '🌌' },
        ...CODEX_CATEGORIES.map(id => CODEX_CATEGORY_META[id] || { id, label: id, icon: '📄' })
    ];

    allCategories.forEach(cat => {
        const isActive = currentCategory === cat.id;
        const btn = document.createElement("button");
        btn.id = `codex-tab-${cat.id}`;
        btn.className = `py-1 px-3 text-xs font-mono font-bold rounded border transition-all ${
            isActive
                ? 'bg-cyan-900/60 text-cyan-300 border-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.4)]'
                : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:text-cyan-300 hover:bg-cyan-950/30'
        }`;
        btn.innerHTML = `${cat.icon} ${t(cat.label)}`;
        btn.onclick = () => {
            renderCodexModal(cat.id);
        };
        tabsContainer.appendChild(btn);
    });
}

/**
 * Render the list of codex entries in the current category.
 */
function renderEntriesList() {
    const list = document.getElementById("codexEntriesList");
    if (!list) return;

    list.innerHTML = "";
    const entries = codexModule.getCodexEntries(currentCategory);

    if (entries.length === 0) {
        list.innerHTML = `
            <div class="text-xs text-gray-500 font-mono italic p-3 text-center">
                No entries found in this category.
            </div>
        `;
        return;
    }

    entries.forEach(entry => {
        const isSelected = entry.id === selectedEntryId;
        const meta = CODEX_CATEGORY_META[entry.category] || { icon: '📄' };

        const btn = document.createElement("button");
        btn.id = `codex-entry-${entry.id}`;
        btn.className = `w-full text-left p-2.5 rounded border transition-all flex items-center justify-between text-xs font-mono ${
            isSelected
                ? 'bg-cyan-900/50 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : entry.unlocked
                    ? 'bg-cyan-950/20 border-cyan-900/40 text-gray-300 hover:bg-cyan-900/30 hover:border-cyan-700/60'
                    : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:bg-gray-800/40'
        }`;

        let statusIndicator = '';
        if (entry.unread) {
            statusIndicator = '<span class="text-cyan-400 text-sm font-bold animate-pulse" title="Unread">●</span>';
        } else if (!entry.unlocked) {
            statusIndicator = '<span class="text-gray-600 text-xs">🔒</span>';
        }

        btn.innerHTML = `
            <div class="flex items-center gap-2 truncate">
                <span>${meta.icon}</span>
                <span class="truncate font-semibold ${entry.unlocked ? 'text-gray-200' : 'text-gray-500'}">
                    ${entry.unlocked ? entry.title : '???'}
                </span>
            </div>
            ${statusIndicator}
        `;

        btn.onclick = () => {
            selectCodexEntry(entry.id);
        };

        list.appendChild(btn);
    });
}

const CODEX_ENEMY_IMAGE_KEYS = {
    xenobot: ['enemy', 'Xenobot'],
    plasmavore: ['enemy', 'Plasmavore'],
    sand_worm: ['enemy', 'Sand Worm'],
    void_stalker: ['enemy', 'Void Stalker'],
    overlord_xylar: ['boss', 'boss_terra'],
    void_sentinel_alpha: ['boss', 'boss_derelict']
};

/**
 * Resolve an image record for a codex entry if one is available in data/imagery.js.
 * @param {Object} entry
 * @returns {{ webp: string, jpg: string, alt: string } | null}
 */
function resolveCodexImage(entry) {
    if (!entry) return null;

    let record = null;
    if (entry.category === 'locations') {
        record = locationImages[entry.id] || districtImages[entry.id] || null;
    } else if (entry.category === 'characters') {
        record = npcImages[entry.id] || null;
    } else if (entry.category === 'enemies') {
        const mapped = CODEX_ENEMY_IMAGE_KEYS[entry.id];
        if (mapped) {
            record = mapped[0] === 'boss' ? bossImages[mapped[1]] : enemyImages[mapped[1]];
        }
    }

    if (!record || !record.path) return null;
    return {
        webp: `${IMAGE_BASE}${record.path}.webp`,
        jpg: `${IMAGE_BASE}${record.path}.jpg`,
        alt: record.alt || entry.title || ''
    };
}

/**
 * Render the detail pane for the currently selected entry.
 */
function renderDetailPane() {
    const pane = document.getElementById("codexDetailPane");
    if (!pane) return;

    if (!selectedEntryId) {
        pane.innerHTML = `
            <div class="text-xs text-gray-500 font-mono text-center my-auto">
                Select an entry from the index to display archives telemetry.
            </div>
        `;
        return;
    }

    const entries = codexModule.getCodexEntries('all');
    const entry = entries.find(e => e.id === selectedEntryId);

    if (!entry) {
        pane.innerHTML = `
            <div class="text-xs text-gray-500 font-mono text-center my-auto">
                Entry record not found.
            </div>
        `;
        return;
    }

    const catMeta = CODEX_CATEGORY_META[entry.category] || { label: entry.category, icon: '📄' };

    if (entry.unlocked) {
        const imageInfo = resolveCodexImage(entry);
        const imageBlock = imageInfo ? `
            <div class="mb-3 rounded overflow-hidden border border-cyan-800/60 bg-black/40">
                <picture>
                    <source srcset="${imageInfo.webp}" type="image/webp" />
                    <img id="codexEntryImage" src="${imageInfo.jpg}" alt="${imageInfo.alt}" class="w-full max-h-48 object-cover" onerror="this.closest('div').style.display='none'" />
                </picture>
            </div>
        ` : '';

        pane.innerHTML = `
            <div class="flex justify-between items-start border-b border-cyan-900/50 pb-2 mb-3">
                <div>
                    <span class="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                        ${catMeta.icon} ${t(catMeta.label)}
                    </span>
                    <h3 class="text-xl font-bold text-cyan-300 font-mono tracking-wide mt-1.5">${entry.title}</h3>
                </div>
                <span class="text-xs text-green-400 font-mono flex items-center gap-1 bg-green-950/40 px-2 py-1 rounded border border-green-800/40">
                    <span>🔓</span> DECRYPTED
                </span>
            </div>

            ${imageBlock}

            <div class="mb-3 p-2.5 bg-cyan-950/30 rounded border-l-2 border-cyan-500 text-xs italic text-cyan-200/90 leading-relaxed font-mono">
                "${entry.summary}"
            </div>

            <div class="text-xs text-gray-300 font-mono leading-relaxed space-y-2 flex-1">
                <p>${entry.body}</p>
            </div>

            <div class="mt-4 pt-2 border-t border-cyan-900/40 text-[10px] text-cyan-600 font-mono flex justify-between">
                <span>STATUS: DECRYPTED</span>
                <span>ENTRY ID: ${entry.id}</span>
            </div>
        `;
    } else {
        pane.innerHTML = `
            <div class="flex justify-between items-start border-b border-gray-800 pb-2 mb-3">
                <div>
                    <span class="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-500">
                        ${catMeta.icon} ${t(catMeta.label)}
                    </span>
                    <h3 class="text-xl font-bold text-gray-500 font-mono tracking-wide mt-1.5">??? [ENCRYPTED FREQUENCY]</h3>
                </div>
                <span class="text-xs text-amber-500 font-mono flex items-center gap-1 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                    <span>🔒</span> ENCRYPTED
                </span>
            </div>

            <div class="mb-4 p-3 bg-red-950/20 rounded border border-red-900/40 text-xs text-red-300 font-mono">
                <div class="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 text-amber-400">
                    <span>📡</span> DECRYPTION REQUIREMENT:
                </div>
                <div class="text-gray-300 mt-1">${entry.unlockHint}</div>
            </div>

            <div class="text-xs text-gray-600 font-mono leading-relaxed italic">
                Telemetry signal corrupted or encrypted. Fulfill the decryption requirement above to decode this archive file.
            </div>

            <div class="mt-auto pt-2 border-t border-gray-800 text-[10px] text-gray-600 font-mono flex justify-between">
                <span>STATUS: ENCRYPTED</span>
                <span>ENTRY ID: ${entry.id}</span>
            </div>
        `;
    }
}

/**
 * Select a codex entry by ID and display its details.
 * Automatically marks unlocked entries as read.
 * @param {string} id - Codex entry identifier
 */
export function selectCodexEntry(id) {
    selectedEntryId = id;
    if (codexModule.isCodexUnlocked(id)) {
        codexModule.markCodexRead(id);
    }
    renderProgressBar();
    renderEntriesList();
    renderDetailPane();
}
