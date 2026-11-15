/**
 * systems/cutscene.js
 * Cinematic cutscene engine managing narrative story beats, cutscene state,
 * and audio/visual event dispatching.
 */

import { cutscenes as defaultCutscenes } from '../data/cutscenes.js';
import { eventEmitter as defaultEventEmitter } from './eventEmitter.js';

let state = null;
let ui = null;
let eventEmitter = null;
let customCutscenes = null;
let activeCutscene = null;

/**
 * Get the active event emitter instance (dependency or fallback singleton).
 */
function getEventEmitter() {
  return eventEmitter || defaultEventEmitter;
}

/**
 * Get registry of available cutscenes.
 */
function getCutscenesRegistry() {
  return customCutscenes || defaultCutscenes;
}

/**
 * Trigger UI render callback if available in dependencies.
 */
function triggerUIRender(cutsceneData) {
  if (typeof ui === 'function') {
    ui(cutsceneData);
  } else if (ui && typeof ui.renderCutscene === 'function') {
    ui.renderCutscene(cutsceneData);
  }
}

/**
 * Trigger UI hide callback if available in dependencies.
 */
function triggerUIHide() {
  if (ui && typeof ui.hideCutscene === 'function') {
    ui.hideCutscene();
  } else if (ui && typeof ui.renderCutscene === 'function') {
    ui.renderCutscene(null);
  } else if (typeof ui === 'function') {
    ui(null);
  }
}

/**
 * Ensures state.cutscenesSeen exists as an array (handles older saves).
 * @returns {string[]} Array of cutscene IDs seen.
 */
export function ensureCutsceneState() {
  if (!state) return [];
  if (!Array.isArray(state.cutscenesSeen)) {
    state.cutscenesSeen = [];
  }
  return state.cutscenesSeen;
}

/**
 * Initialize the cutscene system with dependencies.
 * @param {Object} [deps]
 * @param {Object} [deps.state] Central game state
 * @param {Object|Function} [deps.ui] UI presentation controller
 * @param {Object} [deps.eventEmitter] Custom event emitter
 * @param {Object} [deps.cutscenes] Custom cutscenes registry override
 */
export function initCutscene(deps = {}) {
  state = deps.state || null;
  ui = deps.ui || null;
  eventEmitter = deps.eventEmitter || null;
  customCutscenes = deps.cutscenes || null;
  activeCutscene = null;

  ensureCutsceneState();

  return {
    initCutscene,
    hasSeenCutscene,
    playCutscene,
    advanceBeat,
    skipCutscene,
    endCutscene,
    getActiveCutscene,
    ensureCutsceneState
  };
}

/**
 * Check whether a cutscene has already been seen in this save.
 * @param {string} id Cutscene identifier
 * @returns {boolean}
 */
export function hasSeenCutscene(id) {
  ensureCutsceneState();
  return Boolean(state?.cutscenesSeen && state.cutscenesSeen.includes(id));
}

/**
 * Start playing a cutscene by ID.
 * @param {string} id
 * @param {Object} [options]
 * @param {boolean} [options.force=false] Replay even if already seen
 * @param {Function} [options.onComplete] Callback invoked when cutscene ends or is skipped
 * @returns {boolean} True if cutscene started, false if skipped/missing
 */
export function playCutscene(id, { force = false, onComplete } = {}) {
  const registry = getCutscenesRegistry();
  const cutscene = registry ? registry[id] : null;

  if (!cutscene) {
    if (typeof onComplete === 'function') onComplete();
    return false;
  }

  if (hasSeenCutscene(id) && !force) {
    if (typeof onComplete === 'function') onComplete();
    return false;
  }

  // If a cutscene is already running, gracefully end it before starting the new one
  if (activeCutscene) {
    endCutscene();
  }

  ensureCutsceneState();
  if (state && !state.cutscenesSeen.includes(id)) {
    state.cutscenesSeen.push(id);
  }

  activeCutscene = {
    cutscene,
    beatIndex: 0,
    onComplete: typeof onComplete === 'function' ? onComplete : null
  };

  const ee = getEventEmitter();
  ee?.emit('cutsceneStart', { id });

  const current = getActiveCutscene();
  triggerUIRender(current);
  return true;
}

/**
 * Advance to the next beat of the active cutscene.
 * If at the last beat, finishes the cutscene.
 * @returns {Object|null} New active cutscene state or null if finished.
 */
export function advanceBeat() {
  if (!activeCutscene) return null;

  const beats = activeCutscene.cutscene?.beats || [];
  const nextIndex = activeCutscene.beatIndex + 1;

  if (nextIndex >= beats.length) {
    endCutscene();
    return null;
  }

  activeCutscene.beatIndex = nextIndex;
  const current = getActiveCutscene();

  if (current?.beat) {
    const ee = getEventEmitter();
    ee?.emit('cutsceneBeat', current.beat);
  }

  triggerUIRender(current);
  return current;
}

/**
 * End and clear the currently active cutscene, invoking completion callback.
 */
export function endCutscene() {
  if (!activeCutscene) return;

  const id = activeCutscene.cutscene?.id;
  const cb = activeCutscene.onComplete;
  activeCutscene = null;

  const ee = getEventEmitter();
  ee?.emit('cutsceneEnd', { id });

  triggerUIHide();

  if (typeof cb === 'function') {
    try {
      cb();
    } catch (err) {
      console.error('Error in cutscene onComplete callback:', err);
    }
  }
}

/**
 * Skip cutscene (alias for endCutscene).
 */
export function skipCutscene() {
  endCutscene();
}

/**
 * Get data snapshot of the currently active cutscene.
 * @returns {{ cutscene: Object, beatIndex: number, beat: Object|null, totalBeats: number }|null}
 */
export function getActiveCutscene() {
  if (!activeCutscene) return null;
  const beats = activeCutscene.cutscene?.beats || [];
  return {
    cutscene: activeCutscene.cutscene,
    beatIndex: activeCutscene.beatIndex,
    beat: beats[activeCutscene.beatIndex] || null,
    totalBeats: beats.length
  };
}
