const { initEvents, handleEvent } = require('./systems/events.js');
const { initSettings, setDifficulty, getDifficulty } = require('./systems/settings.js');

const mockState = {
    character: { hp: 100, maxHp: 100, defense: 0 },
    currentLocation: 'terra_prime',
    log: []
};
const deps = {
    state: mockState,
    ui: { addLog: () => {}, updateUI: () => {} },
    settings: { getDifficulty, setDifficulty }
};

initSettings();
initEvents(deps);
setDifficulty('easy');

const hazardEvent = { type: 'hazard', text: 'Ouch', damage: 20 };
handleEvent(hazardEvent);

console.log('HP after hazard:', mockState.character.hp);
