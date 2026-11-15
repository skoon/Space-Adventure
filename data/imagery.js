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
    apex: { path: 'npcs/apex', alt: 'Apex, human smuggler', accent: 'red' },
    nesta: { path: 'npcs/nesta', alt: 'Envoy Nesta, Void Corsair smuggling boss', accent: 'red' },
    thorne: { path: 'npcs/thorne', alt: 'Dr. Elyse Thorne, singularity researcher', accent: 'purple' },
    mercer: { path: 'npcs/mercer', alt: "Jax 'Sparky' Mercer, salvage engineer", accent: 'amber' },
    delegates: { path: 'npcs/delegates', alt: 'Three faction delegates at the peace summit', accent: 'teal' },
    ai: { path: 'npcs/ai', alt: 'S.A.M., the ship AI holographic core', accent: 'cyan' },
    terminal: { path: 'npcs/terminal', alt: 'Ancient data mainframe with a crystalline core', accent: 'green' },
    generic: { path: 'npcs/generic', alt: 'Independent sector liaison', accent: 'amber' }
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
    'Eldritch Shade': { path: 'enemies/eldritch_shade', alt: 'Eldritch Shade, a formless void apparition', accent: 'red' },
    'Nano Swarm': { path: 'enemies/nano_swarm', alt: 'A malevolent swarm of self-replicating nanobots', accent: 'purple' },
    'Derelict Security Drone': { path: 'enemies/derelict_security_drone', alt: 'Battle-scarred derelict security drone', accent: 'red' },
    'Infestation Swarm': { path: 'enemies/infestation_swarm', alt: 'Alien parasite swarm infesting a derelict corridor', accent: 'green' },
    'Ashen Hulk': { path: 'enemies/ashen_hulk', alt: 'Ashen Hulk with molten seams beneath obsidian armor', accent: 'red' },
    'Frost parasite': { path: 'enemies/frost_parasite', alt: 'Crystalline frost parasite of Crio-Prime', accent: 'cyan' },
    'Security Sentinel': { path: 'enemies/security_sentinel', alt: 'Armored security sentinel with energy tendrils', accent: 'blue' }
};

/** @type {Record<string, ImageRecord>} */
export const bossImages = {
    boss_xylo: { path: 'enemies/sand_worm', alt: 'The Great Sandworm rearing over the desert', accent: 'red' },
    boss_nebula: { path: 'enemies/void_stalker', alt: 'Void Stalker Alpha, cloaked and circling', accent: 'red' },
    boss_derelict: { path: 'enemies/void_sentinel', alt: 'Void Sentinel Alpha, a gravitic construct', accent: 'red' },
    boss_terra: { path: 'bosses/overlord_xylar', alt: 'Overlord Xylar, armored warlord of Terra Prime', accent: 'red' }
};

/** @type {Record<string, ImageRecord>} */
export const locationImages = {
    'terra_prime': { path: 'locations/terra_prime', alt: 'Terra Prime, a bustling spaceport city', accent: 'orange' },
    'galactic_nexus': { path: 'locations/galactic_nexus', alt: 'Galactic Nexus, a hub of interstellar trade', accent: 'purple' },
    'norkon_outpost': { path: 'locations/norkon_outpost', alt: 'Norkon Outpost, a remote research station', accent: 'green' },
    'xylo_delta': { path: 'locations/xylo_delta', alt: 'Xylo Delta, a Corsair scavenger frontier', accent: 'red' },
    'nebula_outpost': { path: 'locations/nebula_outpost', alt: 'Nebula Outpost adrift inside a purple and teal nebula', accent: 'purple' },
    'inferno_ix': { path: 'locations/inferno_ix', alt: 'Inferno-IX, a volcanic refinery world', accent: 'purple' },
    'crio_prime': { path: 'locations/crio_prime', alt: 'Crio-Prime, a frozen Federation world', accent: 'blue' }
};

/** @type {Record<string, ImageRecord>} */
export const districtImages = {
    terra_prime_bazaar: { path: 'npcs/merchant', alt: 'A bazaar merchant hawking local wares', accent: 'orange' },
    terra_prime_fed_hq: { path: 'districts/terra_prime_fed_hq', alt: 'Federation Command headquarters tactical war room', accent: 'blue' },
    terra_prime_residential: { path: 'districts/terra_prime_residential', alt: 'Warm residential habitats and gardens beneath a dome', accent: 'amber' },
    xylo_delta_smugglers_den: { path: 'districts/xylo_delta_smugglers_den', alt: 'Hidden Corsair smugglers den carved into a canyon', accent: 'red' },
    xylo_delta_salvage_yard: { path: 'districts/xylo_delta_salvage_yard', alt: 'Xylo Delta salvage yard filled with starship hulls', accent: 'amber' },
    nebula_outpost_summit_hall: { path: 'districts/nebula_outpost_summit_hall', alt: 'Three factions convene in the Crucible Summit Hall', accent: 'teal' },
    nebula_outpost_hangars: { path: 'districts/nebula_outpost_hangars', alt: 'Diplomatic shuttles crowd the Nebula Outpost hangars', accent: 'teal' },
    norkon_outpost_lab: { path: 'districts/norkon_outpost_lab', alt: 'Syndicate singularity research laboratory', accent: 'purple' },
    norkon_outpost_reactor: { path: 'districts/norkon_outpost_reactor', alt: 'Unstable singularity core reactor', accent: 'purple' },
    inferno_ix_refinery: { path: 'districts/inferno_ix_refinery', alt: 'Magma extraction refinery amid active lava flows', accent: 'red' },
    crio_prime_vault: { path: 'districts/crio_prime_vault', alt: 'Ancient cryo-genetic vault buried beneath ice', accent: 'cyan' },
    galactic_nexus_plaza: { path: 'districts/galactic_nexus_plaza', alt: 'Crowded multi-species commerce plaza at Galactic Nexus', accent: 'orange' }
};

/** @type {Record<string, ImageRecord>} */
export const eventImages = {
    derelict_boarding: { path: 'events/derelict_boarding', alt: 'A ship extends an airlock umbilical into a dark derelict', accent: 'red' },
    hyperspace: { path: 'events/hyperspace', alt: 'A starship punches into a blue-white hyperspace tunnel', accent: 'cyan' }
};
