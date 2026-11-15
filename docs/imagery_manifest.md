# Imagery Manifest

Every ID the viewscreen can request, whether art exists today, and the emoji
that stands in when it does not. This is the shopping list for future art.

Registry: [`data/imagery.js`](../data/imagery.js). Sources live in
`assets/portraits/` (untouched masters); optimized outputs are generated into
`assets/images/` by `npm run optimize-images`.

A missing key is a supported state — the viewscreen renders the emoji instead.
Nothing breaks when art is absent.

## Output variants

| Variant | Size | Quality | Used by |
|---|---|---|---|
| `<name>.webp` | 512×512 | 80 (stepped down to fit 60 KB) | viewscreen `<source>` |
| `<name>.jpg` | 512×512 | 78 (stepped down to fit 60 KB) | `<picture>` fallback |
| `<name>-thumb.webp` | 128×128 | 75 (fits 12 KB) | dialogue avatar, companion cards |

## NPCs

Keys match the `NPCS` map in `systems/ui/dialogue-ui.js`.

| ID | Name | Art | File | Emoji stand-in |
|---|---|---|---|---|
| `vance` | Vance | ✅ | `npcs/captain_vance` | 🦾 |
| `lyra` | Dr. Lyra | ✅ | `npcs/dr_lyra` | 🔬 |
| `apex` | Apex | ✅ | `npcs/apex` | 🔫 |
| `nesta` | Envoy Nesta | ✅ | `npcs/nesta` | 🦹 |
| `thorne` | Dr. Elyse Thorne | ✅ | `npcs/thorne` | 👩‍🔬 |
| `mercer` | Jax 'Sparky' Mercer | ✅ | `npcs/mercer` | 🔧 |
| `delegates` | Summit Delegates | ✅ | `npcs/delegates` | 🏛️ |
| `ai` | Ship AI (S.A.M.) | ✅ | `npcs/ai` | 🤖 |
| `terminal` | Data Mainframe | ✅ | `npcs/terminal` | 💾 |
| `generic` | Sector Liaison | ✅ | `npcs/generic` | 🧑‍🚀 |

## Enemies

Keys match the `name` field in `data/enemies.js`. No enemy has an emoji in the
game today, so the viewscreen's per-kind default (👾) stands in.

| ID | Art | File |
|---|---|---|
| `Xenobot` | ✅ | `enemies/xenobot` |
| `Plasmavore` | ✅ | `enemies/plasmavore` |
| `Sand Worm` | ✅ | `enemies/sand_worm` |
| `Void Stalker` | ✅ | `enemies/void_stalker` |
| `Mutated Crewmate` | ✅ | `enemies/mutated_crewmate` |
| `Void Corsair Raider` | ✅ | `enemies/corsair_raider` |
| `Magma Elemental` | ✅ | `enemies/magma_elemental` |
| `Cryo Drake` | ✅ | `enemies/cryo_drake` |
| `Eldritch Shade` | ✅ | `enemies/eldritch_shade` |
| `Nano Swarm` | ✅ | `enemies/nano_swarm` |
| `Derelict Security Drone` | ✅ | `enemies/derelict_security_drone` |
| `Infestation Swarm` | ✅ | `enemies/infestation_swarm` |
| `Ashen Hulk` | ✅ | `enemies/ashen_hulk` |
| `Frost parasite` | ✅ | `enemies/frost_parasite` |
| `Security Sentinel` | ✅ | `enemies/security_sentinel` |

## Bosses

Keys match `bosses[].id` in `data/enemies.js`. Three bosses reuse the matching
enemy art; `boss_terra` has none.

| ID | Boss | Art | File |
|---|---|---|---|
| `boss_xylo` | The Great Sandworm | ✅ | `enemies/sand_worm` (shared) |
| `boss_nebula` | Void Stalker Alpha | ✅ | `enemies/void_stalker` (shared) |
| `boss_derelict` | Void Sentinel Alpha | ✅ | `enemies/void_sentinel` |
| `boss_terra` | Overlord Xylar | ✅ | `bosses/overlord_xylar` |

