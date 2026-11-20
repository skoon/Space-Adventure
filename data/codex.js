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
        id: 'terra_prime_fed_hq',
        category: 'locations',
        title: 'Federation Command HQ',
        summary: 'Heavily fortified garrison headquarters and tactical war room on Terra Prime.',
        body: 'Rising above the central landing pad of Terra Prime, Federation Command HQ houses encrypted subspace relays, orbital defense arrays, and the sector tactical war room. Captain Vance coordinates patrols, bounty assignments, and convoy escorts from within its blast-shielded command deck.',
        unlockHint: 'Visit Federation Command HQ in Terra Prime Districts.'
    },
    {
        id: 'terra_prime_bazaar',
        category: 'locations',
        title: 'Bazaar District',
        summary: 'A bustling marketplace of merchants, salvagers, and off-world traders.',
        body: 'Stretching beneath weather-shielded canopies, the Bazaar District is Terra Prime’s commercial heart. Frontier prospectors trade salvaged alloys, medical synthesizers, and exotic rations alongside licensed Federation supply brokers.',
        unlockHint: 'Explore the Bazaar District in Terra Prime Districts.'
    },
    {
        id: 'terra_prime_residential',
        category: 'locations',
        title: 'Residential Sector',
        summary: 'Quiet civilian habitat domes, hydroponic gardens, and colony recreation zones.',
        body: 'Designed as a refuge from frontier hardship, the Residential Sector encloses terraced parks, atmospheric gardens, and modular living quarters beneath reinforced glass domes. Off-duty crews and civilian families gather here between orbital rotations.',
        unlockHint: 'Explore the Residential Sector in Terra Prime Districts.'
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
    {
        id: 'galactic_nexus',
        category: 'locations',
        title: 'Galactic Nexus Hub',
        summary: 'The primary interstellar commerce and social crossroads of the Helios Nexus Sector.',
        body: 'Positioned at the intersection of major hyperspace lanes, Galactic Nexus Hub is a sprawling orbital megastructure jointly patrolled under Federation charter. Traders, mercenaries, corporate brokers, and off-world colonists converge here to trade rare commodities on the live sector exchange, refit starship hulls, and gather frontier intelligence.',
        unlockHint: 'Dock at the Galactic Nexus Hub.'
    },
    {
        id: 'galactic_nexus_plaza',
        category: 'locations',
        title: 'Nexus Commerce Plaza',
        summary: 'The neon-lit central concourse of the Galactic Nexus Hub, bustling with interstellar trade.',
        body: 'Beneath towering holographic market tickers and multi-species trade kiosks, Nexus Commerce Plaza serves as the economic heart of the sector. Merchants hawking exotic tech, salvage brokers auctioning derelict components, and weary starfarers mingle beneath constant orbital security drones.',
        unlockHint: 'Visit the Nexus Commerce Plaza at Galactic Nexus Hub.'
    },
    {
        id: 'xylo_delta_smugglers_den',
        category: 'locations',
        title: "Smuggler's Den",
        summary: 'A fortified canyon hideout serving as the Void Corsairs\' regional smuggling headquarters.',
        body: 'Carved deep into the wind-scoured silicate cliffs of Xylo Delta, the Smuggler\'s Den is concealed from Federation orbital sensors by metallic dust storms and signal baffles. From its dimly lit cantina and black-market docking bays, Envoy Nesta coordinates blockade runs, contraband auctions, and Corsair raids across the rim.',
        unlockHint: "Visit Smuggler's Den in Xylo Delta Districts."
    },
    {
        id: 'xylo_delta_salvage_yard',
        category: 'locations',
        title: 'Scavenger Salvage Yard',
        summary: 'A sprawling graveyard of derelict starship hulls picked apart by desert salvagers.',
        body: 'Littered with the scorched skeletons of decommissioned frigates and crashed freighters, the Scavenger Salvage Yard echoes with plasma cutters and heavy arc welders. Engineer Jax \'Sparky\' Mercer operates his jury-rigged workshop amid the wreckage, stripping intact thrusters, hull plates, and power cores from the sand.',
        unlockHint: 'Visit the Scavenger Salvage Yard in Xylo Delta Districts.'
    },
    {
        id: 'nebula_outpost_summit_hall',
        category: 'locations',
        title: 'Crucible Summit Hall',
        summary: 'The grand diplomatic chamber inside Nebula Outpost hosting the Galactic Peace Summit.',
        body: 'Constructed within the reinforced central ring of Nebula Outpost, Crucible Summit Hall features tiered observation galleries, encrypted translation arrays, and neutralized weapon dampening fields. Delegates from the Federation, Void Corsairs, and Photon Prime Syndicate convene here to decide the fate of sector sovereignty.',
        unlockHint: 'Enter Crucible Summit Hall at Nebula Outpost.'
    },
    {
        id: 'nebula_outpost_hangars',
        category: 'locations',
        title: 'Docking Hangars',
        summary: 'Expansive orbital bays housing diplomatic shuttles, escort gunships, and frontier vessels.',
        body: 'Pressurized behind flickering ion containment fields, the Docking Hangars of Nebula Outpost handle constant arrivals from rival factions. Armed security detachments monitor every airlock umbilical while maintenance crews service diplomatic transports between volatile summit sessions.',
        unlockHint: 'Explore the Docking Hangars at Nebula Outpost.'
    },
    {
        id: 'norkon_outpost_lab',
        category: 'locations',
        title: 'Syndicate Singularity Lab',
        summary: 'A high-security Photon Prime Syndicate laboratory conducting quantum singularity research.',
        body: 'Housed behind triple-shielded bulkheads aboard Norkon Outpost, the Syndicate Singularity Lab is Dr. Elyse Thorne\'s primary research facility. Banks of quantum processors and gravimetric sensors monitor micro-singularity containment chambers as Syndicate scientists push the boundaries of energy extraction and neural ascension.',
        unlockHint: 'Visit the Syndicate Singularity Lab at Norkon Outpost.'
    },
    {
        id: 'norkon_outpost_reactor',
        category: 'locations',
        title: 'Singularity Core Reactor',
        summary: 'The volatile experimental power core driving Norkon Outpost\'s singularity lattice.',
        body: 'Suspended inside magnetic containment rings beneath Norkon Outpost, the Singularity Core Reactor harvests zero-point energy from a harnessed spatial rift. Even minor fluctuations in its quantum calibration threaten catastrophic radiation leaks or localized spacetime distortion.',
        unlockHint: 'Inspect the Singularity Core Reactor at Norkon Outpost.'
    },
    {
        id: 'inferno_ix_refinery',
        category: 'locations',
        title: 'Magma Extraction Refinery',
        summary: 'An armored volcanic processing plant harvesting superheated metals from Inferno-IX\'s lava flows.',
        body: 'Anchored over churning rivers of molten rock by heat-dissipating pylons, the Magma Extraction Refinery pumps raw planetary ore directly from tectonic vents. Automated smelters refine Titanium Ingots and contain volatile Plasma Cores under constant threat of solar flares and territorial Magma Elementals.',
        unlockHint: 'Explore the Magma Extraction Refinery on Inferno-IX.'
    },
    {
        id: 'crio_prime_vault',
        category: 'locations',
        title: 'Cryo-Genetic Vault',
        summary: 'An ancient subterranean archive buried beneath Crio-Prime\'s glaciers.',
        body: 'Sealed beneath kilometers of solid permafrost, the Cryo-Genetic Vault preserves frozen tissue samples, extinct alien DNA sequences, and early colonization bioweapon prototypes. Sub-zero failsafes keep its chambers locked in eternal stasis, though Frost Parasites and Cryo Drakes prowl the breached outer tunnels.',
        unlockHint: 'Explore the Cryo-Genetic Vault on Crio-Prime.'
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
        id: 'plasmavore',
        category: 'enemies',
        title: 'Plasmavores',
        summary: 'Coiling energy predators that siphon thermal and plasma discharges to fuel their attacks.',
        body: 'Plasmavores are silicon-plasma organisms native to high-energy zones across Terra Prime and Xylo Delta. Drawn to weapon discharges and exposed power conduits, their coiled bodies absorb ambient ionized gas and convert it into searing arcs of superheated plasma. Prospectors carry insulated plating when traversing territories where Plasmavores nest.',
        unlockHint: 'Defeat a Plasmavore on Terra Prime or Xylo Delta.'
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
    {
        id: 'nano_swarm',
        category: 'enemies',
        title: 'Nano Swarm',
        summary: 'A relentless cloud of self-replicating micro-drones that corrode armor and circuitry.',
        body: 'Originally deployed for hull repair aboard orbital depots, rogue Nano Swarms suffer from corrupted replication directives. Moving as a shimmering, buzzing haze through station corridors, they strip starship plating and overwhelm personal shields through thousands of simultaneous micro-discharges.',
        unlockHint: 'Defeat a Nano Swarm in combat at Nebula Outpost.'
    },
    {
        id: 'derelict_security_drone',
        category: 'enemies',
        title: 'Derelict Security Drone',
        summary: 'Battle-scarred automated patrol units still enforcing lockdown protocols on ghost ships.',
        body: 'Built to outlast their organic creators, Derelict Security Drones patrol dark, depressurized corridors with cracked optics and jury-rigged plasma emitters. Though centuries of micrometeorite impacts have scarred their chassis, their heavy armor plating and target-lock subroutines remain lethal to careless boarders.',
        unlockHint: 'Destroy a Derelict Security Drone aboard a derelict ship.'
    },
    {
        id: 'infestation_swarm',
        category: 'enemies',
        title: 'Infestation Swarm',
        summary: 'A chittering mass of bio-parasitic organisms thriving inside abandoned ship hulls.',
        body: 'Infestation Swarms incubate inside dormant life-support ducts and ruptured bio-containment bays aboard drifting wrecks. Sensitive to body heat and suit illumination, dozens of razor-mandibled parasites surge from vents in unison to tear through vacuum suits.',
        unlockHint: 'Eliminate an Infestation Swarm aboard a derelict ship.'
    },
    {
        id: 'mutated_crewmate',
        category: 'enemies',
        title: 'Mutated Crewmate',
        summary: 'Former starfarers warped by prolonged radiation, spores, and void exposure.',
        body: 'Trapped aboard disabled vessels for years without rescue, these unfortunate sailors were twisted by alien bio-contaminants and unshielded reactor leaks. Retaining fragments of muscle memory, Mutated Crewmates lurch through shadowed bulkheads wielding improvised pipes and industrial tools with unnatural strength.',
        unlockHint: 'Defeat a Mutated Crewmate aboard a derelict ship.'
    },
    {
        id: 'void_corsair_raider',
        category: 'enemies',
        title: 'Void Corsair Raider',
        summary: 'Cutthroat pirate boarders outfitted in vacuum-sealed assault armor.',
        body: 'Hardened veterans of rim-world ambushes, Void Corsair Raiders specialize in high-risk derelict salvage and hostile ship-to-ship boarding actions. Equipped with reinforced mag-boots, thermal cutters, and high-output energy carbines, they shoot first and loot whatever remains.',
        unlockHint: 'Defeat a Void Corsair Raider aboard a derelict ship.'
    },
    {
        id: 'magma_elemental',
        category: 'enemies',
        title: 'Magma Elemental',
        summary: 'Volatile living constructs of molten stone and superheated plasma native to Inferno-IX.',
        body: 'Born within the tectonic crucibles of Inferno-IX, Magma Elementals bind glowing basalt shards together with unstable thermal cores. When fatally destabilized in combat, their superheated shells detonate in a violent blast that showers the battlefield in burning slag.',
        unlockHint: 'Defeat a Magma Elemental on Inferno-IX.'
    },
    {
        id: 'ashen_hulk',
        category: 'enemies',
        title: 'Ashen Hulk',
        summary: 'Towering obsidian-armored behemoths fueled by volcanic fury.',
        body: 'Encased in thick plates of cooled volcanic glass, Ashen Hulks shrug off casual small-arms fire while advancing inexorably across slag fields. When severely wounded, the molten fissures beneath their armor flare violently, driving them into an enraged state capable of shattering defensive stances.',
        unlockHint: 'Defeat an Ashen Hulk on Inferno-IX.'
    },
    {
        id: 'frost_parasite',
        category: 'enemies',
        title: 'Frost Parasite',
        summary: 'Crystalline cold-adapted scavengers that siphon thermal energy from prey and equipment.',
        body: 'Translucent and razor-edged, Frost Parasites burrow through Crio-Prime\'s snowdrifts toward any detectable heat signature. Latching onto insulated suits and robotic joints, they rapidly drain thermal reserves to sustain their crystalline carapaces.',
        unlockHint: 'Defeat a Frost Parasite on Crio-Prime.'
    },
    {
        id: 'cryo_drake',
        category: 'enemies',
        title: 'Cryo Drake',
        summary: 'Apex glacial predators whose sub-zero breath freezes armor before a shattering strike.',
        body: 'Winged reptilian predators native to Crio-Prime\'s jagged ice ridges, Cryo Drakes condense supercooled atmospheric gases within specialized throat sacs. They immobilize prey in encasing ice blasts before diving in with devastating shatter strikes.',
        unlockHint: 'Defeat a Cryo Drake on Crio-Prime.'
    },
    {
        id: 'eldritch_shade',
        category: 'enemies',
        title: 'Eldritch Shade',
        summary: 'Formless void apparitions that phase through solid bulkheads aboard ancient wrecks.',
        body: 'Born from prolonged exposure to unshielded Precursor warp cores, Eldritch Shades flicker between physical space and subspace static. Their ghostly tendrils bypass heavy armor with ease, leaving frost-rimed hull scars and scrambled sensor logs in their wake.',
        unlockHint: 'Banish an Eldritch Shade aboard a derelict ship.'
    },
    {
        id: 'security_sentinel',
        category: 'enemies',
        title: 'Security Sentinel',
        summary: 'Heavy Precursor defense units engineered to drain energy shields and disable intruders.',
        body: 'More advanced than standard patrol drones, Security Sentinels hover silently through high-clearance derelict vaults on gravitic repulsors. Their energy tendrils siphon power directly from enemy shields and weapon capacitors before delivering precision counter-strikes.',
        unlockHint: 'Defeat a Security Sentinel aboard a derelict ship.'
    },
    {
        id: 'great_sandworm',
        category: 'enemies',
        title: 'The Great Sandworm',
        summary: 'An ancient apex leviathan dominating the deepest dunes of Xylo Delta.',
        body: 'Towering above ordinary desert annelids, The Great Sandworm is a centuries-old terror revered in Corsair cautionary tales. Its armored carapace turns aside orbital bombardment, and when wounded it burrows beneath the silicate crust to reinforce its defenses before lunging upward to devour entire landing craft.',
        unlockHint: 'Defeat The Great Sandworm boss on Xylo Delta.'
    },
    {
        id: 'void_stalker_alpha',
        category: 'enemies',
        title: 'Void Stalker Alpha',
        summary: 'An apex extra-dimensional predator that tears open shadow rifts inside Nebula Outpost.',
        body: 'Far larger and more cunning than common pack Stalkers, Void Stalker Alpha commands the outer ion clouds surrounding Nebula Outpost. Capable of cloaking itself completely in distorted void light, it ambushes intruders with lethal Shadow Rifts that shred shields and hull integrity alike.',
        unlockHint: 'Defeat Void Stalker Alpha in boss combat at Nebula Outpost.'
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
    },
    {
        id: 'nesta',
        category: 'characters',
        title: 'Envoy Nesta',
        summary: 'The shrewd and charismatic smuggling boss leading the Void Corsairs on Xylo Delta.',
        body: 'Operating out of the hidden Smuggler\'s Den on Xylo Delta, Envoy Nesta commands the loyalty of rim-world freebooters through sharp negotiation and fearless defiance of Federation blockades. Whether orchestrating daring customs vault heists or championing Corsair independence at the Galactic Peace Summit, Nesta always keeps an escape vector open.',
        unlockHint: "Speak with Envoy Nesta at the Smuggler's Den on Xylo Delta."
    },
    {
        id: 'mercer',
        category: 'characters',
        title: "Jax 'Sparky' Mercer",
        summary: 'An eccentric salvage engineer turning Xylo Delta\'s wrecked hulls into working tech.',
        body: 'With grease-stained coveralls and arc-welding goggles permanently perched on his brow, Jax \'Sparky\' Mercer knows the wiring schematic of every freighter ever built. Operating from the Scavenger Salvage Yard, he trades top credits for high-grade Plasma Cores and spare components to keep his heavy cutting rigs running.',
        unlockHint: "Speak with Jax 'Sparky' Mercer at the Scavenger Salvage Yard on Xylo Delta."
    },
    {
        id: 'delegates',
        category: 'characters',
        title: 'Summit Delegates',
        summary: 'High-ranking representatives of the Federation, Void Corsairs, and Syndicate.',
        body: 'Convened inside Nebula Outpost\'s Crucible Summit Hall, the Summit Delegates embody the fragile diplomatic balance of the Helios Nexus Sector. Locked in bitter debate over Precursor weapons caches and territorial sovereignty, their final decree depends heavily on the telemetry and testimony delivered by independent captains.',
        unlockHint: 'Address the Summit Delegates at Crucible Summit Hall on Nebula Outpost.'
    },
    {
        id: 'ai',
        category: 'characters',
        title: 'Ship AI S.A.M.',
        summary: 'The shipboard Systems Analysis Matrix managing navigation, sensors, and tactical alerts.',
        body: 'Integrated into every deck of your vessel, S.A.M. monitors hyperspace jump vectors, life-support reserves, and gravimetric threat telemetry in real time. Though bound by crisp diagnostic protocols, S.A.M.\'s dry tactical commentary and unwavering situational awareness make the AI an indispensable co-pilot across uncharted space.',
        unlockHint: 'Consult Ship AI S.A.M. during ship operations or dialogue.'
    }
];
