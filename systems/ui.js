/**
 * UI System Module
 * Handles UI updates, notifications, logs, and quest UI
 * Aggregates sub-modules
 */

// Import Sub-modules
import { initLogger, addLog, updateMissionLog, updateCombatLog } from './ui/logger.js';
import { initQuestUI, toggleQuestLog, switchQuestTab, renderQuestList } from './ui/quest-ui.js';
import { initTravelUI, showTravelScreen, travelToLocation } from './ui/travel-ui.js';
import { initShopUI, showShop, switchShopTab, updateShopUI } from './ui/shop-ui.js';
import { initInventoryUI, updateInventory, createInventoryItemButton } from './ui/inventory-ui.js';
import { initCraftingUI, showCraftingUI, updateCraftingUI } from './ui/crafting-ui.js';
import { initSettingsUI, showSettingsModal } from './ui/settings-ui.js';
import { 
    showLevelUpNotification, hideLevelUpNotification, 
    showVictoryMessage, showSaveMessage, 
    showDialog, hideDialog 
} from './ui/notifications.js';

import { initAttributesUI, showStatsAllocationUI, closeStatsAllocationUI, allocateStat, updateAttributesBtnGlow } from './ui/attributes-ui.js';
import { initUpgrades } from './upgrades.js';
import { checkAchievement } from './achievements.js';
import { initAchievementsUI, showAchievementsUI, closeAchievementsUI } from './ui/achievements-ui.js';
import { initCompanionsUI } from './ui/companions-ui.js';
import { initCyberneticsUI } from './ui/cybernetics-ui.js';
import { getActiveCompanion } from './companions.js';
import { SKILL_TREES, hasSkill, unlockSkill } from './skills.js';

// Re-export for external use
export { 
    addLog, updateMissionLog, updateCombatLog,
    toggleQuestLog, switchQuestTab, renderQuestList,
    showTravelScreen, travelToLocation,
    showShop, switchShopTab, updateShopUI,
    updateInventory, createInventoryItemButton,
    showCraftingUI, updateCraftingUI,
    showSettingsModal,
    showLevelUpNotification, hideLevelUpNotification, 
    showVictoryMessage, showSaveMessage, 
    showDialog, hideDialog,
    showStatsAllocationUI, closeStatsAllocationUI, allocateStat,
    showAchievementsUI, closeAchievementsUI
};

import { items } from '../data/items.js';

// State object reference
let state;
let deps; // Store dependencies globally for the module
let currentOperationsTab = 'cargo';

// Render Cache
const renderCache = {
    character: {
        name: null,
        level: null,
        race: null,
        role: null,
        avatar: null
    },
    stats: {
        hp: null,
        maxHp: null,
        xp: null,
        xpToNext: null,
        credits: null,
        attack: null,
        defense: null
    },
    equipment: {
        weapon: null,
        armor: null,
        accessory: null
    },
    orders: 0
};

/**
 * Initialize the UI module with required dependencies
 */
export function initUI(dependencies) {
    // Store state object reference
    deps = dependencies;
    deps.ui = { showDialog, addLog, updateUI };
    console.log("initUI called", deps);
    state = deps.state;

    // Reset render cache
    renderCache.character = { name: null, level: null, race: null, role: null, avatar: null };
    renderCache.stats = { hp: null, maxHp: null, xp: null, xpToNext: null, credits: null, attack: null, defense: null };
    renderCache.equipment = { weapon: null, armor: null, accessory: null };
    renderCache.orders = 0;
    currentOperationsTab = 'cargo';

    // Initialize Sub-modules
    initLogger(deps, { log: { length: 0, lastEntry: null } });
    initQuestUI(deps);
    initTravelUI(deps, updateUI);
    initShopUI(deps, updateUI);
    initInventoryUI(deps, { inventory: null }, updateUI);
    initCraftingUI(deps);
    initSettingsUI(deps, showDialog);
    initAttributesUI(deps, updateUI);
    initAchievementsUI(deps);
    initCompanionsUI(deps, { updateUI, showDialog });
    initCyberneticsUI(deps);

    // Initialize Difficulty Selector (Start Screen)
    const difficultySelect = document.getElementById("difficultySelect");
    const difficultyDesc = document.getElementById("difficultyDesc");
    
    if (difficultySelect && deps.settings) {
        const currentDiff = deps.settings.getDifficulty();
        difficultySelect.value = currentDiff.id;
        if (difficultyDesc) difficultyDesc.textContent = currentDiff.description;
        
        difficultySelect.addEventListener("change", (e) => {
            const level = e.target.value;
            deps.settings.setDifficulty(level);
            
            const newDiff = deps.settings.getDifficulty();
            if (difficultyDesc) difficultyDesc.textContent = newDiff.description;
        });
    }

    // Apply initial theme
    updateTheme();
}

