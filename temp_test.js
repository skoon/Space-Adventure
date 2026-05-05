const { initEvents, handleEvent } = require('./systems/events.js');
const { initSettings, setDifficulty, getDifficulty } = require('./systems/settings.js');

const mockState = {
    character: { hp: 100, maxHp: 100, defense: 0 },
    currentLocation: 'terra_prime',
    log: []
};
const deps = {
    state: mockState,
    ui: { addLog: console.log, updateUI: () => {} },
    settings: { getDifficulty, setDifficulty }
};

initSettings();
initEvents(deps);
setDifficulty('easy');

console.log("Difficulty from deps: ", deps.settings.getDifficulty());

const hazardEvent = { type: 'hazard', text: 'Ouch', damage: 20 };
console.log("Before hp: ", mockState.character.hp);
try {
    handleEvent(hazardEvent);
} catch (e) {
    console.error("Error during handleEvent:", e);
}
console.log("After hp: ", mockState.character.hp);
