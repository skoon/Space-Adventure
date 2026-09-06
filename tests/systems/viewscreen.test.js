/**
 * @jest-environment jsdom
 */
import {
    initViewscreen,
    setScene,
    clearScene,
    resetViewscreen,
    repaintViewscreen,
    getThumbPath,
    paintThumb
} from '../../systems/ui/viewscreen.js';
import { npcImages, enemyImages, IMAGE_BASE } from '../../data/imagery.js';

const PANEL_HTML = `
<div id="viewscreenPanel" class="viewscreen-panel">
  <div class="viewscreen-frame">
    <picture id="viewscreenPicture" class="hidden">
      <source id="viewscreenWebp" type="image/webp" srcset="">
      <img id="viewscreenImage" src="" alt="" loading="lazy" decoding="async">
    </picture>
    <div id="viewscreenFallback" class="viewscreen-fallback">🛰️</div>
    <div class="hologram-scanline"></div>
  </div>
  <div class="viewscreen-caption">
    <span id="viewscreenLabel" class="viewscreen-label">STANDBY</span>
    <span id="viewscreenSubLabel" class="viewscreen-sublabel"></span>
  </div>
</div>`;

/** Registered art used across the suite — asserted to exist so a registry rename fails loudly. */
const VANCE = npcImages.vance;
const XENOBOT = enemyImages['Xenobot'];

let showImages;

function mount(settings = {}) {
    document.body.innerHTML = PANEL_HTML;
    showImages = true;
    return initViewscreen({
        state: {},
        settings: { getShowImages: () => showImages, ...settings }
    });
}

const el = (id) => document.getElementById(id);
const panel = () => el('viewscreenPanel');
const isHidden = (node) => node.classList.contains('hidden');

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
    await resetViewscreen();
    await clearScene('location');
    jest.restoreAllMocks();
});

describe('viewscreen rendering', () => {
    test('registry fixtures used by this suite exist', () => {
        expect(VANCE).toBeDefined();
        expect(XENOBOT).toBeDefined();
    });

    test('a registered key renders <picture> with the right srcset and hides the fallback', async () => {
        await mount();
        await setScene({ kind: 'npc', id: 'vance', label: 'Vance', sub: 'Federation', emoji: '🦾' });

        expect(el('viewscreenWebp').getAttribute('srcset')).toBe(`${IMAGE_BASE}${VANCE.path}.webp`);
        expect(el('viewscreenImage').getAttribute('src')).toBe(`${IMAGE_BASE}${VANCE.path}.jpg`);
        expect(el('viewscreenImage').getAttribute('alt')).toBe(VANCE.alt);
        expect(isHidden(el('viewscreenPicture'))).toBe(false);
        expect(isHidden(el('viewscreenFallback'))).toBe(true);
        expect(el('viewscreenLabel').textContent).toBe('Vance');
        expect(el('viewscreenSubLabel').textContent).toBe('Federation');
    });

    test('the record accent drives data-accent on the panel', async () => {
        await mount();
        await setScene({ kind: 'npc', id: 'vance', label: 'Vance' });
        expect(panel().getAttribute('data-accent')).toBe(VANCE.accent);

        await setScene({ kind: 'npc', id: 'nesta', label: 'Nesta', emoji: '🦹' });
        expect(panel().hasAttribute('data-accent')).toBe(false);
    });

    test('an unregistered key hides <picture> and renders the emoji fallback with the caption intact', async () => {
        await mount();
        await setScene({ kind: 'npc', id: 'nesta', label: 'Envoy Nesta', sub: 'Void Corsairs', emoji: '🦹' });

        expect(isHidden(el('viewscreenPicture'))).toBe(true);
        expect(isHidden(el('viewscreenFallback'))).toBe(false);
        expect(el('viewscreenFallback').textContent).toBe('🦹');
        expect(el('viewscreenImage').hasAttribute('src')).toBe(false);
        expect(el('viewscreenLabel').textContent).toBe('Envoy Nesta');
        expect(el('viewscreenSubLabel').textContent).toBe('Void Corsairs');
    });

    test('an unregistered key with no emoji falls back to the per-kind default', async () => {
        await mount();
        await setScene({ kind: 'location', id: 'terra_prime', label: 'Terra Prime' });
        expect(el('viewscreenFallback').textContent).toBe('🪐');
    });

    test('img.onerror falls back to emoji', async () => {
        await mount();
        await setScene({ kind: 'enemy', id: 'Xenobot', label: 'Xenobot', emoji: '👾' });
        expect(isHidden(el('viewscreenPicture'))).toBe(false);

        el('viewscreenImage').dispatchEvent(new Event('error'));

        expect(isHidden(el('viewscreenPicture'))).toBe(true);
        expect(isHidden(el('viewscreenFallback'))).toBe(false);
        expect(el('viewscreenFallback').textContent).toBe('👾');
        expect(el('viewscreenLabel').textContent).toBe('Xenobot');
    });

    test('a path that failed once is not retried', async () => {
        await mount();
        await setScene({ kind: 'enemy', id: 'Xenobot', label: 'Xenobot', emoji: '👾' });
        el('viewscreenImage').dispatchEvent(new Event('error'));

        await clearScene('enemy');
        await setScene({ kind: 'enemy', id: 'Xenobot', label: 'Xenobot', emoji: '👾' });

        expect(isHidden(el('viewscreenPicture'))).toBe(true);
        expect(el('viewscreenFallback').textContent).toBe('👾');
    });

    test('nothing on the stack shows the standby caption, never an empty panel', async () => {
        await mount();
        expect(el('viewscreenLabel').textContent).toBe('STANDBY');
        expect(isHidden(el('viewscreenFallback'))).toBe(false);
        expect(el('viewscreenFallback').textContent).toBe('🛰️');
    });
});

