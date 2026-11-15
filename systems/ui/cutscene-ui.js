/**
 * systems/ui/cutscene-ui.js
 * Presentation controller for cinematic cutscenes.
 * Handles overlay rendering, storyboard beats, video playback with error fallback,
 * and keyboard shortcuts (Space/Enter to advance, Escape to skip).
 */

import { advanceBeat, skipCutscene } from '../cutscene.js';

let uiDeps = null;
let currentCutsceneId = null;
let videoErrored = false;
let keydownListenerAttached = false;

/**
 * Check if the cutscene modal is currently visible.
 * @returns {boolean}
 */
export function isCutsceneOpen() {
  if (typeof document === 'undefined') return false;
  const modal = document.getElementById('cutsceneModal');
  if (!modal) return false;
  return modal.style.display !== 'none' && !modal.classList.contains('hidden');
}

/**
 * Handle user advance action (click Next or press Space/Enter).
 */
function handleAdvance() {
  if (uiDeps && typeof uiDeps.advanceBeat === 'function') {
    uiDeps.advanceBeat();
  } else if (typeof advanceBeat === 'function') {
    advanceBeat();
  }
}

/**
 * Handle user skip action (click Skip or press Escape).
 */
function handleSkip() {
  if (uiDeps && typeof uiDeps.skipCutscene === 'function') {
    uiDeps.skipCutscene();
  } else if (typeof skipCutscene === 'function') {
    skipCutscene();
  }
}

/**
 * Handle keyboard events while modal is open.
 * Space/Enter to advance, Escape to skip.
 * @param {KeyboardEvent} e
 */
export function handleCutsceneKeydown(e) {
  if (!isCutsceneOpen()) return;

  // Do not intercept keystrokes inside form inputs
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
    return;
  }

  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    handleAdvance();
  } else if (e.key === 'Escape') {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    handleSkip();
  }
}

/**
 * Attach global keyboard listener once.
 */
function attachGlobalListeners() {
  if (keydownListenerAttached) return;
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', handleCutsceneKeydown);
    keydownListenerAttached = true;
  }
}

/**
 * Render storyboard beats into DOM elements.
 * @param {Object} data
 */
function renderStoryboardBeats(data) {
  if (typeof document === 'undefined') return;

  const storyboardEl = document.getElementById('cutsceneStoryboard');
  const speakerEl = document.getElementById('cutsceneSpeaker');
  const textEl = document.getElementById('cutsceneText');
  const progressEl = document.getElementById('cutsceneProgress');

  if (storyboardEl) {
    storyboardEl.style.display = '';
    storyboardEl.classList.remove('hidden');
  }

  const beat = data?.beat;

  if (speakerEl) {
    speakerEl.style.display = '';
    speakerEl.classList.remove('hidden');
    if (beat) {
      const parts = [];
      if (beat.emoji) parts.push(beat.emoji);
      if (beat.speaker) parts.push(beat.speaker);
      speakerEl.textContent = parts.join(' ');
    } else {
      speakerEl.textContent = '';
    }
  }

  if (textEl) {
    textEl.style.display = '';
    textEl.classList.remove('hidden');
    textEl.textContent = beat?.text || '';
  }

  if (progressEl) {
    progressEl.style.display = '';
    progressEl.classList.remove('hidden');
    const total = data?.totalBeats || 0;
    const current = (data?.beatIndex ?? 0) + 1;
    progressEl.textContent = total > 0 ? `${current} / ${total}` : '';
  }
}

/**
 * Render the cutscene modal and its active beat or video view.
 * Safe no-op if DOM elements are missing.
 * @param {Object|null} data Active cutscene snapshot
 */