/**
 * Update the game theme based on current location
 */
function updateTheme() {
    document.body.classList.remove('theme-terra', 'theme-desert', 'theme-space');
    const theme = state.currentLocation && deps.data.locations[state.currentLocation]?.theme;
    if (theme) {
        document.body.classList.add(theme);
    } else {
        document.body.classList.add('theme-terra');
    }
}

/**
 * Show screen based on game state
 */
export function showScreen(screenName) {
    Object.values(deps.dom.screens).forEach(screen => {
        if (screen) screen.classList.remove("active-screen");
    });
    if (deps.dom.screens[screenName]) {
        deps.dom.screens[screenName].classList.add("active-screen");
    }
    if (screenName === 'exploring') {
        switchOperationsTab('cargo');
    }
}

/**
 * Get status effect icon
 */
export function getStatusEffectIcon(type) {
    const icons = {
        blocking: "🛡️",
        dodging: "💨",
        defenseBoost: "🔰",
        attackBoost: "⚔️",
        poison: "☠️",
        burn: "🔥",
        burning: "🔥",
        frozen: "❄️",
        electrified: "⚡",
        melted: "🧪",
        broken: "💥",
        stunned: "✨",
        defenseBreak: "⚠️"
    };
    return icons[type] || "✨";
}

/**
 * Update UI with current character stats
 * Optimized to only update changed elements
 */
export function updateUI() {
    if (!state.character) return;

    checkAchievement("level");
    checkAchievement("credits");

    updateTheme();
    updateCharacterInfo();
    updateStats();
    updateBars();
    
    // Sub-module updates
    updateInventory();
    updateShopUI();
    updatePendingOrders();
    updateMissionLog();
    updateEquipment();
    updateLocationDisplay();
    updateAttributesBtnGlow();
    
    const craftingModal = document.getElementById('craftingModal');
    if (craftingModal) {
        updateCraftingUI();
    }

    const crewPanel = document.getElementById('shipCrewPanel');
    if (crewPanel && !crewPanel.classList.contains('hidden') && crewPanel.style.display !== 'none') {
        import('./ui/companions-ui.js').then(m => m.renderCompanionsTab());
    }
    
    const cyberPanel = document.getElementById('shipCyberneticsPanel');
    if (cyberPanel && !cyberPanel.classList.contains('hidden') && cyberPanel.style.display !== 'none') {
        import('./ui/cybernetics-ui.js').then(m => m.renderCyberneticsTab());
    }
    
    // Update active operations tab if needed
    if (currentOperationsTab === 'crew') {
        updateQuickCrewPanel();
    }

    // Update Derelict UI if active
    if (state.gameState === "derelict" && state.derelict) {
        updateDerelictUI();
    }
}