`enemies/void_sentinel` is used only by the boss — there is no plain
"Void Sentinel" enemy in `data/enemies.js`.

## Locations

Keys match `id` in `data/locations.js`. The viewscreen's per-kind default
(🪐) stands in for the ones still missing art.

| ID | Name | Hazard | Art | File |
|---|---|---|---|---|
| `terra_prime` | Terra Prime | 1 | ✅ | `locations/terra_prime` |
| `galactic_nexus` | Galactic Nexus Hub | 1 | ✅ | `locations/galactic_nexus` |
| `norkon_outpost` | Norkon Outpost | 3 | ✅ | `locations/norkon_outpost` |
| `xylo_delta` | Xylo Delta | 2 | ✅ | `locations/xylo_delta` |
| `nebula_outpost` | Nebula Outpost | 3 | ✅ | `locations/nebula_outpost` |
| `inferno_ix` | Inferno-IX | 4 | ✅ | `locations/inferno_ix` |
| `crio_prime` | Crio-Prime | 4 | ✅ | `locations/crio_prime` |

## Districts

Keys match `districts[].id` in `data/locations.js`. The emoji stand-in is each
district's own `icon`.

| ID | Name | Art | Emoji stand-in |
|---|---|---|---|
| `terra_prime_bazaar` | Bazaar District | ✅ `npcs/merchant` | 🛍️ |
| `terra_prime_fed_hq` | Federation Command HQ | ✅ `districts/terra_prime_fed_hq` | 🏢 |
| `terra_prime_residential` | Residential Sector | ✅ `districts/terra_prime_residential` | 🏡 |
| `xylo_delta_smugglers_den` | Smuggler's Den | ✅ `districts/xylo_delta_smugglers_den` | ☠️ |
| `xylo_delta_salvage_yard` | Scavenger Salvage Yard | ✅ `districts/xylo_delta_salvage_yard` | 🔧 |
| `nebula_outpost_summit_hall` | Crucible Summit Hall | ✅ `districts/nebula_outpost_summit_hall` | 🏛️ |
| `nebula_outpost_hangars` | Docking Hangars | ✅ `districts/nebula_outpost_hangars` | 🛸 |
| `norkon_outpost_lab` | Syndicate Singularity Lab | ✅ `districts/norkon_outpost_lab` | 🧪 |
| `norkon_outpost_reactor` | Singularity Core Reactor | ✅ `districts/norkon_outpost_reactor` | ⚡ |
| `inferno_ix_refinery` | Magma Extraction Refinery | ✅ `districts/inferno_ix_refinery` | 🏭 |
| `crio_prime_vault` | Cryo-Genetic Vault | ✅ `districts/crio_prime_vault` | ❄️ |
| `galactic_nexus_plaza` | Nexus Commerce Plaza | ✅ `districts/galactic_nexus_plaza` | 🌌 |

`merchant.jpg` is a character portrait with no matching NPC ID — there is no
merchant in the `NPCS` map. It is registered against the Bazaar District, whose
description is "a bustling marketplace filled with traders, merchants, and
colonists". Move it if a merchant NPC is ever added to the dialogue map.

## Events

Slugs passed by the caller at the hook site.

| Slug | Trigger | Art | Emoji stand-in |
|---|---|---|---|
| `derelict_boarding` | `startDerelictRun()` | ✅ `events/derelict_boarding` | 🛸 |
| `hyperspace` | `playTravelAnimation()` | ✅ `events/hyperspace` | ✨ |

## Turning imagery off

Settings → Display → **Viewscreen Imagery**. When unchecked, the viewscreen and
the portrait chips render emoji only — the pre-image experience, intact. The
choice persists in the existing `galactic_odyssey_settings` key.

## Priority art gaps

All currently requested location, district, event, NPC, enemy, and boss IDs
have registered art. Emoji fallback remains supported for future IDs.
