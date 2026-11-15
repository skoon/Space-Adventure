/**
 * @jest-environment jsdom
 *
 * tests/systems/cutscene.test.js
 * Comprehensive unit tests for Cinematic Cut-Scenes:
 * - Data structure (data/cutscenes.js)
 * - Cutscene system logic, state management, event emitter (systems/cutscene.js)
 * - Cutscene UI overlay, keyboard shortcuts, video onerror fallback (systems/ui/cutscene-ui.js)
 */

import { cutscenes } from '../../data/cutscenes.js';
import {
  initCutscene,
  hasSeenCutscene,
  playCutscene,
  advanceBeat,
  skipCutscene,
  endCutscene,
  getActiveCutscene,
  ensureCutsceneState
} from '../../systems/cutscene.js';
import {
  initCutsceneUI,
  renderCutscene,
  hideCutscene,
  isCutsceneOpen,
  handleCutsceneKeydown
} from '../../systems/ui/cutscene-ui.js';
import { EventEmitter } from '../../systems/eventEmitter.js';

describe('Cinematic Cutscenes - Data Module', () => {
  test('exports cutscenes object with required starter cutscenes', () => {
    expect(cutscenes).toBeDefined();
    expect(cutscenes.act1_launch).toBeDefined();
    expect(cutscenes.first_boss_xylar).toBeDefined();
    expect(cutscenes.derelict_breach).toBeDefined();
  });

  test('each starter cutscene contains required schema and non-empty beats', () => {
    ['act1_launch', 'first_boss_xylar', 'derelict_breach'].forEach(id => {
      const cs = cutscenes[id];
      expect(cs.id).toBe(id);
      expect(typeof cs.title).toBe('string');
      expect(cs.title.length).toBeGreaterThan(0);
      expect(Array.isArray(cs.beats)).toBe(true);
      expect(cs.beats.length).toBeGreaterThan(0);

      cs.beats.forEach(beat => {
        expect(typeof beat.speaker).toBe('string');
        expect(typeof beat.text).toBe('string');
        expect(beat.text.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Cinematic Cutscene System Logic', () => {
  let mockState;
  let mockEmitter;
  let mockUI;

  beforeEach(() => {
    mockState = {
      cutscenesSeen: []
    };
    mockEmitter = new EventEmitter();
    mockUI = {
      renderCutscene: jest.fn(),
      hideCutscene: jest.fn()
    };
    initCutscene({ state: mockState, ui: mockUI, eventEmitter: mockEmitter });
  });

  afterEach(() => {
    endCutscene();
  });

  test('ensureCutsceneState initializes cutscenesSeen if missing on older saves', () => {
    const legacyState = {};
    initCutscene({ state: legacyState });
    expect(Array.isArray(legacyState.cutscenesSeen)).toBe(true);
    expect(ensureCutsceneState()).toEqual([]);
  });

  test('ensureCutsceneState safely handles undefined state', () => {
    initCutscene({ state: null });
    expect(ensureCutsceneState()).toEqual([]);
    expect(hasSeenCutscene('act1_launch')).toBe(false);
  });

  test('hasSeenCutscene accurately reflects state.cutscenesSeen', () => {
    expect(hasSeenCutscene('act1_launch')).toBe(false);
    mockState.cutscenesSeen.push('act1_launch');
    expect(hasSeenCutscene('act1_launch')).toBe(true);
  });

  test('playCutscene returns false and triggers onComplete when ID is unknown', () => {
    const onComplete = jest.fn();
    const result = playCutscene('non_existent_id', { onComplete });

    expect(result).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(getActiveCutscene()).toBeNull();
  });

  test('playCutscene starts cutscene, records in cutscenesSeen, and emits cutsceneStart', () => {
    const startSpy = jest.fn();
    mockEmitter.on('cutsceneStart', startSpy);

    const started = playCutscene('act1_launch');
    expect(started).toBe(true);

    expect(mockState.cutscenesSeen).toContain('act1_launch');
    expect(startSpy).toHaveBeenCalledWith({ id: 'act1_launch' });

    const active = getActiveCutscene();
    expect(active).not.toBeNull();
    expect(active.cutscene.id).toBe('act1_launch');
    expect(active.beatIndex).toBe(0);
    expect(active.beat.speaker).toBe('Flight Control');
    expect(active.totalBeats).toBe(cutscenes.act1_launch.beats.length);

    expect(mockUI.renderCutscene).toHaveBeenCalledWith(active);
  });

  test('playCutscene skips already seen cutscene unless force is true', () => {
    mockState.cutscenesSeen.push('act1_launch');
    const onComplete = jest.fn();

    // With force: false
    const skipped = playCutscene('act1_launch', { force: false, onComplete });
    expect(skipped).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(getActiveCutscene()).toBeNull();

    // With force: true
    const forced = playCutscene('act1_launch', { force: true });
    expect(forced).toBe(true);
    expect(getActiveCutscene()).not.toBeNull();
  });

  test('advanceBeat advances sequence and emits cutsceneBeat with beat data', () => {
    playCutscene('first_boss_xylar');
    const beatSpy = jest.fn();
    mockEmitter.on('cutsceneBeat', beatSpy);

    const next1 = advanceBeat();
    expect(next1).not.toBeNull();
    expect(next1.beatIndex).toBe(1);
    expect(next1.beat.speaker).toBe('Overlord Xylar');
    expect(beatSpy).toHaveBeenCalledWith(next1.beat);
    expect(mockUI.renderCutscene).toHaveBeenCalledWith(next1);
  });

  test('advanceBeat on the last beat ends cutscene and calls onComplete', () => {
    const onComplete = jest.fn();
    playCutscene('first_boss_xylar', { onComplete });

    const total = cutscenes.first_boss_xylar.beats.length; // 3 beats: 0, 1, 2
    expect(getActiveCutscene().beatIndex).toBe(0);

    advanceBeat(); // Index 1
    advanceBeat(); // Index 2 (last beat)
    expect(getActiveCutscene().beatIndex).toBe(total - 1);

    const endSpy = jest.fn();
    mockEmitter.on('cutsceneEnd', endSpy);

    const over = advanceBeat(); // Past last beat
    expect(over).toBeNull();
    expect(getActiveCutscene()).toBeNull();
    expect(endSpy).toHaveBeenCalledWith({ id: 'first_boss_xylar' });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(mockUI.hideCutscene).toHaveBeenCalled();
  });

  test('skipCutscene immediately clears cutscene, emits cutsceneEnd, and calls onComplete', () => {
    const onComplete = jest.fn();
    const endSpy = jest.fn();
    mockEmitter.on('cutsceneEnd', endSpy);

    playCutscene('derelict_breach', { onComplete });
    expect(getActiveCutscene()).not.toBeNull();

    skipCutscene();
    expect(getActiveCutscene()).toBeNull();
    expect(endSpy).toHaveBeenCalledWith({ id: 'derelict_breach' });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(mockUI.hideCutscene).toHaveBeenCalled();
  });

  test('calling advanceBeat or skipCutscene when inactive is a safe no-op', () => {
    expect(getActiveCutscene()).toBeNull();
    expect(advanceBeat()).toBeNull();
    expect(() => skipCutscene()).not.toThrow();
    expect(() => endCutscene()).not.toThrow();
  });
});

describe('Cinematic Cutscene UI Controller (systems/ui/cutscene-ui.js)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="cutsceneModal" style="display: none;" class="hidden" aria-hidden="true">
        <h2 id="cutsceneTitle"></h2>
        <video id="cutsceneVideo" style="display: none;" class="hidden"></video>
        <div id="cutsceneStoryboard">
          <div id="cutsceneSpeaker"></div>
          <div id="cutsceneText"></div>
          <div id="cutsceneProgress"></div>
        </div>
        <button id="cutsceneNextBtn">Next</button>
        <button id="cutsceneSkipBtn">Skip</button>
      </div>
    `;

    // Mock HTMLMediaElement methods in jsdom
    window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = jest.fn();
    window.HTMLMediaElement.prototype.load = jest.fn();
  });

  afterEach(() => {
    hideCutscene();
    document.body.innerHTML = '';
  });

  test('renders storyboard beat elements correctly', () => {
    const modal = document.getElementById('cutsceneModal');
    const title = document.getElementById('cutsceneTitle');
    const speaker = document.getElementById('cutsceneSpeaker');
    const text = document.getElementById('cutsceneText');
    const progress = document.getElementById('cutsceneProgress');
    const nextBtn = document.getElementById('cutsceneNextBtn');

    const testData = {
      cutscene: { id: 'test_cs', title: 'Deep Space Mission', videoSrc: null },
      beatIndex: 0,
      beat: { speaker: 'Commander', emoji: '🧑‍🚀', text: 'Initiating orbital scan.' },
      totalBeats: 2
    };

    renderCutscene(testData);

    expect(isCutsceneOpen()).toBe(true);
    expect(modal.style.display).toBe('flex');
    expect(title.textContent).toBe('Deep Space Mission');
    expect(speaker.textContent).toBe('🧑‍🚀 Commander');
    expect(text.textContent).toBe('Initiating orbital scan.');
    expect(progress.textContent).toBe('1 / 2');
    expect(nextBtn.textContent).toBe('Next >');

    // On final beat, button label switches to Finish
    const lastBeatData = {
      cutscene: { id: 'test_cs', title: 'Deep Space Mission', videoSrc: null },
      beatIndex: 1,
      beat: { speaker: 'Commander', emoji: '🧑‍🚀', text: 'Scan complete. All clear.' },
      totalBeats: 2
    };
    renderCutscene(lastBeatData);
    expect(progress.textContent).toBe('2 / 2');
    expect(nextBtn.textContent).toBe('Finish');
  });

  test('button clicks trigger advance and skip callbacks', () => {
    const advanceSpy = jest.fn();
    const skipSpy = jest.fn();
    initCutsceneUI({ advanceBeat: advanceSpy, skipCutscene: skipSpy });

    const testData = {
      cutscene: { id: 'test_cs', title: 'Test Title' },
      beatIndex: 0,
      beat: { speaker: 'AI', emoji: '🤖', text: 'Systems check.' },
      totalBeats: 3
    };
    renderCutscene(testData);

    const nextBtn = document.getElementById('cutsceneNextBtn');
    const skipBtn = document.getElementById('cutsceneSkipBtn');

    nextBtn.click();
    expect(advanceSpy).toHaveBeenCalledTimes(1);

    skipBtn.click();
    expect(skipSpy).toHaveBeenCalledTimes(1);
  });

  test('keyboard shortcuts advance on Space/Enter and skip on Escape while modal is open', () => {
    const advanceSpy = jest.fn();
    const skipSpy = jest.fn();
    initCutsceneUI({ advanceBeat: advanceSpy, skipCutscene: skipSpy });

    const testData = {
      cutscene: { id: 'test_cs', title: 'Key Test' },
      beatIndex: 0,
      beat: { speaker: 'AI', text: 'Awaiting command.' },
      totalBeats: 2
    };
    renderCutscene(testData);
    expect(isCutsceneOpen()).toBe(true);

    // Space advances
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(spaceEvent);
    expect(advanceSpy).toHaveBeenCalledTimes(1);

    // Enter advances
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    window.dispatchEvent(enterEvent);
    expect(advanceSpy).toHaveBeenCalledTimes(2);

    // Escape skips
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(escEvent);
    expect(skipSpy).toHaveBeenCalledTimes(1);

    // Hide cutscene and verify keystrokes are ignored when closed
    hideCutscene();
    expect(isCutsceneOpen()).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(advanceSpy).toHaveBeenCalledTimes(2);
    expect(skipSpy).toHaveBeenCalledTimes(1);
  });

  test('video mode shows <video> element and falls back to storyboard beats on onerror', () => {
    const video = document.getElementById('cutsceneVideo');
    const storyboard = document.getElementById('cutsceneStoryboard');

    const videoData = {
      cutscene: {
        id: 'video_cutscene',
        title: 'Video Intro',
        videoSrc: 'assets/videos/intro.mp4'
      },
      beatIndex: 0,
      beat: { speaker: 'Narrator', emoji: '🎬', text: 'Fallback narrative text.' },
      totalBeats: 1
    };

    renderCutscene(videoData);

    // Video should be visible, storyboard hidden
    expect(video.style.display).toBe('block');
    expect(video.src).toContain('assets/videos/intro.mp4');
    expect(storyboard.style.display).toBe('none');

    // Simulate video load error
    video.onerror();

    // Video should now be hidden, storyboard restored with beat content
    expect(video.style.display).toBe('none');
    expect(storyboard.style.display).toBe('');
    expect(document.getElementById('cutsceneSpeaker').textContent).toBe('🎬 Narrator');
    expect(document.getElementById('cutsceneText').textContent).toBe('Fallback narrative text.');
  });

  test('safe no-op when DOM elements are completely absent', () => {
    document.body.innerHTML = ''; // No elements at all

    expect(() => {
      renderCutscene({ cutscene: { id: 'x' }, beatIndex: 0, totalBeats: 1 });
      hideCutscene();
      handleCutsceneKeydown(new KeyboardEvent('keydown', { key: ' ' }));
      handleCutsceneKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    }).not.toThrow();

    expect(isCutsceneOpen()).toBe(false);
  });
});
