import { HUD, initUI, updateUI } from '../../systems/ui.js';

describe('HUD System', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div id="hud-container" class="hud-container">
        <div class="hud-panel">
          <div class="hud-bar-wrapper">
            <div class="hud-bar-label">
              <span data-term="hudHull">Hull</span>
              <span id="hud-health-text"></span>
            </div>
            <div class="hud-bar-track">
              <div class="hud-bar-fill health" id="hud-health-fill"></div>
            </div>
          </div>
        </div>
        <div class="hud-panel">
          <div class="hud-bar-wrapper">
            <div class="hud-bar-label">
              <span data-term="hudEnergy">Energy</span>
              <span id="hud-energy-text"></span>
            </div>
            <div class="hud-bar-track">
              <div class="hud-bar-fill energy" id="hud-energy-fill"></div>
            </div>
          </div>
        </div>
        <div class="hud-panel">
          <div class="hud-bar-wrapper">
            <div class="hud-bar-label">
              <span data-term="hudXp">XP</span>
              <span id="hud-xp-text"></span>
            </div>
            <div class="hud-bar-track">
              <div class="hud-bar-fill xp" id="hud-xp-fill"></div>
            </div>
          </div>
        </div>
        <div class="hud-alerts" id="hud-alerts"></div>
      </div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('HUD renders health, energy, and XP values correctly', () => {
    const character = {
      hp: 80,
      maxHp: 100,
      energy: 50,
      maxEnergy: 100,
      xp: 200,
      xpToNext: 500,
      alerts: ['WARNING: RADIATION DETECTED']
    };

    HUD.update(character);

    const healthFill = document.getElementById('hud-health-fill');
    const healthText = document.getElementById('hud-health-text');
    const energyFill = document.getElementById('hud-energy-fill');
    const energyText = document.getElementById('hud-energy-text');
    const xpFill = document.getElementById('hud-xp-fill');
    const xpText = document.getElementById('hud-xp-text');
    const alertsBox = document.getElementById('hud-alerts');

    expect(healthFill.style.width).toBe('80%');
    expect(healthText.textContent).toBe('80 / 100');
    expect(energyFill.style.width).toBe('50%');
    expect(energyText.textContent).toBe('50 / 100');
    expect(xpFill.style.width).toBe('40%');
    expect(xpText.textContent).toBe('200 / 500');
    expect(alertsBox.textContent).toContain('WARNING: RADIATION DETECTED');
    expect(alertsBox.classList.contains('active')).toBe(true);
  });

  test('HUD handles 0 HP and clamps correctly to 0%', () => {
    const character = {
      hp: 0,
      maxHp: 100,
      energy: 50,
      maxEnergy: 100,
      level: 1,
      xp: 0
    };

    HUD.update(character);

    const healthFill = document.getElementById('hud-health-fill');
    const healthText = document.getElementById('hud-health-text');

    expect(healthFill.style.width).toBe('0%');
    expect(healthText.textContent).toBe('0 / 100');
  });

  test('HUD clamps energy over max to 100%', () => {
    const character = {
      hp: 100,
      maxHp: 100,
      energy: 150,
      maxEnergy: 100,
      level: 1,
      xp: 0
    };

    HUD.update(character);

    const energyFill = document.getElementById('hud-energy-fill');
    const energyText = document.getElementById('hud-energy-text');

    expect(energyFill.style.width).toBe('100%');
    expect(energyText.textContent).toBe('150 / 100');
  });

  test('HUD derives xpToNext from character.level * 100 when xpToNext is omitted', () => {
    const character = {
      hp: 100,
      maxHp: 100,
      energy: 50,
      maxEnergy: 100,
      level: 2,
      xp: 100
    };

    HUD.update(character);

    const xpFill = document.getElementById('hud-xp-fill');
    const xpText = document.getElementById('hud-xp-text');

    // level 2 * 100 = 200 xpToNext; 100 / 200 = 50%
    expect(xpFill.style.width).toBe('50%');
    expect(xpText.textContent).toBe('100 / 200');
  });

  test('HUD removes active class when alerts array is empty or absent', () => {
    const alertsBox = document.getElementById('hud-alerts');
    alertsBox.classList.add('active');
    alertsBox.textContent = 'STALE ALERT';

    const character = {
      hp: 100,
      maxHp: 100,
      alerts: []
    };

    HUD.update(character);

    expect(alertsBox.textContent).toBe('');
    expect(alertsBox.classList.contains('active')).toBe(false);
  });

  test('HUD handles undefined or null character gracefully without error', () => {
    expect(() => HUD.update(null)).not.toThrow();
    expect(() => HUD.update(undefined)).not.toThrow();
  });

  test('updateUI drives the HUD and updates DOM elements from state.character', () => {
    const mockState = {
      character: {
        name: 'Commander Shepard',
        level: 3,
        hp: 75,
        maxHp: 150,
        energy: 40,
        maxEnergy: 80,
        xp: 150,
        credits: 500,
        race: 'Human',
        role: 'Warrior',
        equipment: { weapon: null, armor: null, accessory: null },
        pendingOrders: [],
        alerts: ['DEFENSE GRID COMPROMISED']
      },
      inventory: [],
      log: [],
      currentLocation: 'terra_prime'
    };

    const mockData = {
      items: {},
      quests: {},
      locations: {
        terra_prime: { theme: 'theme-terra' }
      }
    };

    const domElements = {
      characterName: document.createElement('div'),
      characterLevel: document.createElement('div'),
      characterHp: document.createElement('div'),
      characterMaxHp: document.createElement('div'),
      characterEnergy: document.createElement('div'),
      characterMaxEnergy: document.createElement('div'),
      characterCredits: document.createElement('div'),
      characterAtk: document.createElement('div'),
      characterDef: document.createElement('div'),
      characterXp: document.createElement('div'),
      characterXpToNext: document.createElement('div'),
      characterAvatar: document.createElement('div'),
      characterRaceRole: document.createElement('div'),
    };

    const mockDeps = {
      state: mockState,
      data: mockData,
      dom: {
        screens: {},
        elements: domElements,
        inventoryElement: document.createElement('div'),
        missionLogElement: document.createElement('div'),
        combatElements: {}
      },
      equipment: {
        getEffectiveStats: jest.fn().mockReturnValue({ attack: 15, defense: 10 })
      },
      character: {
        getCharacterAvatar: jest.fn().mockReturnValue('🛡️')
      },
      shop: {
        getItemPrice: jest.fn(),
        getItemSellPrice: jest.fn(),
        buyItem: jest.fn(),
        sellItem: jest.fn(),
        orderItem: jest.fn()
      },
      settings: {
        getDifficulty: jest.fn().mockReturnValue({ id: 'normal', description: 'Normal' }),
        setDifficulty: jest.fn()
      }
    };

    initUI(mockDeps);
    updateUI();

    const healthFill = document.getElementById('hud-health-fill');
    const healthText = document.getElementById('hud-health-text');
    const energyFill = document.getElementById('hud-energy-fill');
    const energyText = document.getElementById('hud-energy-text');
    const xpFill = document.getElementById('hud-xp-fill');
    const xpText = document.getElementById('hud-xp-text');
    const alertsBox = document.getElementById('hud-alerts');

    // 75 / 150 = 50%
    expect(healthFill.style.width).toBe('50%');
    expect(healthText.textContent).toBe('75 / 150');

    // 40 / 80 = 50%
    expect(energyFill.style.width).toBe('50%');
    expect(energyText.textContent).toBe('40 / 80');

    // level 3 * 100 = 300 xpToNext, 150 / 300 = 50%
    expect(xpFill.style.width).toBe('50%');
    expect(xpText.textContent).toBe('150 / 300');

    expect(alertsBox.textContent).toBe('DEFENSE GRID COMPROMISED');
    expect(alertsBox.classList.contains('active')).toBe(true);
  });
});
