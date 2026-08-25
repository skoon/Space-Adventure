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
| `nesta` | Envoy Nesta | ❌ | — | 🦹 |
| `thorne` | Dr. Elyse Thorne | ❌ | — | 👩‍🔬 |
| `mercer` | Jax 'Sparky' Mercer | ❌ | — | 🔧 |
| `delegates` | Summit Delegates | ❌ | — | 🏛️ |
| `ai` | Ship AI (S.A.M.) | ❌ | — | 🤖 |
| `terminal` | Data Mainframe | ❌ | — | 💾 |
| `generic` | Sector Liaison | ❌ | — | 🧑‍🚀 |

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
| `Nano Swarm` | ❌ | — |
| `Derelict Security Drone` | ❌ | — |
| `Infestation Swarm` | ❌ | — |
| `Ashen Hulk` | ❌ | — |
| `Frost parasite` | ❌ | — |
| `Security Sentinel` | ❌ | — |

## Bosses

Keys match `bosses[].id` in `data/enemies.js`. Three bosses reuse the matching
enemy art; `boss_terra` has none.

| ID | Boss | Art | File |
|---|---|---|---|
| `boss_xylo` | The Great Sandworm | ✅ | `enemies/sand_worm` (shared) |
| `boss_nebula` | Void Stalker Alpha | ✅ | `enemies/void_stalker` (shared) |
| `boss_derelict` | Void Sentinel Alpha | ✅ | `enemies/void_sentinel` |
| `boss_terra` | Overlord Xylar | ❌ | — |

`enemies/void_sentinel` is used only by the boss — there is no plain
"Void Sentinel" enemy in `data/enemies.js`.

## Locations

Keys match `id` in `data/locations.js`. No location art exists yet; the
viewscreen's per-kind default (🪐) stands in for all of them.

| ID | Name | Hazard | Art |
|---|---|---|---|
| `terra_prime` | Terra Prime | 1 | ❌ |
| `xylo_delta` | Xylo Delta | 2 | ❌ |
| `nebula_outpost` | Nebula Outpost | 3 | ❌ |
| `norkon_outpost` | Norkon Outpost | 3 | ❌ |
| `inferno_ix` | Inferno-IX | 4 | ❌ |
| `crio_prime` | Crio-Prime | 4 | ❌ |
| `galactic_nexus` | Galactic Nexus Hub | 1 | ❌ |

## Districts

Keys match `districts[].id` in `data/locations.js`. The emoji stand-in is each
district's own `icon`.

| ID | Name | Art | Emoji stand-in |
|---|---|---|---|
| `terra_prime_bazaar` | Bazaar District | ✅ `npcs/merchant` | 🛍️ |
| `terra_prime_fed_hq` | Federation Command HQ | ❌ | 🏢 |
| `terra_prime_residential` | Residential Sector | ❌ | 🏡 |
| `xylo_delta_smugglers_den` | Smuggler's Den | ❌ | ☠️ |
| `xylo_delta_salvage_yard` | Scavenger Salvage Yard | ❌ | 🔧 |
| `nebula_outpost_summit_hall` | Crucible Summit Hall | ❌ | 🏛️ |
| `nebula_outpost_hangars` | Docking Hangars | ❌ | 🛸 |
| `norkon_outpost_lab` | Syndicate Singularity Lab | ❌ | 🧪 |
| `norkon_outpost_reactor` | Singularity Core Reactor | ❌ | ⚡ |
| `inferno_ix_refinery` | Magma Extraction Refinery | ❌ | 🏭 |
| `crio_prime_vault` | Cryo-Genetic Vault | ❌ | ❄️ |
| `galactic_nexus_plaza` | Nexus Commerce Plaza | ❌ | 🌌 |

`merchant.jpg` is a character portrait with no matching NPC ID — there is no
merchant in the `NPCS` map. It is registered against the Bazaar District, whose
description is "a bustling marketplace filled with traders, merchants, and
colonists". Move it if a merchant NPC is ever added to the dialogue map.

## Events

Slugs passed by the caller at the hook site.

| Slug | Trigger | Art | Emoji stand-in |
|---|---|---|---|
| `derelict_boarding` | `startDerelictRun()` | ❌ | 🛸 |
| `hyperspace` | `playTravelAnimation()` | ❌ | ✨ |

## Turning imagery off

Settings → Display → **Viewscreen Imagery**. When unchecked, the viewscreen and
the portrait chips render emoji only — the pre-image experience, intact. The
choice persists in the existing `galactic_odyssey_settings` key.

## Priority art gaps

Ranked by how often the player would see the panel fall back to emoji:

1. **Locations** (7 IDs, zero art) — the ambient scene, on screen more than
   anything else.
2. **Events** — `hyperspace` fires on every trip between planets.
3. **NPCs** `ai` and `terminal` — the ship AI and mainframe speak constantly.
4. **Districts** — 11 of 12 unillustrated.
5. **`boss_terra`** — the only boss without a face.