function updateDerelictUI() {
    const oxText = document.getElementById('derelictOxygenText');
    const oxBar = document.getElementById('derelictOxygenBar');
    const roomsText = document.getElementById('derelictRoomsText');
    const lootList = document.getElementById('derelictLootList');
    const mapContainer = document.getElementById('derelictMapContainer');

    if (oxText && state.derelict) {
        oxText.textContent = `${state.derelict.oxygen}/${state.derelict.maxOxygen}`;
        const pct = (state.derelict.oxygen / state.derelict.maxOxygen) * 100;
        oxBar.style.width = `${pct}%`;
        
        if (pct <= 25) {
            oxBar.classList.replace('bg-cyan-500', 'bg-red-500');
            oxText.classList.replace('text-cyan-400', 'text-red-500');
            oxText.classList.add('animate-pulse');
        } else {
            oxBar.classList.replace('bg-red-500', 'bg-cyan-500');
            oxText.classList.replace('text-red-500', 'text-cyan-400');
            oxText.classList.remove('animate-pulse');
        }
        
        roomsText.textContent = state.derelict.roomsExplored;
        
        // Render Map
        if (mapContainer) {
            mapContainer.innerHTML = '';
            const currentRoom = state.derelict.roomsExplored;
            const startNode = Math.max(0, currentRoom - 2);
            const endNode = startNode + 4;
            
            for (let i = startNode; i <= endNode; i++) {
                if (i > startNode) {
                    const line = document.createElement('div');
                    line.className = `h-0.5 w-6 border-t-2 border-dashed ${i <= currentRoom ? 'border-red-500' : 'border-gray-700'}`;
                    mapContainer.appendChild(line);
                }
                
                const node = document.createElement('div');
                node.className = `w-12 h-12 rounded-full border-2 flex flex-col justify-center items-center font-mono text-sm relative ${
                    i === currentRoom
                        ? 'border-red-500 bg-red-950/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                        : i < currentRoom
                            ? 'border-gray-500 bg-gray-800 text-gray-400'
                            : 'border-gray-800 bg-black text-gray-700'
                }`;
                
                if (i === 0) {
                    node.innerHTML = '🚪<span class="text-[9px] absolute -bottom-5 text-gray-400 font-bold">Airlock</span>';
                } else if (i === currentRoom) {
                    node.innerHTML = '👤<span class="text-[9px] absolute -bottom-5 text-red-400 font-bold">You</span>';
                } else if (i < currentRoom) {
                    node.innerHTML = `🛡️<span class="text-[9px] absolute -bottom-5 text-gray-500 font-bold font-mono">Room ${i}</span>`;
                } else {
                    node.innerHTML = `?<span class="text-[9px] absolute -bottom-5 text-gray-700 font-bold font-mono">Room ${i}</span>`;
                }
                
                mapContainer.appendChild(node);
            }
        }
        
        // Render Loot
        if (lootList) {
            lootList.innerHTML = '';
            if (state.derelict.currentLoot.length === 0) {
                lootList.innerHTML = '<span class="text-gray-500 italic">No cargo secured yet.</span>';
            } else {
                state.derelict.currentLoot.forEach(item => {
                    const span = document.createElement('span');
                    span.className = 'bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-600';
                    span.textContent = item;
                    lootList.appendChild(span);
                });
            }
        }
    }
}

function updateLocationDisplay() {
    const display = document.getElementById("currentLocationDisplay");
    if (display && state.currentLocation && deps.data.locations[state.currentLocation]) {
        display.textContent = deps.data.locations[state.currentLocation].name;
    }
}

function updateCharacterInfo() {
    const char = state.character;
    const elements = deps.dom.elements;
    
    if (renderCache.character.name !== char.name) {
        if (elements.characterName) elements.characterName.textContent = char.name;
        renderCache.character.name = char.name;
    }
    
    if (renderCache.character.level !== char.level) {
        if (elements.characterLevel) elements.characterLevel.textContent = char.level;
        renderCache.character.level = char.level;
    }
    
    const getCharacterAvatar = deps.character.getCharacterAvatar;
    const avatar = getCharacterAvatar(char.race, char.role);
    if (renderCache.character.avatar !== avatar) {
        if (elements.characterAvatar) elements.characterAvatar.textContent = avatar;
        renderCache.character.avatar = avatar;
    }
    
    const raceRole = `${char.race} ${char.role}`;
    if (renderCache.character.raceRole !== raceRole) {
        if (elements.characterRaceRole) elements.characterRaceRole.textContent = raceRole;
        renderCache.character.raceRole = raceRole;
    }
    
    // Update SP & Attribute Points
    const spEl = document.getElementById("characterSkillPoints");
    if (spEl) {
        const skillPts = char.skillPoints || 0;
        const statPts = char.statPoints || 0;
        let text = `SP: ${skillPts}`;
        if (statPts > 0) {
            text += ` | Attribute Points: ${statPts}`;
        }
        spEl.textContent = text;
    }
}

