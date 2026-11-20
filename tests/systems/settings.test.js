import {
    initSettings,
    getVolume,
    setVolume,
    getMuted,
    setMuted,
    getSettings
} from '../../systems/settings.js';
import { initAudio, getAudioManager, _resetAudioForTesting } from '../../systems/audio.js';
import { initSettingsUI, showSettingsModal } from '../../systems/ui/settings-ui.js';

describe('Settings System & Settings UI Audio Wiring', () => {
    let playStub;
    let pauseStub;

    beforeEach(() => {
        playStub = jest.fn(() => Promise.resolve());
        pauseStub = jest.fn();
        window.HTMLMediaElement.prototype.play = playStub;
        window.HTMLMediaElement.prototype.pause = pauseStub;
        _resetAudioForTesting();
        localStorage.clear();
        document.body.innerHTML = '';
        initSettings();
    });

    afterEach(() => {
        _resetAudioForTesting();
        localStorage.clear();
        document.body.innerHTML = '';
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('Volume and Mute Settings', () => {
        test('defaults to volume 1.0 and muted false', () => {
            expect(getVolume()).toBe(1.0);
            expect(getMuted()).toBe(false);
            expect(getSettings().volume).toBe(1.0);
            expect(getSettings().muted).toBe(false);
        });

        test('setVolume clamps values to [0, 1] and rejects non-finite inputs', () => {
            expect(setVolume(0.45)).toBe(0.45);
            expect(getVolume()).toBe(0.45);

            expect(setVolume(-0.5)).toBe(0);
            expect(getVolume()).toBe(0);

            expect(setVolume(1.5)).toBe(1);
            expect(getVolume()).toBe(1);

            setVolume(0.6);
            expect(setVolume('not-a-number')).toBe(0.6);
            expect(getVolume()).toBe(0.6);

            expect(setVolume(NaN)).toBe(0.6);
            expect(getVolume()).toBe(0.6);
        });

        test('persists volume and muted across initSettings() and clamps loaded values', () => {
            setVolume(0.35);
            setMuted(true);

            const saved = JSON.parse(localStorage.getItem('galactic_odyssey_settings'));
            expect(saved.volume).toBe(0.35);
            expect(saved.muted).toBe(true);

            initSettings();
            expect(getVolume()).toBe(0.35);
            expect(getMuted()).toBe(true);

            localStorage.setItem('galactic_odyssey_settings', JSON.stringify({
                volume: 2.5,
                muted: 1
            }));
            initSettings();
            expect(getVolume()).toBe(1);
            expect(getMuted()).toBe(true);

            localStorage.setItem('galactic_odyssey_settings', JSON.stringify({
                volume: 'invalid',
                muted: 0
            }));
            initSettings();
            expect(getVolume()).toBe(1.0);
            expect(getMuted()).toBe(false);
        });

        test('syncs live with AudioManager on setVolume, setMuted, and initSettings', () => {
            const audio = initAudio();
            const setVolumeSpy = jest.spyOn(audio, 'setVolume');
            const muteSpy = jest.spyOn(audio, 'mute');

            audio.playTrack('ambient');
            expect(audio.current.volume).toBe(1.0);

            setVolume(0.4);
            expect(setVolumeSpy).toHaveBeenCalledWith(0.4);
            expect(audio.volume).toBe(0.4);
            expect(audio.current.volume).toBe(0.4);

            setMuted(true);
            expect(muteSpy).toHaveBeenCalledWith(true);
            expect(audio.muted).toBe(true);
            expect(audio.current.volume).toBe(0);

            setMuted(false);
            expect(muteSpy).toHaveBeenCalledWith(false);
            expect(audio.muted).toBe(false);
            expect(audio.current.volume).toBe(0.4);

            localStorage.setItem('galactic_odyssey_settings', JSON.stringify({
                volume: 0.2,
                muted: true
            }));
            setVolumeSpy.mockClear();
            muteSpy.mockClear();

            initSettings();
            expect(getAudioManager()).toBe(audio);
            expect(setVolumeSpy).toHaveBeenCalledWith(0.2);
            expect(muteSpy).toHaveBeenCalledWith(true);
            expect(audio.volume).toBe(0.2);
            expect(audio.muted).toBe(true);
            expect(audio.current.volume).toBe(0);
        });
    });

    describe('Settings UI Modal', () => {
        test('renders audio and locale controls and wires input/change listeners', () => {
            jest.useFakeTimers();

            const mockDeps = {
                settings: {
                    getDifficulty: jest.fn(() => ({ id: 'normal', description: 'The standard experience.' })),
                    setDifficulty: jest.fn(),
                    getShowImages: jest.fn(() => true),
                    setShowImages: jest.fn(),
                    getLocale: jest.fn(() => 'en'),
                    setLocale: jest.fn(),
                    getVolume: jest.fn(() => 0.75),
                    setVolume: jest.fn(),
                    getMuted: jest.fn(() => true),
                    setMuted: jest.fn()
                },
                ui: {
                    repaintViewscreen: jest.fn(),
                    updateUI: jest.fn()
                },
                state: {}
            };

            const mockShowDialog = jest.fn((_title, html) => {
                document.body.innerHTML = html;
            });

            initSettingsUI(mockDeps, mockShowDialog);
            showSettingsModal();

            expect(mockShowDialog).toHaveBeenCalledTimes(1);

            const muteCheckbox = document.getElementById('inGameMuteAudio');
            const volumeSlider = document.getElementById('inGameVolumeSlider');
            const volumeValue = document.getElementById('inGameVolumeValue');
            const localeSelect = document.getElementById('inGameLocaleSelect');

            expect(muteCheckbox).not.toBeNull();
            expect(muteCheckbox.checked).toBe(true);
            expect(volumeSlider).not.toBeNull();
            expect(volumeSlider.value).toBe('75');
            expect(volumeValue).not.toBeNull();
            expect(volumeValue.textContent).toBe('75%');
            expect(localeSelect).not.toBeNull();
            expect(localeSelect.value).toBe('en');

            jest.advanceTimersByTime(100);

            muteCheckbox.checked = false;
            muteCheckbox.dispatchEvent(new Event('change'));
            expect(mockDeps.settings.setMuted).toHaveBeenCalledWith(false);

            volumeSlider.value = '40';
            volumeSlider.dispatchEvent(new Event('input'));
            expect(volumeValue.textContent).toBe('40%');
            expect(mockDeps.settings.setVolume).toHaveBeenCalledWith(0.4);

            volumeSlider.value = '65';
            volumeSlider.dispatchEvent(new Event('change'));
            expect(volumeValue.textContent).toBe('65%');
            expect(mockDeps.settings.setVolume).toHaveBeenCalledWith(0.65);

            localeSelect.value = 'es';
            localeSelect.dispatchEvent(new Event('change'));
            expect(mockDeps.settings.setLocale).toHaveBeenCalledWith('es');
            expect(mockDeps.ui.updateUI).toHaveBeenCalled();

            jest.useRealTimers();
        });
    });
});