describe('priority stack', () => {
    test('pushing enemy over location shows the enemy; clearing it restores the location', async () => {
        await mount();
        await setScene({ kind: 'location', id: 'terra_prime', label: 'Terra Prime', sub: 'HAZARD LVL 1', emoji: '🪐' });
        expect(el('viewscreenLabel').textContent).toBe('Terra Prime');

        await setScene({ kind: 'enemy', id: 'Xenobot', label: 'Xenobot', sub: 'HP 65/65' });
        expect(el('viewscreenLabel').textContent).toBe('Xenobot');
        expect(isHidden(el('viewscreenPicture'))).toBe(false);

        await clearScene('enemy');
        expect(el('viewscreenLabel').textContent).toBe('Terra Prime');
        expect(el('viewscreenSubLabel').textContent).toBe('HAZARD LVL 1');
        expect(isHidden(el('viewscreenPicture'))).toBe(true);
        expect(el('viewscreenFallback').textContent).toBe('🪐');
    });

    test('a lower-priority scene pushed under the current one does not steal the panel', async () => {
        await mount();
        await setScene({ kind: 'enemy', id: 'Xenobot', label: 'Xenobot' });
        await setScene({ kind: 'location', id: 'terra_prime', label: 'Terra Prime', emoji: '🪐' });
        expect(el('viewscreenLabel').textContent).toBe('Xenobot');
    });

    test('an event outranks a boss, which outranks an enemy', async () => {
        await mount();
        await setScene({ kind: 'enemy', id: 'Xenobot', label: 'Xenobot' });
        await setScene({ kind: 'boss', id: 'boss_derelict', label: 'Void Sentinel Alpha' });
        expect(el('viewscreenLabel').textContent).toBe('Void Sentinel Alpha');

        await setScene({ kind: 'event', id: 'hyperspace', label: 'HYPERSPACE TRANSIT', emoji: '✨' });
        expect(el('viewscreenLabel').textContent).toBe('HYPERSPACE TRANSIT');

        await clearScene('event');
        expect(el('viewscreenLabel').textContent).toBe('Void Sentinel Alpha');
        await clearScene('boss');
        expect(el('viewscreenLabel').textContent).toBe('Xenobot');
    });

    test('setting the same kind twice replaces rather than stacks', async () => {
        await mount();
        await setScene({ kind: 'npc', id: 'vance', label: 'Vance' });
        await setScene({ kind: 'npc', id: 'lyra', label: 'Dr. Lyra' });
        expect(el('viewscreenLabel').textContent).toBe('Dr. Lyra');

        await clearScene('npc');
        expect(el('viewscreenLabel').textContent).toBe('STANDBY');
    });

    test('resetViewscreen drops everything above the ambient location scene', async () => {
        await mount();
        await setScene({ kind: 'location', id: 'terra_prime', label: 'Terra Prime', emoji: '🪐' });
        await setScene({ kind: 'npc', id: 'vance', label: 'Vance' });
        await setScene({ kind: 'event', id: 'hyperspace', label: 'HYPERSPACE', emoji: '✨' });

        await resetViewscreen();
        expect(el('viewscreenLabel').textContent).toBe('Terra Prime');
    });
});

