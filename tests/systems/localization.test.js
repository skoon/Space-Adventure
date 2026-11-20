import fs from 'fs';
import path from 'path';
import {
    getLocale,
    setLocale,
    localize,
    applyLocaleToDOM,
    applyThemeToDOM
} from '../../systems/theme-engine.js';
import { locales, SUPPORTED_LOCALES } from '../../data/locales.js';
import { theme } from '../../data/theme.js';
import {
    initSettings,
    getLocale as getSettingsLocale,
    setLocale as setSettingsLocale,
    getSettings
} from '../../systems/settings.js';
import {
    initAudio,
    getAudioManager,
    _resetAudioForTesting,
    AudioManager
} from '../../systems/audio.js';
import {
    initDialogueUI,
    showDialogue,
    hideDialogue
} from '../../systems/ui/dialogue-ui.js';

describe('Voice-Over & Localization (EN/ES)', () => {
    let playStub;
    let pauseStub;

    beforeEach(() => {
        playStub = jest.fn(() => Promise.resolve());
        pauseStub = jest.fn();
        window.HTMLMediaElement.prototype.play = playStub;
        window.HTMLMediaElement.prototype.pause = pauseStub;
        _resetAudioForTesting();
        setLocale('en');
        localStorage.clear();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        _resetAudioForTesting();
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Locales Data & Theme Engine', () => {
        test('SUPPORTED_LOCALES contains en and es', () => {
            expect(SUPPORTED_LOCALES).toContain('en');
            expect(SUPPORTED_LOCALES).toContain('es');
            expect(locales.en).toBeDefined();
            expect(locales.es).toBeDefined();
        });

        test('setLocale and getLocale validate supported locales and fallback to en', () => {
            expect(getLocale()).toBe('en');

            expect(setLocale('es')).toBe('es');
            expect(getLocale()).toBe('es');

            expect(setLocale('ES')).toBe('es');
            expect(getLocale()).toBe('es');

            expect(setLocale('en')).toBe('en');
            expect(getLocale()).toBe('en');

            // Invalid locales fallback to 'en'
            expect(setLocale('fr')).toBe('en');
            expect(getLocale()).toBe('en');

            expect(setLocale(null)).toBe('en');
            expect(getLocale()).toBe('en');

            expect(setLocale(123)).toBe('en');
            expect(getLocale()).toBe('en');
        });

        test('localize returns translated string, falls back to en, or returns key if unknown', () => {
            setLocale('en');
            expect(localize('nav_explore')).toBe('Explore');
            expect(localize('combat_attack')).toBe('Attack');

            setLocale('es');
            expect(localize('nav_explore')).toBe('Explorar');
            expect(localize('combat_attack')).toBe('Atacar');

            // Key missing in 'es' falls back to 'en'
            const origEs = locales.es.test_key;
            const origEn = locales.en.test_key;
            locales.en.test_key = 'English Only Text';
            delete locales.es.test_key;

            expect(localize('test_key')).toBe('English Only Text');

            // Cleanup
            delete locales.en.test_key;
            if (origEs) locales.es.test_key = origEs;
            if (origEn) locales.en.test_key = origEn;

            // Unknown key returns itself
            expect(localize('completely_unknown_token_12345')).toBe('completely_unknown_token_12345');
        });

        test('applyLocaleToDOM rewrites all [data-i18n] textContent', () => {
            document.body.innerHTML = `
                <div id="btn1" data-i18n="nav_explore">Old 1</div>
                <div id="btn2" data-i18n="combat_attack">Old 2</div>
                <div id="btn3" data-i18n="unknown_string_xyz">Old 3</div>
            `;

            setLocale('es');
            applyLocaleToDOM();

            expect(document.getElementById('btn1').textContent).toBe('Explorar');
            expect(document.getElementById('btn2').textContent).toBe('Atacar');
            expect(document.getElementById('btn3').textContent).toBe('unknown_string_xyz');

            setLocale('en');
            applyLocaleToDOM();

            expect(document.getElementById('btn1').textContent).toBe('Explore');
            expect(document.getElementById('btn2').textContent).toBe('Attack');
        });

        test('applyLocaleToDOM preserves leading emojis including variation selectors and indented markup', () => {
            document.body.innerHTML = `
                <button id="atk" data-i18n="combat_attack">⚔️ Attack</button>
                <button id="blk" data-i18n="combat_block">🛡️ Block</button>
                <button id="dist" data-i18n="nav_districts">🏢 Local Districts</button>
                <button id="ach" data-i18n="nav_achievements">
                    🏆 Achievements
                </button>
            `;

            setLocale('es');
            applyLocaleToDOM();

            expect(document.getElementById('atk').textContent).toBe('⚔️ Atacar');
            expect(document.getElementById('blk').textContent).toBe('🛡️ Bloquear');
            expect(document.getElementById('dist').textContent).toBe('🏢 Distritos locales');
            expect(document.getElementById('ach').textContent).toBe('🏆 Logros');

            setLocale('en');
            applyLocaleToDOM();

            expect(document.getElementById('atk').textContent).toBe('⚔️ Attack');
            expect(document.getElementById('blk').textContent).toBe('🛡️ Block');
            expect(document.getElementById('dist').textContent).toBe('🏢 Local Districts');
            expect(document.getElementById('ach').textContent).toBe('🏆 Achievements');
        });

        test('data-term and data-i18n coexist through applyThemeToDOM and en -> es -> en switching', () => {
            const originalThemeAchievements = theme.achievements;
            const originalThemeHull = theme.hudHull;

            try {
                theme.achievements = 'Feats';
                theme.hudHull = 'Armor';

                document.body.innerHTML = `
                    <span id="hullLabel" data-term="hudHull" data-i18n="hud_hull">Hull</span>
                    <button id="achBtn" data-term="achievements" data-i18n="nav_achievements">
                        🏆 Achievements
                    </button>
                `;

                setLocale('en');
                applyThemeToDOM();
                expect(document.getElementById('hullLabel').textContent).toBe('Armor');
                expect(document.getElementById('achBtn').textContent).toBe('🏆 Feats');

                setLocale('es');
                applyThemeToDOM();
                expect(document.getElementById('hullLabel').textContent).toBe('Casco');
                expect(document.getElementById('achBtn').textContent).toBe('🏆 Logros');

                setLocale('en');
                applyLocaleToDOM();
                expect(document.getElementById('hullLabel').textContent).toBe('Armor');
                expect(document.getElementById('achBtn').textContent).toBe('🏆 Feats');
            } finally {
                theme.achievements = originalThemeAchievements;
                theme.hudHull = originalThemeHull;
            }
        });

        test('real index.html has >20 valid [data-i18n] elements and translates cleanly in jsdom', () => {
            const indexPath = path.join(__dirname, '..', '..', 'index.html');
            const html = fs.readFileSync(indexPath, 'utf8');
            document.documentElement.innerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>') + 7);

            const i18nElements = document.querySelectorAll('[data-i18n]');
            expect(i18nElements.length).toBeGreaterThan(20);

            i18nElements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                expect(locales.en).toHaveProperty(key);
                expect(locales.es).toHaveProperty(key);
            });

            setLocale('es');
            applyLocaleToDOM();

            const hullEl = document.querySelector('[data-i18n="hud_hull"]');
            const energyEl = document.querySelector('[data-i18n="hud_energy"]');
            const xpEl = document.querySelector('[data-i18n="hud_xp"]');
            expect(hullEl.textContent).toBe('Casco');
            expect(energyEl.textContent).toBe('Energía');
            expect(xpEl.textContent).toBe('XP');

            const achBtn = document.getElementById('achievementsBtn');
            const codexBtn = document.getElementById('codexBtn');
            const districtsBtn = document.getElementById('districtsBtn');
            expect(achBtn.textContent).toBe('🏆 Logros');
            expect(codexBtn.textContent).toBe('📖 Códice');
            expect(districtsBtn.textContent).toBe('🏢 Distritos locales');

            const attackLabel = document.querySelector('[data-i18n="combat_attack"]');
            expect(attackLabel.textContent).toBe('Atacar');
            expect(attackLabel.parentElement.textContent.replace(/\s+/g, ' ').trim()).toBe('⚔️ Atacar (2 AP)');
        });
    });

    describe('Settings Integration', () => {
        test('settings has default locale en and initializes properly', () => {
            initSettings();
            expect(getSettingsLocale()).toBe('en');
            expect(getSettings().locale).toBe('en');
        });

        test('setSettingsLocale updates setting, local storage, theme locale, and applies to DOM', () => {
            document.body.innerHTML = `<span id="testLabel" data-i18n="nav_shop">Old</span>`;

            setSettingsLocale('es');
            expect(getSettingsLocale()).toBe('es');
            expect(getLocale()).toBe('es');
            expect(document.getElementById('testLabel').textContent).toBe('Tienda');

            const saved = JSON.parse(localStorage.getItem('galactic_odyssey_settings') || '{}');
            expect(saved.locale).toBe('es');

            // Resetting via initSettings reloads from storage
            initSettings();
            expect(getSettingsLocale()).toBe('es');
        });
    });

    describe('Voice-Over Audio System', () => {
        test('AudioManager initializes with voice = null', () => {
            const manager = initAudio();
            expect(manager.voice).toBeNull();
        });

        test('playVoice creates voice clip, sets volume, and plays via safe play', () => {
            const manager = initAudio();
            playStub.mockClear();

            manager.playVoice('vance', 'greeting');
            expect(manager.voice).not.toBeNull();
            expect(manager.voice.src).toContain('assets/audio/voice/vance_greeting.mp3');
            expect(playStub).toHaveBeenCalledTimes(1);

            // Default clipId is 'greeting'
            playStub.mockClear();
            manager.playVoice('lyra');
            expect(manager.voice.src).toContain('assets/audio/voice/lyra_greeting.mp3');
            expect(playStub).toHaveBeenCalledTimes(1);
        });

        test('playVoice stops previous voice clip before playing new one', () => {
            const manager = initAudio();
            manager.playVoice('vance');
            const firstVoice = manager.voice;

            manager.playVoice('lyra');
            expect(pauseStub).toHaveBeenCalled();
            expect(manager.voice).not.toBe(firstVoice);
            expect(manager.voice.src).toContain('assets/audio/voice/lyra_greeting.mp3');
        });

        test('stopVoice pauses current voice and clears this.voice', () => {
            const manager = initAudio();
            manager.playVoice('vance');
            expect(manager.voice).not.toBeNull();

            manager.stopVoice();
            expect(pauseStub).toHaveBeenCalled();
            expect(manager.voice).toBeNull();
        });

        test('playVoice respects muted state and volume', () => {
            const manager = initAudio();
            manager.setVolume(0.7);
            manager.playVoice('vance');
            expect(manager.voice.volume).toBeCloseTo(0.7);

            manager.mute(true);
            expect(manager.voice.volume).toBe(0);

            manager.playVoice('lyra');
            expect(manager.voice.volume).toBe(0);

            manager.mute(false);
            expect(manager.voice.volume).toBeCloseTo(0.7);
        });

        test('destroy calls stopVoice and cleans up voice clip', () => {
            const manager = initAudio();
            manager.playVoice('vance');
            expect(manager.voice).not.toBeNull();

            manager.destroy();
            expect(pauseStub).toHaveBeenCalled();
            expect(manager.voice).toBeNull();
        });
    });

    describe('Dialogue UI Voice Integration', () => {
        let overlay;

        beforeEach(() => {
            overlay = document.createElement('div');
            overlay.id = 'dialogueOverlay';
            overlay.innerHTML = `
                <div class="dialogue-container">
                    <div id="dialogueAvatar"></div>
                    <div id="dialogueNpcName"></div>
                    <div id="dialogueNpcFaction"></div>
                    <div id="dialogueNpcMood"></div>
                    <div id="dialogueTitleText"></div>
                    <div id="dialogueTextBody"></div>
                    <div id="dialogueChoicesList"></div>
                    <div id="dialogueRollBox" style="display: none;"></div>
                </div>
            `;
            document.body.appendChild(overlay);

            initDialogueUI({
                state: { character: { npcs: {} }, storyline: {} },
                ui: { updateUI: jest.fn(), paintThumb: jest.fn(), setScene: jest.fn(), clearScene: jest.fn() }
            });
        });

        test('showDialogue plays voice clip for identified speaker and hideDialogue stops voice', () => {
            const audioManager = initAudio();
            const playVoiceSpy = jest.spyOn(audioManager, 'playVoice');
            const stopVoiceSpy = jest.spyOn(audioManager, 'stopVoice');

            showDialogue('Captain Vance', 'Welcome to the bridge, Commander.');
            expect(playVoiceSpy).toHaveBeenCalledWith('vance');

            hideDialogue();
            expect(stopVoiceSpy).toHaveBeenCalled();
        });

        test('showDialogue with Lyra identifies speaker key lyra and triggers voice', () => {
            const audioManager = initAudio();
            const playVoiceSpy = jest.spyOn(audioManager, 'playVoice');

            showDialogue('Dr. Lyra', 'The experimental readings are ready.');
            expect(playVoiceSpy).toHaveBeenCalledWith('lyra');
        });
    });
});