export function renderCutscene(data) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('cutsceneModal');
  if (!modal) return;

  if (!data) {
    hideCutscene();
    return;
  }

  // Open the modal container
  modal.style.display = 'flex';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  // Track cutscene ID to reset error state on new cutscene
  if (currentCutsceneId !== data.cutscene?.id) {
    currentCutsceneId = data.cutscene?.id;
    videoErrored = false;
  }

  // Update title
  const titleEl = document.getElementById('cutsceneTitle');
  if (titleEl) {
    titleEl.textContent = data.cutscene?.title || '';
  }

  const videoEl = document.getElementById('cutsceneVideo');
  const storyboardEl = document.getElementById('cutsceneStoryboard');
  const speakerEl = document.getElementById('cutsceneSpeaker');
  const textEl = document.getElementById('cutsceneText');
  const progressEl = document.getElementById('cutsceneProgress');

  const hasVideo = Boolean(data.cutscene?.videoSrc && !videoErrored);

  if (hasVideo && videoEl) {
    // Video mode
    videoEl.style.display = 'block';
    videoEl.classList.remove('hidden');

    if (videoEl.src !== data.cutscene.videoSrc && !videoEl.src.endsWith(data.cutscene.videoSrc)) {
      videoEl.src = data.cutscene.videoSrc;
      try {
        videoEl.load?.();
        videoEl.play?.()?.catch?.(() => {});
      } catch (err) {
        // Safe catch for environments restricting autoplay or lacking media decoders
      }
    }

    videoEl.onerror = () => {
      videoErrored = true;
      videoEl.style.display = 'none';
      videoEl.classList.add('hidden');
      renderStoryboardBeats(data);
    };

    videoEl.onended = () => {
      handleAdvance();
    };

    // Hide storyboard elements while video is actively playing
    if (storyboardEl) {
      storyboardEl.style.display = 'none';
      storyboardEl.classList.add('hidden');
    } else {
      if (speakerEl) speakerEl.style.display = 'none';
      if (textEl) textEl.style.display = 'none';
      if (progressEl) progressEl.style.display = 'none';
    }
  } else {
    // Storyboard mode (either no videoSrc or video errored)
    if (videoEl) {
      videoEl.style.display = 'none';
      videoEl.classList.add('hidden');
    }
    renderStoryboardBeats(data);
  }

  // Buttons wiring
  const nextBtn = document.getElementById('cutsceneNextBtn');
  if (nextBtn) {
    const isLast = (data.beatIndex + 1) >= (data.totalBeats || 1);
    nextBtn.textContent = isLast ? 'Finish' : 'Next >';
    nextBtn.onclick = () => handleAdvance();
  }

  const skipBtn = document.getElementById('cutsceneSkipBtn');
  if (skipBtn) {
    skipBtn.textContent = 'Skip';
    skipBtn.onclick = () => handleSkip();
  }
}

/**
 * Hide the cutscene modal and reset video playback.
 * Safe no-op if DOM elements are missing.
 */
export function hideCutscene() {
  if (typeof document === 'undefined') return;

  const modal = document.getElementById('cutsceneModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  const videoEl = document.getElementById('cutsceneVideo');
  if (videoEl) {
    try {
      videoEl.pause?.();
    } catch (e) {}
    videoEl.src = '';
    videoEl.style.display = 'none';
    videoEl.classList.add('hidden');
  }

  currentCutsceneId = null;
  videoErrored = false;
}

/**
 * Initialize cutscene UI module with optional dependencies.
 * @param {Object} [deps]
 * @param {Function} [deps.advanceBeat]
 * @param {Function} [deps.skipCutscene]
 */
export function initCutsceneUI(deps = {}) {
  uiDeps = deps;
  attachGlobalListeners();

  if (typeof document !== 'undefined') {
    const nextBtn = document.getElementById('cutsceneNextBtn');
    if (nextBtn) nextBtn.onclick = () => handleAdvance();

    const skipBtn = document.getElementById('cutsceneSkipBtn');
    if (skipBtn) skipBtn.onclick = () => handleSkip();
  }

  return {
    renderCutscene,
    hideCutscene,
    isCutsceneOpen,
    handleCutsceneKeydown,
    initCutsceneUI
  };
}

// Auto-register keydown listener if running in a browser environment
attachGlobalListeners();
