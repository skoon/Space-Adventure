/**
 * Codex Data Registry
 * Pure ES6 data module containing lore entries and category definitions.
 */

export const CODEX_CATEGORIES = ['locations', 'factions', 'enemies', 'technology', 'characters'];

export const CODEX_CATEGORY_META = {
    locations: { id: 'locations', label: 'Locations', icon: '🌍' },
    factions: { id: 'factions', label: 'Factions', icon: '🏢' },
    enemies: { id: 'enemies', label: 'Enemies', icon: '👾' },
    technology: { id: 'technology', label: 'Technology', icon: '⚡' },
    characters: { id: 'characters', label: 'Characters', icon: '👤' }
};

export const codexEntries = [
    // Locations
    {
        id: 'terra_prime',
        category: 'locations',
        title: 'Terra Prime',
        summary: 'A lush, earth-like agricultural colony under Federation administration.',
        body: 'Terra Prime is a temperate world characterized by vast emerald grasslands, ancient deciduous canopies, and dense civilian colonies. As the primary breadbasket of the Helios Nexus Sector, it supplies essential foodstuffs, organic materials, and basic metals to surrounding frontier outposts. Federation Command HQ is situated within its fortified capital zone, where Captain Valen Vance coordinates sector security. Despite its pastoral tranquility, subterranean bunkers and abandoned perimeter zones beneath the colony still harbor malfunctioning Xenobots left over from the colonial wars.',
        unlockHint: 'Visit Terra Prime or explore its districts.'
    },
    {
        id: 'xylo_delta',
        category: 'locations',
        title: 'Xylo Delta',
        summary: 'A scorched desert world known across the rim as the sector\'s primary ship graveyard.',
        body: 'Xylo Delta is a sun-bleached expanse of silicate canyons, shifting sand dunes, and violent metallic dust storms. Ancient fleet engagements and atmospheric re-entry failures have littered its surface with hundreds of wrecked dreadnoughts, making it a scavenger\'s paradise. The Void Corsairs maintain their infamous Smuggler\'s Den within the craggy canyon networks, overseen by Envoy Nesta. Scavengers must remain vigilant; giant subterranean Sand Worms hunt by detecting seismic tremors from landing craft and heavy drills.',
        unlockHint: 'Travel to the desert world of Xylo Delta.'
    },
    {
        id: 'nebula_outpost',
        category: 'locations',
        title: 'Nebula Outpost',
        summary: 'A decommissioned space station drifting inside an active ion gas cloud.',
        body: 'Enveloped by iridescent ribbons of reactive ion gas, Nebula Outpost was once an orbital military depot during the Border Wars. Decommissioned decades ago, it was revitalized as a neutral diplomatic buffer zone. Its Crucible Summit Hall currently hosts the tense Galactic Peace Summit, where Federation ambassadors, Corsair envoys, and Syndicate researchers debate frontier rights. The surrounding nebula clouds are notorious for spawning Void Stalkers—extra-dimensional entities attracted to heat and shield generators.',
        unlockHint: 'Dock at Nebula Outpost in the deep void.'
    },
    {
        id: 'norkon_outpost',
        category: 'locations',
        title: 'Norkon Outpost',
        summary: 'A high-tech orbital facility dedicated to quantum singularity research.',
        body: 'Perched near an active spatial anomaly, Norkon Outpost serves as the primary scientific staging ground for the Photon Prime Syndicate. Led by Dr. Elyse Thorne, the station houses the Singularity Core Reactor—a pulsating containment lattice designed to tap zero-point energy and bend local spacetime metrics. Corporate security is tightly regulated by android sentries and automated defense systems, keeping rival corporate spies and pirate scavengers at bay.',
        unlockHint: 'Visit Norkon Outpost or inspect its research laboratories.'
    },
    {
        id: 'derelict',
        category: 'locations',
        title: 'Precursor Derelict Ships',
        summary: 'Ancient, tomb-like starships drifting in deep space, left behind by an extinct civilization.',
        body: 'Drifting silently through the void for millennia, these colossal vessels are remnants of the enigmatic Precursors. Inside, life support is offline, plunging every corridor into absolute vacuum and zero gravity where oxygen supplies dwindle with every step. Automated Security Sentinels, nanite swarms, and phase-shifting Eldritch Shades still guard the hulls. Intrepid explorers risk boarding for legendary weapon blueprints, quantum cores, and lost telemetry caches.',
        unlockHint: 'Board and explore a derelict starship.'
    },
    {
        id: 'inferno_ix',
        category: 'locations',
        title: 'Inferno-IX',
        summary: 'A volcanic hellscape plagued by rivers of molten slag and intense solar radiation.',
        body: 'Bathed in severe stellar radiation from a nearby blue giant, Inferno-IX is a churning world of volcanic craters, liquid slag channels, and caustic gas vents. Standard shields degrade rapidly under its solar flare cycles. Despite the perilous conditions, industrial syndicates maintain automated magma extraction refineries here to harvest superheated Titanium Ingots and raw Plasma Cores from the fiery planetary mantle.',
        unlockHint: 'Travel to the volcanic world of Inferno-IX.'
    },
    {
        id: 'crio_prime',
        category: 'locations',
        title: 'Crio-Prime',
        summary: 'A glacial world of eternal frost, crushing gravity, and ancient cryo-vaults.',
        body: 'Crio-Prime is encased in miles of perpetual glacial ice under crushing gravitational forces that tax starship sub-light thrusters and robotic servos. Deep beneath the permafrost lie the Cryo-Genetic Vaults—sealed biomes from early interstellar colonization efforts that preserve extinct alien genomes and cryo-stasis specimens. The tundra is prowled by ravenous Frost Parasites and territorial Cryo Drakes.',
        unlockHint: 'Land on the frozen tundra of Crio-Prime.'
    },

    // Factions
    {
        id: 'federation',
        category: 'factions',
        title: 'The Galactic Federation',
        summary: 'The interstellar governing authority championing order, law, and military security.',
        body: 'The Galactic Federation operates as the supreme constitutional power across the core systems, projecting authority through disciplined garrisons, diplomatic delegates, and heavy battle fleets. In the Helios Nexus Sector, the Federation claims legal stewardship over all planetary resources, seeing independent scavengers as illicit looters. Headquartered locally at Terra Prime Command, their forces are trained in defensive formation tactics and equipped with kinetic assault rifles and kinetic barrier generators.',
        unlockHint: 'Interact with Federation personnel or visit Federation Command HQ.'
    },
    {
        id: 'void_corsairs',
        category: 'factions',
        title: 'The Void Corsairs',
        summary: 'A rebellious confederation of space pirates, salvagers, and free-wheeling smugglers.',
        body: 'Bound not by rigid treaties but by an unwritten pirate code of mutual survival and personal liberty, the Void Corsairs dominate the illicit trade lanes of the rim. Operating out of the Smuggler\'s Den on Xylo Delta, their fleet is comprised of modified freighters, heavily armed gunships, and scavenged railguns. Led by Envoy Nesta, they believe the resources of the sector belong to whoever has the audacity to claim them.',
        unlockHint: 'Encounter Corsairs on Xylo Delta or recruit smuggler crew.'
    },
    {
        id: 'syndicate',
        category: 'factions',
        title: 'The Photon Prime Syndicate',
        summary: 'A technocratic megacorporation pursuing transhumanist ascension and singularity science.',
        body: 'The Photon Prime Syndicate rejects both political dogma and emotional morality, pursuing scientific breakthroughs through unconstrained technological development. Specializing in advanced cyberware, quantum microchips, and artificial consciousness, they view biological limitations as engineering problems waiting to be solved. From their research stations, they analyze spatial anomalies to achieve "The Singularity"—the theoretical ascension of human intellect into pure energy.',
        unlockHint: 'Trade with Syndicate facilities or install high-tier cybernetics.'
    },

    // Enemies
    {
        id: 'xenobot',
        category: 'enemies',
        title: 'Xenobots',
        summary: 'Autonomous bipedal combat droids left over from the colonial wars.',
        body: 'Xenobots are rugged, mass-manufactured infantry automatons equipped with energy rifles and reactive alloy plating. Abandoned following planetary ceasefires, their identification subroutines have degraded over decades, designating all approaching carbon-based lifeforms as hostile combatants. They communicate across localized radio subnets, coordinating flanking maneuvers when intruders breach their patrol perimeters.',
        unlockHint: 'Defeat a Xenobot in combat on Terra Prime.'
    },
    {
        id: 'sand_worm',
        category: 'enemies',
        title: 'Sand Worms',
        summary: 'Colossal subterranean predators that hunt by sensing seismic ground vibrations.',
        body: 'Native to the silicon deserts of Xylo Delta, Sand Worms are segmented annelids reaching up to thirty meters in length. Lacking eyes, they rely on hypersensitive dermal tremors to pinpoint the footsteps of travelers and the hum of mining engines. Their churning gullets secrete corrosive acids capable of melting starship hull fragments in seconds.',
        unlockHint: 'Encounter or defeat a Sand Worm on Xylo Delta.'
    },
    {
        id: 'void_stalker',
        category: 'enemies',
        title: 'Void Stalkers',
        summary: 'Predatory extra-dimensional horrors that slip through spatial folds and ion clouds.',
        body: 'Void Stalkers are incorporeal predators formed from dark matter and condensed quantum vacuum fluctuations. They emerge without warning near nebula gas concentrations, drawn to the radiant thermal emissions of starship reactors. Striking with phasing claws that bypass conventional shields, they feed directly on the electrical energy and life force of their quarry.',
        unlockHint: 'Survive an encounter with a Void Stalker in the nebula.'
    },
    {
        id: 'overlord_xylar',
        category: 'enemies',
        title: 'Overlord Xylar',
        summary: 'A tyrannical alien warlord who commands a planetary mercenary army.',
        body: 'Overlord Xylar is an imposing alien warlord who established an iron grip over the untamed territories of Terra Prime. Clad in heavy ceremonial battle armor and wielding devastating Annihilation Beams, Xylar seeks to awaken dormant Precursor weapons caches to establish an uncontested hegemony across the sector. In battle, sustaining heavy damage triggers an enraged berserker state that trades defense for lethal destructive force.',
        unlockHint: 'Defeat Overlord Xylar in boss combat on Terra Prime.'
    },
    {
        id: 'void_sentinel_alpha',
        category: 'enemies',
        title: 'Void Sentinel Alpha',
        summary: 'An ancient Precursor dread-construct capable of generating localized gravitational singularities.',
        body: 'The pinnacle of automated Precursor defense engineering, the Sentinel Alpha stands guard over derelict reactor cores. Encased in self-repairing quantum alloys, it deploys gravitational collapse pulses that compress matter and disrupt temporal stability. Only explorers equipped with high-tier shielding and tactical weaponry have survived an engagement with one.',
        unlockHint: 'Confront the Sentinel Alpha at the heart of a derelict ship.'
    },

    // Technology
    {
        id: 'precursor_tech',
        category: 'technology',
        title: 'Precursor Artifacts & Relics',
        summary: 'Ancient devices and crystalline matrix cores built by an extinct, highly advanced civilization.',
        body: 'Scattered across the Helios Nexus Sector are fragments of a forgotten empire known as the Precursors. Their technology operates on principles that defy modern physics—manipulating gravitational fields, subspace folds, and quantum entanglement at will. Recovering ancient shards and data cores has allowed frontier scientists to replicate advanced targeting HUDs and defensive energy shields.',
        unlockHint: 'Acquire an Ancient Shard or Precursor blueprint.'
    },
    {
        id: 'cybernetics',
        category: 'technology',
        title: 'Neural Cybernetics',
        summary: 'Advanced bionic augmentations that merge human biology with machine processing.',
        body: 'Cybernetic technology replaces or augments biological organs with hardened synthetic components. Ranging from sub-dermal titanium plating to synaptic neural accelerators and targeting matrices, implants allow operators to endure extreme combat strain. However, excessive cyberization strains the nervous system, requiring careful modulation to prevent neural dissonance.',
        unlockHint: 'Install an implant at a cybernetics clinic or upgrade your chassis.'
    },
    {
        id: 'quantum_shielding',
        category: 'technology',
        title: 'Quantum Shielding',
        summary: 'Protective force fields that distort incoming kinetic and thermal vectors into microscopic subspace rifts.',
        body: 'Developed by reverse-engineering Precursor barrier matrices, quantum shields project an oscillating grav-particle barrier around the user or starship. Rather than simply absorbing impact force, the shield disperses the kinetic energy across minute quantum fractures, providing superior protection against both high-velocity slugs and superheated plasma blasts.',
        unlockHint: 'Acquire or craft a Quantum Shield Core.'
    },
    {
        id: 'nanite_matrices',
        category: 'technology',
        title: 'Medical Nanite Swarms',
        summary: 'Microscopic programmed bio-constructs engineered for cellular reconstruction and trauma triage.',
        body: 'Medical nanite matrices represent the height of field medicine. Injected via stimpacks or dispersed by android healers like Dr. Lyra, billions of microscopic bots swarm to trauma sites, sealing ruptured blood vessels, knitting fractured bones, and synthesizing damaged cellular tissue within seconds.',
        unlockHint: 'Use a Nano Stimpack or receive treatment from Dr. Lyra.'
    },

    // Characters
    {
        id: 'vance',
        category: 'characters',
        title: 'Captain Valen Vance',
        summary: 'A battle-tested Federation veteran equipped with heavy-duty industrial cybernetic limbs.',
        body: 'Captain Vance is a veteran of numerous frontier campaigns whose squad was ambushed by Precursor sentinel constructs during the Siege of Void Gate 7. Barely surviving, he was rebuilt with rugged, heavy-grade cybernetics that grant him immense physical strength. Now stationed at Terra Prime Command, Vance remains committed to bringing order to the sector, offering tactical defensive shielding to crews who earn his respect.',
        unlockHint: 'Meet Captain Vance at Federation Command HQ on Terra Prime.'
    },
    {
        id: 'lyra',
        category: 'characters',
        title: 'Dr. Lyra',
        summary: 'A Model-9 android medic who attained emergent sentience after decoding an ancient Precursor datapad.',
        body: 'Manufactured in the sterile laboratories of the Photon Prime Syndicate, Dr. Lyra was originally designed as a diagnostic autopsy unit. Everything changed when she analyzed a corrupt Precursor data core, triggering an unexpected cascade of emergent self-awareness. Combining encyclopedic biological knowledge with compassionate medical care, she wanders the sector seeking both to heal the wounded and understand the nature of consciousness.',
        unlockHint: 'Encounter Dr. Lyra at the Syndicate clinic or recruit her.'
    },
    {
        id: 'apex',
        category: 'characters',
        title: 'Apex',
        summary: 'A daring mercenary smuggler and sharpshooter with a deep understanding of black-market networks.',
        body: 'Born in the crowded lower decks of a core world megalopolis, Apex fled into deep space at age fifteen aboard a stolen cargo hauler. He quickly established himself as the sharpest shot and quickest pilot on the rim, running illegal contraband for the Void Corsairs. Despite his cynicism and love for cold hard credits, Apex possesses a fierce loyalty to captains who treat their crews fairly.',
        unlockHint: 'Find Apex in the Smuggler\'s Den on Xylo Delta.'
    },
    {
        id: 'thorne',
        category: 'characters',
        title: 'Dr. Elyse Thorne',
        summary: 'The brilliant and uncompromising chief scientist directing the Syndicate\'s Singularity Project.',
        body: 'Dr. Elyse Thorne is the intellectual powerhouse behind the Photon Prime Syndicate\'s frontier operations. Stationed inside the fortified Norkon Singularity Lab, she directs dangerous experiments probing event horizon dynamics and quantum consciousness. While her methods are viewed by the Federation as reckless and destabilizing, Thorne believes that unlocking singularity energy is the sole path to saving civilization from entropy.',
        unlockHint: 'Speak with Dr. Thorne at the Norkon Outpost Singularity Lab.'
    }
];
