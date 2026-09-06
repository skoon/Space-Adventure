/**
 * @jest-environment jsdom
 *
 * Guards the seam between index.html and the viewscreen module: the panel's
 * element IDs live in markup, so a rename there would otherwise silently turn
 * every scene call into a no-op.
 */
import fs from 'fs';
import path from 'path';
import { initViewscreen, setScene, clearScene } from '../../systems/ui/viewscreen.js';

const INDEX = path.join(__dirname, '..', '..', 'index.html');

test('the real index.html markup drives the viewscreen module', async () => {
    const html = fs.readFileSync(INDEX, 'utf8');
    document.documentElement.innerHTML = html.slice(html.indexOf('<body'), html.indexOf('</body>'));

    await initViewscreen({ state: {}, settings: { getShowImages: () => true } });
    expect(document.getElementById('viewscreenPanel')).not.toBeNull();
    expect(document.getElementById('viewscreenLabel').textContent).toBe('STANDBY');

    await setScene({ kind: 'location', id: 'terra_prime', label: 'Terra Prime', sub: 'HAZARD LVL 1', emoji: '🪐' });
    expect(document.getElementById('viewscreenFallback').textContent).toBe('🪐');
    expect(document.getElementById('viewscreenSubLabel').textContent).toBe('HAZARD LVL 1');

    await setScene({ kind: 'npc', id: 'vance', label: 'Vance', sub: 'Federation', emoji: '🦾' });
    expect(document.getElementById('viewscreenImage').getAttribute('src')).toContain('captain_vance.jpg');
    expect(document.getElementById('viewscreenWebp').getAttribute('srcset')).toContain('captain_vance.webp');
    expect(document.getElementById('viewscreenPanel').getAttribute('data-accent')).toBe('blue');

    await clearScene('npc');
    expect(document.getElementById('viewscreenLabel').textContent).toBe('Terra Prime');
});
