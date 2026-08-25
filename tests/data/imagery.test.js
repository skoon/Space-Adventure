/**
 * @jest-environment node
 *
 * A typo'd registry key is a silent no-op at runtime — the viewscreen just
 * falls back to emoji forever. These tests turn that into a failing build.
 */
import fs from 'fs';
import path from 'path';
import {
    IMAGE_BASE,
    npcImages,
    enemyImages,
    bossImages,
    locationImages,
    districtImages
} from '../../data/imagery.js';
import { enemies, bosses } from '../../data/enemies.js';
import { locations } from '../../data/locations.js';

const ROOT = path.join(__dirname, '..', '..');

/** The NPC keys the dialogue engine can produce, read from its own source. */
function dialogueNpcKeys() {
    const src = fs.readFileSync(path.join(ROOT, 'systems', 'ui', 'dialogue-ui.js'), 'utf8');
    const map = src.slice(src.indexOf('const NPCS = {'), src.indexOf('};', src.indexOf('const NPCS = {')));
    return [...map.matchAll(/^\s{4}(\w+):\s*\{/gm)].map((m) => m[1]);
}

const enemyNames = enemies.map((e) => e.name);
const bossIds = bosses.map((b) => b.id);
const locationIds = Object.keys(locations);
const districtIds = locationIds.flatMap((id) => (locations[id].districts || []).map((d) => d.id));

describe('imagery registry keys match real game IDs', () => {
    test('every NPC key exists in the dialogue NPCS map', () => {
        const valid = dialogueNpcKeys();
        expect(valid.length).toBeGreaterThan(0);
        Object.keys(npcImages).forEach((key) => expect(valid).toContain(key));
    });

    test('every enemy key matches an enemy name in data/enemies.js', () => {
        Object.keys(enemyImages).forEach((key) => expect(enemyNames).toContain(key));
    });

    test('every boss key matches a boss id in data/enemies.js', () => {
        Object.keys(bossImages).forEach((key) => expect(bossIds).toContain(key));
    });

    test('every location key matches a location id in data/locations.js', () => {
        Object.keys(locationImages).forEach((key) => expect(locationIds).toContain(key));
    });

    test('every district key matches a district id in data/locations.js', () => {
        Object.keys(districtImages).forEach((key) => expect(districtIds).toContain(key));
    });
});

describe('imagery registry records', () => {
    const allRecords = [npcImages, enemyImages, bossImages, locationImages, districtImages]
        .flatMap((registry) => Object.entries(registry));

    test('the registry is not accidentally empty', () => {
        expect(allRecords.length).toBeGreaterThan(0);
    });

    test.each(allRecords)('%s has alt text and an extension-less path', (key, record) => {
        expect(typeof record.alt).toBe('string');
        expect(record.alt.length).toBeGreaterThan(0);
        expect(record.path).not.toMatch(/\.(webp|jpg|jpeg|png)$/);
    });

    test.each(allRecords)('%s uses a functional accent color', (key, record) => {
        if (record.accent === undefined) return;
        expect(['orange', 'red', 'green', 'blue', 'cyan', 'amber']).toContain(record.accent);
    });

    test.each(allRecords)('%s has all three image variants on disk', (key, record) => {
        ['.webp', '.jpg', '-thumb.webp'].forEach((suffix) => {
            const file = path.join(ROOT, IMAGE_BASE, `${record.path}${suffix}`);
            expect(fs.existsSync(file)).toBe(true);
        });
    });
});