describe('showImages setting', () => {
    test('showImages: false forces the emoji path regardless of registry contents', async () => {
        await mount();
        showImages = false;
        await setScene({ kind: 'npc', id: 'vance', label: 'Vance', sub: 'Federation', emoji: '🦾' });

        expect(isHidden(el('viewscreenPicture'))).toBe(true);
        expect(isHidden(el('viewscreenFallback'))).toBe(false);
        expect(el('viewscreenFallback').textContent).toBe('🦾');
        expect(el('viewscreenLabel').textContent).toBe('Vance');
        expect(panel().hasAttribute('data-accent')).toBe(false);
    });

    test('toggling the setting repaints the panel in place', async () => {
        await mount();
        await setScene({ kind: 'npc', id: 'vance', label: 'Vance', emoji: '🦾' });
        expect(isHidden(el('viewscreenPicture'))).toBe(false);

        showImages = false;
        await repaintViewscreen();
        expect(isHidden(el('viewscreenPicture'))).toBe(true);

        showImages = true;
        await repaintViewscreen();
        expect(isHidden(el('viewscreenPicture'))).toBe(false);
    });

    test('getThumbPath returns the thumb variant, or null when art is missing or imagery is off', async () => {
        await mount();
        expect(getThumbPath('npc', 'vance')).toBe(`${IMAGE_BASE}${VANCE.path}-thumb.webp`);
        expect(getThumbPath('npc', 'nesta')).toBe(null);
        expect(getThumbPath('bogus', 'vance')).toBe(null);

        showImages = false;
        expect(getThumbPath('npc', 'vance')).toBe(null);
    });
});

describe('paintThumb', () => {
    test('renders the thumbnail when art exists', async () => {
        await mount();
        const host = document.createElement('div');
        paintThumb(host, 'npc', 'lyra', '🔬', 'Dr. Lyra');

        const img = host.querySelector('img');
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toContain('-thumb.webp');
        expect(img.getAttribute('alt')).toBe('Dr. Lyra');
    });

    test('leaves the emoji in place when no art is registered', async () => {
        await mount();
        const host = document.createElement('div');
        paintThumb(host, 'npc', 'mercer', '🔧', 'Mercer');

        expect(host.querySelector('img')).toBeNull();
        expect(host.textContent).toBe('🔧');
    });

    test('reverts to the emoji when the thumbnail fails to load', async () => {
        await mount();
        const host = document.createElement('div');
        paintThumb(host, 'npc', 'apex', '🔫', 'Apex');

        host.querySelector('img').dispatchEvent(new Event('error'));
        expect(host.querySelector('img')).toBeNull();
        expect(host.textContent).toBe('🔫');
    });
});

describe('missing DOM', () => {
    test('scene calls are no-ops when the panel is not in the document', async () => {
        document.body.innerHTML = '';
        await initViewscreen({ state: {}, settings: { getShowImages: () => true } });
        await expect(setScene({ kind: 'npc', id: 'vance', label: 'Vance' })).resolves.toBeUndefined();
    });
});
