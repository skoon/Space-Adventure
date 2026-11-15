import { HUD } from '../../systems/ui.js';

describe('HUD System', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div id="hud-container" class="hud-container">
        <div class="hud-bar-fill health" id="hud-health-fill"></div>
        <span id="hud-health-text"></span>
        <div class="hud-bar-fill energy" id="hud-energy-fill"></div>
        <span id="hud-energy-text"></span>
        <div class="hud-bar-fill xp" id="hud-xp-fill"></div>
        <span id="hud-xp-text"></span>
        <div class="hud-alerts" id="hud-alerts"></div>
      </div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
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
    const alertsBox = document.getElementById('hud-alerts');

    expect(healthFill.style.width).toBe('80%');
    expect(healthText.textContent).toBe('80 / 100');
    expect(alertsBox.textContent).toContain('WARNING: RADIATION DETECTED');
    expect(alertsBox.classList.contains('active')).toBe(true);
  });
});
