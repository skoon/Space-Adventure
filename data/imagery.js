/**
 * Image registry for the viewscreen. Pure data — no logic.
 *
 * Keys are the game's own IDs so lookups need no translation layer:
 *   npcImages      → keys of the NPCS map in systems/ui/dialogue-ui.js
 *   enemyImages    → the `name` field in data/enemies.js
 *   bossImages     → `bosses[].id` in data/enemies.js
 *   locationImages → `id` in data/locations.js
 *   districtImages → `districts[].id` in data/locations.js
 *   eventImages    → event/scene slug passed by the caller
 *
 * `path` is extension-less and relative to IMAGE_BASE; the renderer appends
 * `.webp`, `.jpg`, or `-thumb.webp`.
 *
 * A missing key is a SUPPORTED state, not a bug — the viewscreen falls back to
 * the emoji it has always shown. Only keys whose files exist on disk appear
 * here; every ID without art is listed as a comment so the gap stays visible.
 * See docs/imagery_manifest.md for the full art shopping list.
 */

export const IMAGE_BASE = 'assets/images/';

/** @typedef {{ path: string, alt: string, caption?: string, accent?: string }} ImageRecord */

/** @type {Record<string, ImageRecord>} */
export const npcImages = {
    vance: { path: 'npcs/captain_vance', alt: 'Captain Valen Vance, cyborg scrapper', accent: 'blue' },
    lyra: { path: 'npcs/dr_lyra', alt: 'Dr. Lyra, android medic', accent: 'cyan' },
    apex: { path: 'npcs/apex', alt: 'Apex, human smuggler', accent: 'red' }
    // no art yet: nesta, thorne, mercer, delegates, ai, terminal, generic
};

/** @type {Record<string, ImageRecord>} */
export const enemyImages = {
    'Xenobot': { path: 'enemies/xenobot', alt: 'Xenobot combat drone', accent: 'red' },
    'Plasmavore': { path: 'enemies/plasmavore', alt: 'Plasmavore, a coiling energy predator', accent: 'red' },
    'Sand Worm': { path: 'enemies/sand_worm', alt: 'Sand Worm erupting from the dunes', accent: 'red' },
    'Void Stalker': { path: 'enemies/void_stalker', alt: 'Void Stalker prowling the dark', accent: 'red' },
    'Mutated Crewmate': { path: 'enemies/mutated_crewmate', alt: 'Mutated crewmate of a derelict ship', accent: 'red' },
    'Void Corsair Raider': { path: 'enemies/corsair_raider', alt: 'Void Corsair raider in boarding armor', accent: 'red' },
    'Magma Elemental': { path: 'enemies/magma_elemental', alt: 'Magma Elemental wreathed in molten rock', accent: 'red' },
    'Cryo Drake': { path: 'enemies/cryo_drake', alt: 'Cryo Drake, an ice-scaled predator', accent: 'red' },
    'Eldritch Shade': { path: 'enemies/eldritch_shade', alt: 'Eldritch Shade, a formless void apparition', accent: 'red' }
    // no art yet: Nano Swarm, Derelict Security Drone, Infestation Swarm,
    //             Ashen Hulk, Frost parasite, Security Sentinel
};

/** @type {Record<string, ImageRecord>} */
export const bossImages = {
    boss_xylo: { path: 'enemies/sand_worm', alt: 'The Great Sandworm rearing over the desert', accent: 'red' },
    boss_nebula: { path: 'enemies/void_stalker', alt: 'Void Stalker Alpha, cloaked and circling', accent: 'red' },
    boss_derelict: { path: 'enemies/void_sentinel', alt: 'Void Sentinel Alpha, a gravitic construct', accent: 'red' }
    // no art yet: boss_terra (Overlord Xylar)
};

/** @type {Record<string, ImageRecord>} */
export const locationImages = {
    'terra_prime': { path: 'locations/terra_prime', alt: 'Terra Prime, a bustling spaceport city', accent: 'orange' },
    'galactic_nexus': { path: 'locations/galactic_nexus', alt: 'Galactic Nexus, a hub of interstellar trade', accent: 'purple' },
    'norkon_outpost': { path: 'locations/norkon_outpost', alt: 'Norkon Outpost, a remote research station', accent: 'green' }
    // no art yet: terra_prime, xylo_delta, nebula_outpost, norkon_outpost,
    //             inferno_ix, crio_prime, galactic_nexus
};

/** @type {Record<string, ImageRecord>} */
export const districtImages = {
    terra_prime_bazaar: { path: 'npcs/merchant', alt: 'A bazaar merchant hawking local wares', accent: 'orange' }
    // no art yet: terra_prime_fed_hq, terra_prime_residential,
    //             xylo_delta_smugglers_den, xylo_delta_salvage_yard,
    //             nebula_outpost_summit_hall, nebula_outpost_hangars,
    //             norkon_outpost_lab, norkon_outpost_reactor,
    //             inferno_ix_refinery, crio_prime_vault, galactic_nexus_plaza
};

/** @type {Record<string, ImageRecord>} */
export const eventImages = {
    // no art yet: derelict_boarding, hyperspace
};
