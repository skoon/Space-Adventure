import { initAudio, getAudioManager, _resetAudioForTesting, AudioManager } from '../../systems/audio.js';
import { eventEmitter } from '../../systems/eventEmitter.js';

describe('Adaptive Audio System', () => {
  let playStub;
  let pauseStub;

  beforeEach(() => {
    playStub = jest.fn(() => Promise.resolve());
    pauseStub = jest.fn();
    window.HTMLMediaElement.prototype.play = playStub;
    window.HTMLMediaElement.prototype.pause = pauseStub;
    _resetAudioForTesting();
  });

  afterEach(() => {
    _resetAudioForTesting();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('initAudio is idempotent', () => {
    const manager1 = initAudio();
    const manager2 = initAudio();
    expect(manager1).toBeInstanceOf(AudioManager);
    expect(manager1).toBe(manager2);
    expect(getAudioManager()).toBe(manager1);
  });

  test('no play before a user gesture', () => {
    initAudio();
    expect(playStub).not.toHaveBeenCalled();
    expect(getAudioManager().current).toBeNull();
  });

  test('ambient starts after a simulated pointerdown', () => {
    const manager = initAudio();
    document.dispatchEvent(new Event('pointerdown'));

    expect(playStub).toHaveBeenCalled();
    expect(manager.current).toBe(manager.tracks.ambient);
  });

  test('ambient starts after a simulated keydown', () => {
    const manager = initAudio();
    document.dispatchEvent(new Event('keydown'));

    expect(playStub).toHaveBeenCalled();
    expect(manager.current).toBe(manager.tracks.ambient);
  });

  test('emitting combatStart, bossPhase, combatIntense, combatEnd changes the current track with crossFade', () => {
    jest.useFakeTimers();
    const manager = initAudio();

    // Start with user gesture
    document.dispatchEvent(new Event('pointerdown'));
    expect(manager.current).toBe(manager.tracks.ambient);

    // combatStart -> crossfade to combat
    eventEmitter.emit('combatStart');
    expect(manager.current).toBe(manager.tracks.combat);
    jest.advanceTimersByTime(800);
    expect(pauseStub).toHaveBeenCalled();
    expect(manager.tracks.combat.volume).toBe(1.0);

    // combatIntense -> crossfade to intense
    eventEmitter.emit('combatIntense');
    expect(manager.current).toBe(manager.tracks.intense);
    jest.advanceTimersByTime(800);
    expect(manager.tracks.intense.volume).toBe(1.0);

    // bossPhase -> crossfade to boss
    eventEmitter.emit('bossPhase');
    expect(manager.current).toBe(manager.tracks.boss);
    jest.advanceTimersByTime(800);
    expect(manager.tracks.boss.volume).toBe(1.0);

    // combatEnd -> crossfade back to ambient
    eventEmitter.emit('combatEnd');
    expect(manager.current).toBe(manager.tracks.ambient);
    jest.advanceTimersByTime(800);
    expect(manager.tracks.ambient.volume).toBe(1.0);
  });

  test('playerAttack, enemyAttack, explosion play the right SFX', () => {
    const manager = initAudio();
    playStub.mockClear();

    eventEmitter.emit('playerAttack');
    expect(playStub).toHaveBeenCalled();
    expect(manager.sfx.laser.currentTime).toBe(0);

    playStub.mockClear();
    eventEmitter.emit('enemyAttack');
    expect(playStub).toHaveBeenCalled();
    expect(manager.sfx.hit.currentTime).toBe(0);

    playStub.mockClear();
    eventEmitter.emit('explosion');
    expect(playStub).toHaveBeenCalled();
    expect(manager.sfx.explosion.currentTime).toBe(0);
  });

  test('mute and setVolume behave correctly', () => {
    const manager = initAudio();
    document.dispatchEvent(new Event('pointerdown'));

    manager.setVolume(0.5);
    expect(manager.volume).toBe(0.5);
    expect(manager.current.volume).toBe(0.5);

    manager.mute(true);
    expect(manager.muted).toBe(true);
    expect(manager.current.volume).toBe(0);

    manager.mute(false);
    expect(manager.muted).toBe(false);
    expect(manager.current.volume).toBe(0.5);
  });

  test('play handles rejected promises without unhandled rejections', async () => {
    window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.reject(new Error('Autoplay blocked')));
    const manager = initAudio();
    expect(() => {
      manager.playTrack('ambient');
      manager.playSFX('laser');
    }).not.toThrow();
  });

  test('play handles undefined return value without error', () => {
    window.HTMLMediaElement.prototype.play = jest.fn(() => undefined);
    const manager = initAudio();
    expect(() => {
      manager.playTrack('ambient');
      manager.playSFX('click');
    }).not.toThrow();
  });
});
