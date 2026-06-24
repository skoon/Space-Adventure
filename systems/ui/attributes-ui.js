let state;
let addLog, updateUI;

export function initAttributesUI(deps, uiUpdateFn) {
    state = deps.state;
    
    // In ui.js integration, logger adds are exposed under ui submodules or main deps
    if (deps.ui) addLog = deps.ui.addLog;
    else if (deps.addLog) addLog = deps.addLog;
    
    updateUI = uiUpdateFn || deps.updateUI;
}

export function showStatsAllocationUI() {
    const modal = document.getElementById("attributesModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    refreshAttributesUI();
}

export function closeStatsAllocationUI() {
    const modal = document.getElementById("attributesModal");
    if (modal) {
        modal.classList.add("hidden");
    }
    if (updateUI) updateUI();
}

export function allocateStat(statName) {
    if (!state.character) return false;

    const isNarrative = ['strength', 'agility', 'intelligence', 'charisma'].includes(statName);
    const pointsPool = isNarrative ? 'narrativePoints' : 'statPoints';

    if (!state.character[pointsPool] || state.character[pointsPool] <= 0) {
        if (addLog) addLog("❌ No attribute points available!");
        return false;
    }

    if (statName === 'maxHp') {
        state.character.maxHp += 5;
        state.character.hp += 5;
        if (addLog) addLog("❤️ Allocated 1 point to Health Points (+5 Max HP).");
    } else if (statName === 'maxEnergy') {
        state.character.maxEnergy += 5;
        state.character.energy += 5;
        if (addLog) addLog("⚡ Allocated 1 point to Energy (+5 Max Energy).");
    } else if (statName === 'attack') {
        state.character.attack += 1;
        if (addLog) addLog("⚔️ Allocated 1 point to Attack (+1 ATK).");
    } else if (statName === 'defense') {
        state.character.defense += 1;
        if (addLog) addLog("🛡️ Allocated 1 point to Defense (+1 DEF).");
    } else if (statName === 'strength') {
        state.character.strength = (state.character.strength || 0) + 1;
        if (addLog) addLog("💪 Allocated 1 point to Strength (+1 STR).");
    } else if (statName === 'agility') {
        state.character.agility = (state.character.agility || 0) + 1;
        if (addLog) addLog("🏃 Allocated 1 point to Agility (+1 AGI).");
    } else if (statName === 'intelligence') {
        state.character.intelligence = (state.character.intelligence || 0) + 1;
        if (addLog) addLog("🧠 Allocated 1 point to Intelligence (+1 INT).");
    } else if (statName === 'charisma') {
        state.character.charisma = (state.character.charisma || 0) + 1;
        if (addLog) addLog("🗣️ Allocated 1 point to Charisma (+1 CHA).");
    } else {
        return false;
    }

    state.character[pointsPool] -= 1;
    refreshAttributesUI();
    if (updateUI) updateUI();
    return true;
}

function refreshAttributesUI() {
    if (!state.character) return;

    const pointsDisplay = document.getElementById("attributesPointsDisplay");
    if (pointsDisplay) {
        pointsDisplay.textContent = state.character.statPoints || 0;
    }

    const narrativePointsDisplay = document.getElementById("attributesNarrativePointsDisplay");
    if (narrativePointsDisplay) {
        narrativePointsDisplay.textContent = state.character.narrativePoints || 0;
    }

    // Update current values in modal
    const currentHp = document.getElementById("allocCurrentMaxHp");
    if (currentHp) currentHp.textContent = state.character.maxHp;

    const currentEnergy = document.getElementById("allocCurrentMaxEnergy");
    if (currentEnergy) currentEnergy.textContent = state.character.maxEnergy;

    const currentAttack = document.getElementById("allocCurrentAttack");
    if (currentAttack) currentAttack.textContent = state.character.attack;

    const currentDefense = document.getElementById("allocCurrentDefense");
    if (currentDefense) currentDefense.textContent = state.character.defense;

    // Narrative Values
    const currentStr = document.getElementById("allocCurrentStrength");
    if (currentStr) currentStr.textContent = state.character.strength || 0;

    const currentAgi = document.getElementById("allocCurrentAgility");
    if (currentAgi) currentAgi.textContent = state.character.agility || 0;

    const currentInt = document.getElementById("allocCurrentIntelligence");
    if (currentInt) currentInt.textContent = state.character.intelligence || 0;

    const currentCha = document.getElementById("allocCurrentCharisma");
    if (currentCha) currentCha.textContent = state.character.charisma || 0;

    // Recommendations based on class role
    const recDisplay = document.getElementById("attributesRoleRecommendation");
    if (recDisplay) {
        const role = state.character.role || "Warrior";
        let recommendation = "";
        if (role === "Warrior") {
            recommendation = "💡 <strong>Warrior Recommendation:</strong> Focus on <strong>Attack (ATK)</strong> and <strong>Strength (STR)</strong> for heavy melee power, and <strong>Health (HP)</strong> for survivability.";
        } else if (role === "Rogue") {
            recommendation = "💡 <strong>Rogue Recommendation:</strong> Focus heavily on <strong>Attack (ATK)</strong> and <strong>Agility (AGI)</strong> for speed, critical hits, and stealth checks.";
        } else if (role === "Scientist") {
            recommendation = "💡 <strong>Scientist Recommendation:</strong> Focus on <strong>Defense (DEF)</strong>, <strong>Energy</strong>, and <strong>Intelligence (INT)</strong> to enhance tech hacking and calculations.";
        } else {
            recommendation = "💡 <strong>Recommendation:</strong> Balance your points to align with your active class playstyle.";
        }
        recDisplay.innerHTML = recommendation;
    }

    updateAttributesBtnGlow();
}

export function updateAttributesBtnGlow() {
    const btn = document.getElementById("attributesBtn");
    if (!btn || !state.character) return;

    const combatPoints = state.character.statPoints || 0;
    const narrativePoints = state.character.narrativePoints || 0;
    const totalPoints = combatPoints + narrativePoints;

    if (totalPoints > 0) {
        btn.classList.add("shadow-[0_0_15px_rgba(20,184,166,0.85)]", "border-teal-400");
        btn.innerHTML = `📊 Attributes <span class="bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded-full ml-1 animate-pulse">${totalPoints}</span>`;
    } else {
        btn.classList.remove("shadow-[0_0_15px_rgba(20,184,166,0.85)]", "border-teal-400");
        btn.innerHTML = `📊 Attributes`;
    }
}