function updateStats() {
    const char = state.character;
    const elements = deps.dom.elements;
    const stats = deps.equipment.getEffectiveStats();
    
    // HP
    if (renderCache.stats.hp !== char.hp) {
        if (elements.characterHp) elements.characterHp.textContent = char.hp;
        renderCache.stats.hp = char.hp;
    }
    if (renderCache.stats.maxHp !== char.maxHp) {
        if (elements.characterMaxHp) elements.characterMaxHp.textContent = char.maxHp;
        renderCache.stats.maxHp = char.maxHp;
    }

    // Energy
    if (elements.characterEnergy && renderCache.stats.energy !== char.energy) {
        elements.characterEnergy.textContent = char.energy;
        renderCache.stats.energy = char.energy;
    }
    if (elements.characterMaxEnergy && renderCache.stats.maxEnergy !== char.maxEnergy) {
        elements.characterMaxEnergy.textContent = char.maxEnergy;
        renderCache.stats.maxEnergy = char.maxEnergy;
    }
    
    // XP
    if (renderCache.stats.xp !== char.xp) {
        if (elements.characterXp) elements.characterXp.textContent = char.xp;
        renderCache.stats.xp = char.xp;
    }
    
    const xpToNext = char.level * 100;
    if (renderCache.stats.xpToNext !== xpToNext) {
        if (elements.characterXpToNext) elements.characterXpToNext.textContent = xpToNext;
        renderCache.stats.xpToNext = xpToNext;
    }
    
    // Credits
    if (renderCache.stats.credits !== char.credits) {
        if (elements.characterCredits) elements.characterCredits.textContent = char.credits || 0;
        renderCache.stats.credits = char.credits;
    }
    
    // Effective Stats
    if (renderCache.stats.attack !== stats.attack) {
        if (elements.characterAtk) elements.characterAtk.textContent = stats.attack;
        renderCache.stats.attack = stats.attack;
    }
    if (renderCache.stats.defense !== stats.defense) {
        if (elements.characterDef) elements.characterDef.textContent = stats.defense;
        renderCache.stats.defense = stats.defense;
    }
}

function updateBars() {
    const char = state.character;
    const xpToNext = char.level * 100;
    
    const xpPercentage = (char.xp / xpToNext) * 100;
    const xpBar = document.getElementById("xpBar");
    if (xpBar) xpBar.style.width = `${xpPercentage}%`;

    const hpPercentage = (char.hp / char.maxHp) * 100;
    const hpBar = document.getElementById("hpBar");
    if (hpBar) hpBar.style.width = `${hpPercentage}%`;
}

function styleEquipmentSlot(elementId, itemName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (!itemName) {
        el.textContent = "Empty";
        el.className = "text-gray-500 font-bold";
        return;
    }
    
    el.textContent = itemName;
    const item = items[itemName];
    if (item && item.rarity) {
        if (item.rarity === "Rare") {
            el.className = "text-blue-400 font-bold";
        } else if (item.rarity === "Epic") {
            el.className = "text-purple-400 font-bold";
        } else if (item.rarity === "Legendary") {
            el.className = "text-yellow-500 font-bold";
        } else {
            el.className = "text-gray-200 font-bold";
        }
    } else {
        el.className = "text-gray-200 font-bold";
    }
}

function updateEquipment() {
    if (!state.character || !state.character.equipment) return;
    
    const equip = state.character.equipment;
    
    if (renderCache.equipment.weapon !== equip.weapon) {
        styleEquipmentSlot("equipWeapon", equip.weapon);
        renderCache.equipment.weapon = equip.weapon;
    }
    
    if (renderCache.equipment.armor !== equip.armor) {
        styleEquipmentSlot("equipArmor", equip.armor);
        renderCache.equipment.armor = equip.armor;
    }
    
    if (renderCache.equipment.accessory !== equip.accessory) {
        styleEquipmentSlot("equipAccessory", equip.accessory);
        renderCache.equipment.accessory = equip.accessory;
    }
}

function updatePendingOrders() {
    if (!state.character) return; // Guard clause
    const pendingCount = state.character.pendingOrders?.length || 0;
    if (renderCache.orders !== pendingCount) {
        const pendingOrdersEl = document.getElementById("characterPendingOrders");
        if (pendingOrdersEl) {
            pendingOrdersEl.textContent = pendingCount;
        }
        renderCache.orders = pendingCount;
    }
}

/**
 * Start the game
 */
export function startGame() {
    if (!state) {
        console.error("State is undefined in startGame!");
        return;
    }
    state.gameState = "characterCreation";
    showScreen("creation");
}

/**
 * Show the Skills Modal
 */
export function showSkillsUI() {
    const modal = document.getElementById('skillsModal');
    if (modal) {
        renderSkillTree();
        modal.classList.remove('hidden');
    }
}

/**
 * Close the Skills Modal
 */
