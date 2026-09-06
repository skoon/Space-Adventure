/**
 * Viewscreen UI Module
 *
 * A persistent image panel showing one static image for whatever the player is
 * currently doing. Scenes are pushed onto a priority stack rather than into a
 * single slot, so popping a combat scene reveals the ambient location scene
 * underneath without any caller re-setting it.
 *
 * Emoji remain the guaranteed baseline: if data/imagery.js has no record for a
 * requested ID, or the file 404s at runtime, the panel renders the caller's
 * emoji instead. It is never empty and never shows a broken-image icon.
 */

import {
    IMAGE_BASE,
    npcImages,
    enemyImages,
    bossImages,
    locationImages,
    districtImages,
    eventImages
} from '../../data/imagery.js';
import { t } from '../theme-engine.js';

/** Highest priority wins. An event overrides a boss overrides an enemy, and so on. */
const PRIORITY = { event: 40, boss: 35, enemy: 30, npc: 20, district: 15, location: 10 };

/** Shown when the caller passes no emoji and the registry has no art. */
const DEFAULT_EMOJI = { event: '✨', boss: '💀', enemy: '👾', npc: '🧑‍🚀', district: '🏢', location: '🪐' };

const REGISTRIES = {
    npc: npcImages,
    enemy: enemyImages,
    boss: bossImages,
    location: locationImages,
    district: districtImages,
    event: eventImages
};

const IDLE_EMOJI = '🛰️';
const IDLE_LABEL = 'STANDBY';
const FADE_MS = 200;

let deps = null;
/** One scene per kind, most recently pushed last. */
let stack = [];
/** Signature of what is painted right now; null means nothing has painted yet. */
let currentKey = null;
/** Serializes renders so two fast scene changes cannot interleave their fades. */
let renderChain = Promise.resolve();
/** Paths that already failed to load — never retried, so a 404 degrades once. */
const failedPaths = new Set();

/**
 * Initialize the viewscreen module
 */
export function initViewscreen(dependencies) {
    deps = dependencies;
    stack = [];
    currentKey = null;
    renderChain = Promise.resolve();
    failedPaths.clear();
    return render();
}

/**
 * Request the viewscreen show a scene.
 * @param {object} scene
 * @param {'npc'|'enemy'|'boss'|'location'|'district'|'event'} scene.kind
 * @param {string} scene.id        - registry key
 * @param {string} [scene.label]   - caption line 1; defaults to a sensible name
 * @param {string} [scene.sub]     - caption line 2 (faction, hazard level, HP, ...)
 * @param {string} [scene.emoji]   - fallback glyph when no image is registered
 * @param {number} [scene.priority]
 * @returns {Promise<void>} resolves once the swap has painted
 */
export function setScene(scene) {
    if (!scene || !scene.kind || !scene.id) return Promise.resolve();
    const entry = {
        ...scene,
        priority: typeof scene.priority === 'number' ? scene.priority : (PRIORITY[scene.kind] || 0)
    };
    stack = stack.filter((s) => s.kind !== scene.kind);
    stack.push(entry);
    return render();
}

/**
 * Pop back to whatever scene was showing before the current one.
 */
export function clearScene(kind) {
    stack = stack.filter((s) => s.kind !== kind);
    return render();
}

/**
 * Force the viewscreen back to the ambient location scene.
 */
export function resetViewscreen() {
    stack = stack.filter((s) => s.kind === 'location');
    return render();
}

/**
 * Repaint the current scene from scratch. Used when the imagery setting is
 * toggled, since the scene stack itself has not changed.
 */
export function repaintViewscreen() {
    currentKey = null;
    return render();
}

/**
 * Warm the browser cache for images the player is about to need.
 * @param {Array<{kind: string, id: string}>} scenes
 */
export function preloadScenes(scenes) {
    if (!Array.isArray(scenes) || !imagesEnabled() || typeof Image === 'undefined') return;
    scenes.forEach((scene) => {
        const record = lookup(scene && scene.kind, scene && scene.id);
        if (record) new Image().src = fullPath(record, '.webp');
    });
}

/**
 * Registry path for a thumbnail, or null when the ID has no art (or imagery is
 * switched off). Used by the dialogue avatar and the companion crew cards.
 */
export function getThumbPath(kind, id) {
    if (!imagesEnabled()) return null;
    const record = lookup(kind, id);
    return record ? fullPath(record, '-thumb.webp') : null;
}

/**
 * Fill an element with a portrait thumbnail, falling back to the emoji it has
 * always shown when there is no art, imagery is off, or the file fails to load.
 */
