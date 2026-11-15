/**
 * data/cutscenes.js
 * Pure data module defining cinematic cutscenes and story beats.
 * No logic, no external imports.
 */

export const cutscenes = {
  act1_launch: {
    id: "act1_launch",
    title: "Departure: Terra Prime",
    videoSrc: null,
    beats: [
      {
        speaker: "Flight Control",
        emoji: "📡",
        sceneKind: "location",
        sceneId: "terra_prime",
        text: "Clearance granted, Commander. Atmospheric thrusters engaged. All docking clamps released.",
        sfx: "ui_click",
        music: "exploration"
      },
      {
        speaker: "Captain Vance",
        emoji: "🦾",
        sceneKind: "npc",
        sceneId: "vance",
        text: "Stay sharp out there. Sector 4 has been quiet, but reports of rogue drones and syndicate scouts keep piling up. Federation HQ is counting on you.",
        sfx: "radio_chatter",
        music: "exploration"
      },
      {
        speaker: "S.A.M.",
        emoji: "🤖",
        sceneKind: "npc",
        sceneId: "ai",
        text: "Sub-light navigation online. Hyperdrive capacitors charged to maximum. Plotting jump vector beyond the orbital perimeter.",
        sfx: "synth_scan",
        music: "exploration"
      },
      {
        speaker: "S.A.M.",
        emoji: "🚀",
        sceneKind: "event",
        sceneId: "hyperspace",
        text: "Hyperspace jump in three... two... one... Engaging FTL drive!",
        sfx: "hyperdrive_jump",
        music: "exploration"
      }
    ]
  },

  first_boss_xylar: {
    id: "first_boss_xylar",
    title: "Encounter: Overlord Xylar",
    videoSrc: null,
    beats: [
      {
        speaker: "S.A.M.",
        emoji: "⚠️",
        sceneKind: "npc",
        sceneId: "ai",
        text: "Warning! High-energy gravimetric anomaly detected directly ahead. A colossal dreadnought is decloaking!",
        sfx: "alarm_siren",
        music: "combat"
      },
      {
        speaker: "Overlord Xylar",
        emoji: "😈",
        sceneKind: "boss",
        sceneId: "boss_terra",
        text: "You have flown straight into the lion's maw, Federation pawn. Terra Prime belongs to the conquerors!",
        sfx: "heavy_thud",
        music: "combat"
      },
      {
        speaker: "Overlord Xylar",
        emoji: "⚔️",
        sceneKind: "boss",
        sceneId: "boss_terra",
        text: "Prepare your ship for destruction. Not even your ashes will escape my Annihilation Beam!",
        sfx: "laser_charge",
        music: "combat"
      }
    ]
  },

  derelict_breach: {
    id: "derelict_breach",
    title: "Breach: The Derelict Vessel",
    videoSrc: null,
    beats: [
      {
        speaker: "S.A.M.",
        emoji: "🛸",
        sceneKind: "event",
        sceneId: "derelict_boarding",
        text: "Docking clamps secure. Airlock umbilical pressurizing. Thermal scans indicate zero life signs aboard the ghost ship.",
        sfx: "airlock_cycle",
        music: "mystery"
      },
      {
        speaker: "Commander",
        emoji: "🧑‍🚀",
        sceneKind: "event",
        sceneId: "derelict_boarding",
        text: "Seal checks out. Weapons hot and flashlights on. Let's see what tore through this titanium hull.",
        sfx: "hiss_decompression",
        music: "mystery"
      },
      {
        speaker: "Derelict Security AI",
        emoji: "💾",
        sceneKind: "npc",
        sceneId: "terminal",
        text: "ALERT... UNAUTHORIZED LIFEFORM DETECTED IN SECTOR B... QUARANTINE PROTOCOL INITIATED... COMBAT DRONES DEPLOYING...",
        sfx: "glitch_static",
        music: "mystery"
      }
    ]
  }
};