export function closeSkillsUI() {
    const modal = document.getElementById('skillsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Render the Skill Tree
 */
export function renderSkillTree() {
    if (!state.character) return;
    
    const role = state.character.role;
    const tree = SKILL_TREES[role];
    
    const container = document.getElementById('skillTreeContainer');
    const spDisplay = document.getElementById('skillsSpDisplay');
    const roleDesc = document.getElementById('skillsRoleDesc');
    
    if (!container || !tree) return;
    
    spDisplay.textContent = state.character.skillPoints || 0;
    if (roleDesc) roleDesc.textContent = `${role} Talents`;
    
    container.innerHTML = '';
    
    tree.forEach(skill => {
        const isUnlocked = hasSkill(skill.id);
        const canUnlock = !isUnlocked && (!skill.requires || hasSkill(skill.requires));
        const lackSp = state.character.skillPoints < skill.cost;
        
        let statusClass = "border-gray-600 bg-gray-800 opacity-50";
        if (isUnlocked) statusClass = "border-green-500 bg-green-900/40";
        else if (canUnlock && !lackSp) statusClass = "border-yellow-500 bg-yellow-900/40 cursor-pointer hover:bg-yellow-800/60";
        else if (canUnlock && lackSp) statusClass = "border-red-500 bg-red-900/20";
        
        const node = document.createElement('div');
        node.className = `p-4 border-2 rounded-lg transition-all flex items-start gap-4 ${statusClass}`;
        
        node.innerHTML = `
            <div class="text-4xl">${skill.icon}</div>
            <div class="flex-grow">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-bold ${isUnlocked ? 'text-green-400' : 'text-blue-300'}">${skill.name}</h3>
                    <span class="text-sm font-bold ${isUnlocked ? 'text-green-400' : 'text-yellow-400'}">${isUnlocked ? 'UNLOCKED' : `Cost: ${skill.cost} SP`}</span>
                </div>
                <p class="text-sm text-gray-300 mt-1">${skill.description}</p>
                ${skill.requires && !hasSkill(skill.requires) ? `<p class="text-xs text-red-400 mt-1">Requires previous tier skill.</p>` : ''}
            </div>
        `;
        
        if (canUnlock && !lackSp) {
            node.onclick = () => {
                const res = unlockSkill(skill.id);
                if (res.success) {
                    renderSkillTree();
                    updateUI();
                } else {
                    addLog(res.message);
                }
            };
        }
        
        container.appendChild(node);
    });
}

/**
 * Show Ship Hub UI
 */
export function showShipUI() {
    const modal = document.getElementById('shipHubModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        if (window.switchShipTab) {
            window.switchShipTab('systems');
        } else {
            renderShipModules();
        }
    }
}

/**
 * Close Ship Hub UI
 */
export function closeShipUI() {
    const modal = document.getElementById('shipHubModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

/**
 * Render Ship Modules
 */
export async function renderShipModules() {
    if (!state.character || !state.character.ship) return;
    
    const shipModule = await import('./ship.js');
    const modules = shipModule.shipModules;
    const getUpgradeCost = shipModule.getUpgradeCost;
    const canAffordUpgrade = shipModule.canAffordUpgrade;
    
    const container = document.getElementById('shipModulesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(modules).forEach(mod => {
        const currentLevel = state.character.ship[mod.id + 'Level'];
        const isMaxLevel = currentLevel >= mod.maxLevel;
        const cost = getUpgradeCost(mod.id, currentLevel);
        const canAfford = cost ? canAffordUpgrade(cost) : false;
        
        let costHtml = '';
        if (!isMaxLevel && cost) {
            costHtml = `<div class="text-xs mt-2 text-yellow-400">Upgrade Cost: ${cost.credits} Credits`;
            if (Object.keys(cost.materials).length > 0) {
                costHtml += `, ${Object.entries(cost.materials).map(([k, v]) => `${v}x ${k}`).join(', ')}`;
            }
            costHtml += `</div>`;
        }
        
        const node = document.createElement('div');
        node.className = `p-4 border border-cyan-800 rounded bg-slate-900/50 mb-2`;
        
        let buttonHtml = '';
        if (isMaxLevel) {
            buttonHtml = `<button class="px-4 py-1 bg-gray-600 text-gray-300 rounded cursor-not-allowed text-xs font-bold" disabled>MAX LEVEL</button>`;
        } else {
            const btnClass = canAfford 
                ? "bg-cyan-600 hover:bg-cyan-500 text-white" 
                : "bg-gray-600 text-gray-400 cursor-not-allowed";
            buttonHtml = `<button class="px-4 py-1 rounded text-xs font-bold transition-colors ${btnClass}" ${!canAfford ? 'disabled' : ''}>UPGRADE</button>`;
        }
        
        node.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-bold text-cyan-300 text-lg">${mod.name} <span class="text-sm text-cyan-600">LVL ${currentLevel}</span></h3>
                    <p class="text-gray-400 mt-1">${mod.descriptions[currentLevel] || mod.descriptions[mod.descriptions.length - 1]}</p>
                    ${costHtml}
                </div>
                <div>
                    ${buttonHtml}
                </div>
            </div>
        `;
        
        if (!isMaxLevel && canAfford) {
            const btn = node.querySelector('button');
            btn.onclick = () => {
                if (shipModule.upgradeModule(mod.id)) {
                    renderShipModules();
                }
            };
        }
        
        container.appendChild(node);
    });

    // Render Planetary Travel Navigation Card
    const engineLevel = state.character.ship.engineLevel || 1;
    let reachText = "local system nodes (Terra Prime, Norkon Outpost)";
    if (engineLevel === 2) {
        reachText = "outer star systems (Xylo Delta)";
    } else if (engineLevel >= 3) {
        reachText = "deep space anomalies (Nebula Outpost)";
    }

    const navNode = document.createElement('div');
    navNode.className = `p-4 border border-cyan-800 rounded bg-slate-900/50 mb-2 mt-4`;
    navNode.innerHTML = `
        <div class="flex justify-between items-start flex-col sm:flex-row gap-4">
            <div>
                <h3 class="font-bold text-cyan-300 text-lg">🌌 Sector Navigation Map</h3>
                <p class="text-gray-400 mt-1">Initiate planetary transit. Current engines allow travel to ${reachText}.</p>
            </div>
            <div class="flex items-center sm:self-center">
                <button onclick="import('./systems/ui.js').then((m) => { m.closeShipUI(); m.showTravelScreen(); })" 
                        class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)] whitespace-nowrap">
                    LAUNCH MAP
                </button>
            </div>
        </div>
    `;
    container.appendChild(navNode);
}

/**
 * Play Travel Animation
 */
export function playTravelAnimation(callback) {
    const overlay = document.getElementById('travelAnimationOverlay');
    if (!overlay) {
        if (callback) callback();
        return;
    }
    
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    
    // Play for 2 seconds
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        if (callback) callback();
    }, 2000);
}

/**
 * Show Derelict Screen
 */
export function showDerelictScreen() {
    showScreen("derelict");
    updateDerelictUI();
}

/**
 * Switch between Ship Systems and Crew Quarter tabs inside Ship Hub Modal
 */
export function switchShipTab(tab) {
    const tabSystems = document.getElementById('tabShipSystems');
    const tabCrew = document.getElementById('tabCrewQuarter');
    const tabCybernetics = document.getElementById('tabCybernetics');
    const systemsPanel = document.getElementById('shipSystemsPanel');
    const crewPanel = document.getElementById('shipCrewPanel');
    const cyberneticsPanel = document.getElementById('shipCyberneticsPanel');
    
    if (!tabSystems || !tabCrew || !tabCybernetics || !systemsPanel || !crewPanel || !cyberneticsPanel) return;
    
    if (tab === 'systems') {
        tabSystems.className = "py-2 px-4 border-b-2 border-cyan-500 text-cyan-400 font-bold transition-all text-sm";
        tabCrew.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        tabCybernetics.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        systemsPanel.classList.remove('hidden');
        systemsPanel.style.display = 'block';
        crewPanel.classList.add('hidden');
        crewPanel.style.display = 'none';
        cyberneticsPanel.classList.add('hidden');
        cyberneticsPanel.style.display = 'none';
        renderShipModules();
    } else if (tab === 'crew') {
        tabCrew.className = "py-2 px-4 border-b-2 border-cyan-500 text-cyan-400 font-bold transition-all text-sm";
        tabSystems.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        tabCybernetics.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        crewPanel.classList.remove('hidden');
        crewPanel.style.display = 'block';
        systemsPanel.classList.add('hidden');
        systemsPanel.style.display = 'none';
        cyberneticsPanel.classList.add('hidden');
        cyberneticsPanel.style.display = 'none';
        import('./ui/companions-ui.js').then(m => m.renderCompanionsTab());
    } else if (tab === 'cybernetics') {
        tabCybernetics.className = "py-2 px-4 border-b-2 border-cyan-500 text-cyan-400 font-bold transition-all text-sm";
        tabSystems.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        tabCrew.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all text-sm";
        cyberneticsPanel.classList.remove('hidden');
        cyberneticsPanel.style.display = 'block';
        systemsPanel.classList.add('hidden');
        systemsPanel.style.display = 'none';
        crewPanel.classList.add('hidden');
        crewPanel.style.display = 'none';
        import('./ui/cybernetics-ui.js').then(m => m.renderCyberneticsTab());
    }
}

/**
 * Switch between Cargo & Gear and Crew & Skills tabs in the exploring screen
 */
export function switchOperationsTab(tab) {
    currentOperationsTab = tab;
    const tabCargo = document.getElementById('tabCargoGear');
    const tabCrew = document.getElementById('tabCrewSkills');
    const panelCargo = document.getElementById('panelCargoGear');
    const panelCrew = document.getElementById('panelCrewSkills');
    
    if (tab === 'cargo') {
        if (tabCargo) {
            tabCargo.className = "py-1 px-3 border-b-2 border-cyan-500 text-cyan-400 font-bold transition-all";
        }
        if (tabCrew) {
            tabCrew.className = "py-1 px-3 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all";
        }
        if (panelCargo) {
            panelCargo.classList.remove('hidden');
            panelCargo.style.display = 'flex';
        }
        if (panelCrew) {
            panelCrew.classList.add('hidden');
            panelCrew.style.display = 'none';
        }
    } else if (tab === 'crew') {
        if (tabCargo) {
            tabCargo.className = "py-1 px-3 border-b-2 border-transparent text-gray-400 hover:text-gray-300 font-bold transition-all";
        }
        if (tabCrew) {
            tabCrew.className = "py-1 px-3 border-b-2 border-cyan-500 text-cyan-400 font-bold transition-all";
        }
        if (panelCargo) {
            panelCargo.classList.add('hidden');
            panelCargo.style.display = 'none';
        }
        if (panelCrew) {
            panelCrew.classList.remove('hidden');
            panelCrew.style.display = 'flex';
        }
        updateQuickCrewPanel();
    }
}

/**
 * Update quick status info for active crew and unlocked passive subroutines
 */
export function updateQuickCrewPanel() {
    if (!state || !state.character) return;
    
    // 1. Update companion UI
    const activeCompanion = getActiveCompanion();
    const avatarEl = document.getElementById('quickCompanionAvatar');
    const nameEl = document.getElementById('quickCompanionName');
    const levelEl = document.getElementById('quickCompanionLevel');
    const skillEl = document.getElementById('quickCompanionSkill');
    
    if (avatarEl && nameEl && levelEl && skillEl) {
        if (activeCompanion) {
            avatarEl.textContent = activeCompanion.avatar || "👤";
            nameEl.textContent = `${activeCompanion.name} - ${activeCompanion.role}`;
            levelEl.textContent = `LVL ${activeCompanion.level} (${activeCompanion.trust} Trust)`;
            skillEl.textContent = `Ability: ${activeCompanion.abilityName} - ${activeCompanion.abilityDesc}`;
        } else {
            avatarEl.textContent = "👤";
            nameEl.textContent = "No active crew deployed";
            levelEl.textContent = "";
            skillEl.textContent = "Deploy a companion in the Ship Hub to receive assistance.";
        }
    }
    
    // 2. Update skills list
    const skillsListEl = document.getElementById('quickSkillsList');
    if (skillsListEl) {
        skillsListEl.innerHTML = '';
        const role = state.character.role;
        const tree = SKILL_TREES[role] || [];
        
        let hasAnySkill = false;
        tree.forEach(skill => {
            if (hasSkill(skill.id)) {
                hasAnySkill = true;
                const item = document.createElement('div');
                item.className = "bg-cyan-950/30 border border-cyan-900/50 p-2 rounded flex items-center gap-2";
                item.innerHTML = `
                    <span class="text-base">${skill.icon || '✨'}</span>
                    <div class="min-w-0 flex-grow">
                        <div class="font-bold text-cyan-400 truncate text-[11px]">${skill.name}</div>
                        <div class="text-[9px] text-gray-400 truncate" title="${skill.description}">${skill.description}</div>
                    </div>
                `;
                skillsListEl.appendChild(item);
            }
        });
        
        if (!hasAnySkill) {
            skillsListEl.innerHTML = `
                <div class="col-span-2 text-center text-gray-600 py-4 italic text-[11px]">
                    No passive subroutines unlocked yet.
                </div>
            `;
        }
    }
}