export function paintThumb(el, kind, id, emoji, alt) {
    if (!el) return;
    el.textContent = emoji || '';
    const path = getThumbPath(kind, id);
    if (!path) return;

    const img = document.createElement('img');
    img.className = 'viewscreen-thumb';
    img.alt = alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => {
        const record = (REGISTRIES[kind] || {})[id];
        if (record) failedPaths.add(record.path);
        el.textContent = emoji || '';
    };
    img.src = path;
    el.textContent = '';
    el.appendChild(img);
}

/* ---------------------------------------------------------------- internals */

function fullPath(record, suffix) {
    return `${IMAGE_BASE}${record.path}${suffix}`;
}

function lookup(kind, id) {
    const record = (REGISTRIES[kind] || {})[id];
    if (!record || failedPaths.has(record.path)) return null;
    return record;
}

function imagesEnabled() {
    if (deps && deps.settings && typeof deps.settings.getShowImages === 'function') {
        return deps.settings.getShowImages() !== false;
    }
    return true;
}

function elements() {
    const panel = document.getElementById('viewscreenPanel');
    if (!panel) return null;
    return {
        panel,
        frame: panel.querySelector('.viewscreen-frame') || panel,
        picture: document.getElementById('viewscreenPicture'),
        webp: document.getElementById('viewscreenWebp'),
        img: document.getElementById('viewscreenImage'),
        fallback: document.getElementById('viewscreenFallback'),
        label: document.getElementById('viewscreenLabel'),
        sub: document.getElementById('viewscreenSubLabel')
    };
}

/** Highest priority, ties broken by most recently pushed. */
function topScene() {
    return stack.reduce((best, scene) => (!best || scene.priority >= best.priority ? scene : best), null);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function render() {
    renderChain = renderChain.then(applyTop).catch((err) => {
        console.error('Viewscreen render failed:', err);
    });
    return renderChain;
}

async function applyTop() {
    const el = elements();
    if (!el) return;

    const scene = topScene();
    const record = scene && imagesEnabled() ? lookup(scene.kind, scene.id) : null;
    const key = scene
        ? `${scene.kind}|${scene.id}|${record ? record.path : ''}|${scene.label || ''}|${scene.sub || ''}`
        : 'idle';
    if (key === currentKey) return;

    const hadContent = currentKey !== null;
    currentKey = key;

    // Warm the cache while the outgoing image fades, so the incoming one is
    // usually decoded by the time the frame is empty.
    if (record && typeof Image !== 'undefined') new Image().src = fullPath(record, '.webp');

    if (hadContent) {
        el.frame.classList.add('viewscreen-swapping');
        await delay(FADE_MS);
    }
    paint(el, scene, record);
    el.frame.classList.remove('viewscreen-swapping');
}

function paint(el, scene, record) {
    if (record && record.accent) {
        el.panel.setAttribute('data-accent', record.accent);
    } else {
        el.panel.removeAttribute('data-accent');
    }

    if (record) {
        if (el.webp) el.webp.setAttribute('srcset', fullPath(record, '.webp'));
        if (el.img) {
            el.img.onerror = handleImageError;
            el.img.setAttribute('alt', record.alt || '');
            el.img.setAttribute('src', fullPath(record, '.jpg'));
        }
        if (el.picture) el.picture.classList.remove('hidden');
        if (el.fallback) el.fallback.classList.add('hidden');
    } else {
        showFallback(el, scene);
    }

    paintCaption(el, scene, record);
}

function showFallback(el, scene) {
    if (el.webp) el.webp.setAttribute('srcset', '');
    if (el.img) {
        el.img.onerror = null;
        el.img.removeAttribute('src');
        el.img.setAttribute('alt', '');
    }
    if (el.picture) el.picture.classList.add('hidden');
    if (el.fallback) {
        el.fallback.textContent = scene ? (scene.emoji || DEFAULT_EMOJI[scene.kind] || IDLE_EMOJI) : IDLE_EMOJI;
        el.fallback.classList.remove('hidden');
    }
}

function paintCaption(el, scene, record) {
    const label = scene ? (scene.label || scene.id) : IDLE_LABEL;
    const sub = scene ? (scene.sub || (record && record.caption) || '') : '';
    if (el.label) el.label.textContent = t(label);
    if (el.sub) el.sub.textContent = sub ? t(sub) : '';
}

/**
 * A registered file that fails to load degrades exactly like a missing key:
 * emoji plus caption. The path is blacklisted so it is not retried.
 */
function handleImageError() {
    const el = elements();
    if (!el) return;
    const scene = topScene();
    const record = scene ? (REGISTRIES[scene.kind] || {})[scene.id] : null;
    if (record) failedPaths.add(record.path);
    console.error('Viewscreen image failed to load:', record ? record.path : 'unknown');
    if (record && record.accent) el.panel.removeAttribute('data-accent');
    showFallback(el, scene);
}
