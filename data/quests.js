const questEntries = {
  "quest_001": {
    id: "quest_001",
    title: "First Contact",
    description: "Defeat 3 Xenobots to secure the landing zone.",
    type: "kill",
    target: "Xenobot",
    amount: 3,
    rewards: { xp: 50, items: ["Energy Cell"] },
    isMainStory: true
  },
  "quest_002": {
    id: "quest_002",
    title: "Scrap Collector",
    description: "Collect 2 Scrap Metal pieces for repairs.",
    type: "collect",
    target: "Scrap Metal",
    amount: 2,
    rewards: { xp: 30, items: ["Nano Stimpack"] },
    isMainStory: false
  },
  "quest_003": {
    id: "quest_003",
    title: "Alien Threat",
    description: "Defeat 5 Plasmavores to protect the colony.",
    type: "kill",
    target: "Plasmavore",
    amount: 5,
    rewards: { xp: 75, items: ["Plasma Rifle"] },
    isMainStory: true
  },
  "quest_004": {
    id: "quest_004",
    title: "Lost Cargo",
    description: "Recover a lost Data Chip.",
    type: "collect",
    target: "Data Chip",
    amount: 1,
    rewards: { xp: 45, items: ["Energy Cell"] },
    isMainStory: false
  },
  "story_01": {
    id: "story_01",
    title: "The Awakening",
    description: "Investigate the strange signal.",
    type: "kill", // Initial type for display, though steps override
    target: "Xenobot",
    amount: 1,
    rewards: { xp: 100 },
    isMainStory: true,
    steps: [
      {
        type: "kill",
        target: "Xenobot",
        amount: 1,
        rewards: { xp: 20 },
        dialog: {
          title: "Target Eliminated",
          text: "You've defeated the scout. But where did it come from? You notice a strange device on its chassis."
        }
      },
      {
        type: "collect",
        target: "Scrap Metal",
        amount: 1,
        rewards: { items: ["Energy Cell"] },
        dialog: {
          title: "Repairs Needed",
          text: "This scrap will help fix the comms array. Maybe we can decode the signal."
        }
      }
    ]
  },
  "quest_branch_01": {
    id: "quest_branch_01",
    title: "The Diplomatic Crisis",
    description: "Navigate a sensitive geopolitical incident in deep space.",
    type: "kill",
    target: "Xenobot",
    amount: 2,
    rewards: { xp: 150 },
    isMainStory: true,
    steps: [
      {
        type: "kill",
        target: "Xenobot",
        amount: 2,
        rewards: { xp: 50 },
        dialog: {
          title: "Comms Link Secured",
          text: "With the threats cleared, you salvage an encrypted data package from the mainframe."
        }
      },
      {
        type: "choice",
        dialogTitle: "Geopolitical Choice",
        dialogText: "The data package holds corporate telemetry. Factions want it.",
        choices: [
          {
            text: "Transmit the telemetry to Captain Vance for the Federation.",
            nextStepIndex: 2,
            rewards: { xp: 50, credits: 100 },
            reputation: { federation: 20, corsairs: -15 },
            disposition: { vance: 15 },
            log: "You handed the corporate package over to the Federation authorities."
          },
          {
            text: "Sell the telemetry to Envoy Nesta and the Void Corsairs.",
            nextStepIndex: 3,
            rewards: { xp: 50, credits: 250 },
            reputation: { corsairs: 25, federation: -20 },
            disposition: { nesta: 15, vance: -15 },
            log: "You sold the Federation classified package to the pirate network."
          },
          {
            text: "De-crypt and copy the data for Dr. Thorne (Syndicate).",
            requires: {
              role: "Scientist",
              stat: { name: "level", value: 1 }
            },
            nextStepIndex: 4,
            rewards: { xp: 100, items: ["Quantum Chip"] },
            reputation: { syndicate: 25 },
            disposition: { thorne: 20 },
            log: "You decrypted the telemetry data and uploaded it to the corporate network."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Federation Gratefulness",
        dialogText: "Captain Vance commends your loyalty. He promises Federation backing.",
        choices: [
          {
            text: "Accept the reward and end transaction.",
            nextStepIndex: 5,
            rewards: { items: ["Nano Stimpack"] },
            log: "Quest Branch Complete: Federation Loyalty verified."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Corsair Payment",
        dialogText: "Nesta laughs and slides you a crate of credits. 'Pleasure doing business.'",
        choices: [
          {
            text: "Take the credits.",
            nextStepIndex: 5,
            rewards: { credits: 100 },
            log: "Quest Branch Complete: Corsair partnership established."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Syndicate Research",
        dialogText: "Dr. Thorne examines the data. 'Incredible. This will help our singularity experiments.'",
        choices: [
          {
            text: "Take the components.",
            nextStepIndex: 5,
            rewards: { items: ["Circuit Board"] },
            log: "Quest Branch Complete: Scientific breakthrough advanced."
          }
        ]
      }
    ]
  },
  "quest_branch_02": {
    id: "quest_branch_02",
    title: "Scavenger's Gamble",
    description: "Help Jax 'Sparky' Mercer acquire a high-energy power source on Xylo Delta.",
    type: "choice",
    target: "Plasma Core",
    amount: 1,
    rewards: { xp: 100 },
    isMainStory: false,
    requiredPlanet: "xylo_delta",
    steps: [
      {
        type: "choice",
        dialogTitle: "The Proposition",
        dialogText: "Sparky Mercer leans in close: 'Hey, need a favor. Snatch a Plasma Core from the Fed depot. What say you?'",
        choices: [
          {
            text: "[WARRIOR ATK 12] Intimidate him into paying a deposit.",
            requires: {
              role: "Warrior",
              stat: { name: "attack", value: 12 }
            },
            nextStepIndex: 1,
            rewards: { credits: 50 },
            disposition: { mercer: 10 },
            log: "You intimidated Sparky Mercer into paying 50 Credits upfront."
          },
          {
            text: "Agree to steal the Plasma Core.",
            nextStepIndex: 1,
            log: "You agreed to Sparky's request to steal a Plasma Core."
          },
          {
            text: "Refuse and report Sparky to Captain Vance.",
            requires: {
              faction: { id: "federation", value: 0 }
            },
            nextStepIndex: 3,
            reputation: { federation: 10, corsairs: -10 },
            disposition: { vance: 10, mercer: -20 },
            log: "You rejected Sparky and turned him over to the Federation."
          }
        ]
      },
      {
        type: "collect",
        target: "Plasma Core",
        amount: 1,
        rewards: { xp: 40 },
        dialog: {
          title: "Plasma Core Acquired",
          text: "You successfully bypassed security and grabbed the Plasma Core. Now, who gets it?"
        }
      },
      {
        type: "choice",
        dialogTitle: "Who to Deliver?",
        dialogText: "Will you deliver the core to Sparky Mercer or turn it in to Captain Vance?",
        choices: [
          {
            text: "Deliver to Sparky Mercer.",
            nextStepIndex: 4,
            rewards: { credits: 150 },
            reputation: { corsairs: 15, federation: -10 },
            disposition: { mercer: 15 },
            log: "You delivered the Plasma Core to Sparky Mercer."
          },
          {
            text: "Turn it over to Captain Vance.",
            nextStepIndex: 4,
            rewards: { items: ["Nano Stimpack"] },
            reputation: { federation: 15, corsairs: -10 },
            disposition: { vance: 15, mercer: -15 },
            log: "You turned in the stolen Plasma Core to Captain Vance."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Federation Commendation",
        dialogText: "Captain Vance thanks you for reporting Sparky's illegal activities. 'Good work, citizen.'",
        choices: [
          {
            text: "Complete Report.",
            nextStepIndex: 4,
            rewards: { credits: 75 },
            log: "Quest Complete: Sparky Mercer's deal was reported."
          }
        ]
      }
    ]
  },
  "quest_fed_01": {
    id: "quest_fed_01",
    title: "Pirate Hunters",
    description: "Defeat 3 Void Corsair Reavers to secure the local shipping lanes.",
    type: "kill",
    target: "Void Corsair Reaver",
    amount: 3,
    rewards: { xp: 120, items: ["Nano Stimpack"] },
    isMainStory: false,
    requiredPlanet: "terra_prime",
    requiredFaction: { faction: "federation", min: 20 }
  },
  "quest_corsair_01": {
    id: "quest_corsair_01",
    title: "The Grand Heist",
    description: "Infiltrate a Federation depot and retrieve a stolen Cargo Container.",
    type: "collect",
    target: "Cargo Container",
    amount: 1,
    rewards: { xp: 150, items: ["Quantum Chip"] },
    isMainStory: false,
    requiredPlanet: "xylo_delta",
    requiredFaction: { faction: "corsairs", min: 20 }
  },
  "quest_syndicate_01": {
    id: "quest_syndicate_01",
    title: "Cybernetic Singularity",
    description: "Acquire 2 Quantum Chips and deliver them to Dr. Thorne for research.",
    type: "collect",
    target: "Quantum Chip",
    amount: 2,
    rewards: { xp: 200, items: ["Plasma Rifle"] },
    isMainStory: false,
    requiredPlanet: "norkon_outpost",
    requiredFaction: { faction: "syndicate", min: 20 }
  },
  "story_act1": {
    id: "story_act1",
    title: "Act I: The Signal",
    description: "Investigate the mysterious alien transmission encrypted on Terra Prime.",
    type: "kill",
    target: "Xenobot",
    amount: 3,
    rewards: { xp: 150 },
    isMainStory: true,
    requiredPlanet: "terra_prime",
    steps: [
      {
        type: "kill",
        target: "Xenobot",
        amount: 3,
        rewards: { xp: 50 },
        dialog: {
          title: "Landing Zone Secured",
          text: "You've neutralized the aggressive automated units. The encryption terminal lies ahead. Now, how do we crack this signal?"
        }
      },
      {
        type: "choice",
        dialogTitle: "Deciphering the Signal",
        dialogText: "The alien mainframe is locked behind a high-security firewall. Choose your method of entry:",
        choices: [
          {
            text: "[INT CHECK - DC 12] Hack the encryption algorithms.",
            roll: { attribute: "intelligence", dc: 12, successStep: 2, failureStep: 3 },
            log: "Attempting to hack the mainframe using your scientific knowledge..."
          },
          {
            text: "[STR CHECK - DC 14] Overload the power terminal to force a hard reboot.",
            roll: { attribute: "strength", dc: 14, successStep: 2, failureStep: 3 },
            log: "Attempting to force-reboot the system through sheer mechanical leverage..."
          },
          {
            text: "Brute force the terminal using basic algorithms (Standard Path).",
            nextStepIndex: 3,
            log: "You triggered the security alarms by attempting a manual brute-force entry!"
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Access Granted",
        dialogText: "Success! You successfully bypassed the firewall and extracted clean telemetry. The data shows coordinates to an ancient weapon cache.",
        choices: [
          {
            text: "Secure the data package and proceed.",
            nextStepIndex: 4,
            rewards: { xp: 100, credits: 100 },
            log: "Decryption successful. Coordinates secured."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Security Breach!",
        dialogText: "The terminal locked down and triggered security defenses! A rogue defense bot attacks!",
        choices: [
          {
            text: "Defend yourself!",
            nextStepIndex: 4,
            triggerCombat: { enemyName: "Xenobot", boss: false },
            log: "Mainframe locked down. Defending against security drone..."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Faction Alliance",
        dialogText: "With the coordinates in hand, you must decide who to deliver this telemetry to. This decision will define your faction alignment.",
        choices: [
          {
            text: "Deliver to Captain Vance (Federation). Start Act II: Federation Alliance.",
            nextStepIndex: 5,
            rewards: { xp: 100 },
            reputation: { federation: 30, corsairs: -15 },
            disposition: { vance: 20 },
            successorQuests: { default: "story_act2_fed" },
            log: "You aligned with the Galactic Federation."
          },
          {
            text: "Sell to Envoy Nesta (Void Corsairs). Start Act II: Corsair Pact.",
            nextStepIndex: 5,
            rewards: { xp: 100, credits: 300 },
            reputation: { corsairs: 30, federation: -20 },
            disposition: { nesta: 20 },
            successorQuests: { default: "story_act2_cor" },
            log: "You aligned with the Void Corsairs."
          },
          {
            text: "Share with Dr. Elyse Thorne (Syndicate). Start Act II: Syndicate Contract.",
            nextStepIndex: 5,
            rewards: { xp: 100, items: ["Quantum Chip"] },
            reputation: { syndicate: 30 },
            disposition: { thorne: 20 },
            successorQuests: { default: "story_act2_syn" },
            log: "You aligned with the Photon Prime Syndicate."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Moving Forward",
        dialogText: "You have chosen your allegiance. Your contacts are preparing for the next phase of operations. Travel to their respective planetary outposts to continue.",
        choices: [
          {
            text: "Acknowledge and proceed.",
            nextStepIndex: 6,
            log: "Act I Complete. Alignments registered."
          }
        ]
      }
    ]
  },
  "story_act2_fed": {
    id: "story_act2_fed",
    title: "Act II: Federation Patrol",
    description: "Patrol the sector and shut down pirate smuggler networks.",
    type: "kill",
    target: "Void Corsair Reaver",
    amount: 3,
    rewards: { xp: 250, items: ["Kevlar Vest"] },
    isMainStory: true,
    requiredPlanet: "terra_prime",
    steps: [
      {
        type: "kill",
        target: "Void Corsair Reaver",
        amount: 3,
        rewards: { xp: 50 },
        dialog: {
          title: "Smuggler Patrol Complete",
          text: "You cleared the pirate scouts. Now, we must interrogate the smuggler captain to find their central base."
        }
      },
      {
        type: "choice",
        dialogTitle: "Interrogating the Smuggler",
        dialogText: "The smuggler captain refuses to speak. How do you get the coordinates?",
        choices: [
          {
            text: "[CHA CHECK - DC 13] Negotiate a deal for amnesty.",
            roll: { attribute: "charisma", dc: 13, successStep: 2, failureStep: 3 },
            log: "Attempting to persuade the smuggler captain to cooperate..."
          },
          {
            text: "[STR CHECK - DC 15] Intimidate them into compliance.",
            roll: { attribute: "strength", dc: 15, successStep: 2, failureStep: 3 },
            log: "Attempting to intimidate the smuggler captain..."
          },
          {
            text: "Throw them in the brig and search the ship (Standard Path).",
            nextStepIndex: 3,
            log: "You lock up the captain and search the ship, but trigger a self-destruct alarm!"
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Coordinates Extracted",
        dialogText: "The captain caves and provides the location of the cache. Captain Vance is highly pleased.",
        choices: [
          {
            text: "Report back to Captain Vance.",
            nextStepIndex: 4,
            rewards: { xp: 100, credits: 150 },
            reputation: { federation: 15 },
            disposition: { vance: 15 },
            successorQuests: { default: "story_act3" },
            log: "Coordinates handed over to Captain Vance. Preparing for Act III."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Ambush in the Hangar!",
        dialogText: "Smuggler reinforcements arrive to silence their captain! Secure the area!",
        choices: [
          {
            text: "Fight!",
            nextStepIndex: 4,
            triggerCombat: { enemyName: "Void Corsair Reaver", boss: false },
            successorQuests: { default: "story_act3" },
            log: "Engaging pirate ambush squad..."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Patrol Successful",
        dialogText: "The smuggler ring has been dismantled. Captain Vance orders you to prepare for the Galactic Peace Summit on Nebula Outpost. This will decide the sector's fate.",
        choices: [
          {
            text: "Prepare hyperdrive for the Summit.",
            nextStepIndex: 5,
            log: "Act II Federation Path Completed."
          }
        ]
      }
    ]
  },
  "story_act2_cor": {
    id: "story_act2_cor",
    title: "Act II: The Smuggler's Run",
    description: "Acquire cargo and bypass Federation blockades to help the Corsairs.",
    type: "collect",
    target: "Cargo Container",
    amount: 2,
    rewards: { xp: 250, credits: 400 },
    isMainStory: true,
    requiredPlanet: "xylo_delta",
    steps: [
      {
        type: "collect",
        target: "Cargo Container",
        amount: 2,
        rewards: { xp: 50 },
        dialog: {
          title: "Cargo Secured",
          text: "You've gathered the cargo. Now, we must breach the Federation customs vault on Xylo Delta to retrieve the hyperdrive schematics."
        }
      },
      {
        type: "choice",
        dialogTitle: "Bypassing the Customs Vault",
        dialogText: "The Federation customs office is heavily guarded. How do we get inside?",
        choices: [
          {
            text: "[AGI CHECK - DC 13] Pickpocket the chief warden's keycard.",
            roll: { attribute: "agility", dc: 13, successStep: 2, failureStep: 3 },
            log: "Attempting to slip the keycard from the warden's pocket..."
          },
          {
            text: "[CHA CHECK - DC 14] Bribe the security officer.",
            roll: { attribute: "charisma", dc: 14, successStep: 2, failureStep: 3 },
            log: "Attempting to bribe the security officer with credits..."
          },
          {
            text: "Blast the door open (Standard Path).",
            nextStepIndex: 3,
            log: "You blew open the door, raising sector-wide alarms!"
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Vault Breached Quietly",
        dialogText: "Excellent work! You grabbed the schematics without raising alarms. Envoy Nesta is highly impressed.",
        choices: [
          {
            text: "Deliver schematics to Envoy Nesta.",
            nextStepIndex: 4,
            rewards: { xp: 100, credits: 200 },
            reputation: { corsairs: 15 },
            disposition: { nesta: 15 },
            successorQuests: { default: "story_act3" },
            log: "Schematics delivered to Nesta. Preparing for Act III."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Security Overload!",
        dialogText: "Federation troopers corner you in the vault! Fight your way out!",
        choices: [
          {
            text: "Engage!",
            nextStepIndex: 4,
            triggerCombat: { enemyName: "Xenobot", boss: false },
            successorQuests: { default: "story_act3" },
            log: "Brawling with Federation patrol drone..."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Smuggling Complete",
        dialogText: "The Corsairs have the tech they need. Nesta tells you that a Peace Summit is being held on Nebula Outpost, and the pirates need you to disrupt it or secure their independence.",
        choices: [
          {
            text: "Plot course for the Summit.",
            nextStepIndex: 5,
            log: "Act II Corsair Path Completed."
          }
        ]
      }
    ]
  },
  "story_act2_syn": {
    id: "story_act2_syn",
    title: "Act II: Syndicate Contract",
    description: "Gather technology components and overclock the research core on Norkon Outpost.",
    type: "collect",
    target: "Quantum Chip",
    amount: 2,
    rewards: { xp: 250, items: ["Quantum Chip"] },
    isMainStory: true,
    requiredPlanet: "norkon_outpost",
    steps: [
      {
        type: "collect",
        target: "Quantum Chip",
        amount: 2,
        rewards: { xp: 50 },
        dialog: {
          title: "Components Gathered",
          text: "The quantum processors are ready. Now, we must overclock the main singularity core. It's a highly dangerous scientific operation."
        }
      },
      {
        type: "choice",
        dialogTitle: "Overclocking the Core",
        dialogText: "The singularity core is unstable. One wrong calibration could cause a meltdown. How do you proceed?",
        choices: [
          {
            text: "[INT CHECK - DC 13] Calibrate the thermal dampeners mathematically.",
            roll: { attribute: "intelligence", dc: 13, successStep: 2, failureStep: 3 },
            log: "Calculating thermal calibrations on the terminal..."
          },
          {
            text: "[AGI CHECK - DC 14] Manually bypass the safety relays in the reactor chamber.",
            roll: { attribute: "agility", dc: 14, successStep: 2, failureStep: 3 },
            log: "Splicing reactor wiring in the reactor bay..."
          },
          {
            text: "Run the automation protocols (Standard Path).",
            nextStepIndex: 3,
            log: "The automated overclock failed and triggered an emergency radiation purge!"
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Singularity Core Overclocked",
        dialogText: "Brilliant! The core is running at 300% efficiency. Dr. Thorne praises your scientific genius.",
        choices: [
          {
            text: "Deliver core logs to Dr. Thorne.",
            nextStepIndex: 4,
            rewards: { xp: 120, items: ["Circuit Board"] },
            reputation: { syndicate: 15 },
            disposition: { thorne: 15 },
            successorQuests: { default: "story_act3" },
            log: "Core logs delivered to Dr. Thorne. Preparing for Act III."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Radiation Purge!",
        dialogText: "An elemental magma entity breaks out of the overloaded core! Purge it before it destroys the station!",
        choices: [
          {
            text: "Engage!",
            nextStepIndex: 4,
            triggerCombat: { enemyName: "Xenobot", boss: false },
            successorQuests: { default: "story_act3" },
            log: "Battling core containment leakage anomaly..."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Overclock Stable",
        dialogText: "The Syndicate's singularity drive is fully charged. Dr. Thorne instructs you to represent them at the Galactic Peace Summit on Nebula Outpost, securing their corporate research rights.",
        choices: [
          {
            text: "Plot coordinates for Nebula Outpost.",
            nextStepIndex: 5,
            log: "Act II Syndicate Path Completed."
          }
        ]
      }
    ]
  },
  "story_act3": {
    id: "story_act3",
    title: "Act III: The Galactic Crucible",
    description: "Represent your faction at the Peace Summit on Nebula Outpost and decide the fate of the sector.",
    type: "choice",
    target: "Xenobot",
    amount: 1,
    rewards: { xp: 500 },
    isMainStory: true,
    requiredPlanet: "nebula_outpost",
    steps: [
      {
        type: "choice",
        dialogTitle: "The Peace Summit",
        dialogText: "The delegates are gathered. Faction representatives are in fierce debate, and the sector is on the brink of total war. You hold the key coordinates that could tip the balance. What is your decision?",
        choices: [
          {
            text: "[FEDERATION ALIGNED] Hand the weapon cache over to Captain Vance to establish order.",
            requires: {
              faction: { id: "federation", value: 30 }
            },
            nextStepIndex: 1,
            rewards: { xp: 100 },
            reputation: { federation: 30, corsairs: -30 },
            log: "You handed the ultimate weapon controls to the Galactic Federation."
          },
          {
            text: "[CORSAIRS ALIGNED] Give the cache to Envoy Nesta to break Federation dominance.",
            requires: {
              faction: { id: "corsairs", value: 30 }
            },
            nextStepIndex: 2,
            rewards: { xp: 100 },
            reputation: { corsairs: 30, federation: -30 },
            log: "You handed the ultimate weapon controls to the Void Corsairs."
          },
          {
            text: "[SYNDICATE ALIGNED] Give the cache to Dr. Thorne to power the Singularity Core.",
            requires: {
              faction: { id: "syndicate", value: 30 }
            },
            nextStepIndex: 3,
            rewards: { xp: 100 },
            reputation: { syndicate: 30 },
            log: "You handed the ultimate weapon controls to the Photon Prime Syndicate."
          },
          {
            text: "[DIPLOMAT - CHA 14] Negotiate a permanent sector-wide Coalition Treaty.",
            requires: {
              stat: { name: "charisma", value: 14 }
            },
            nextStepIndex: 4,
            rewards: { xp: 300, credits: 500 },
            reputation: { federation: 20, corsairs: 20, syndicate: 20 },
            log: "Using supreme diplomacy, you negotiated a sector-wide Coalition Treaty!"
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Federation Ending: Iron Peace",
        dialogText: "Captain Vance activates the weapons cache orbital network. Corsair fleets are dismantled, and order is established with an iron fist. The Federation rules the sector with absolute security.<br><br><strong>Alignment Ending: FEDERATION DOMINANCE</strong>",
        choices: [
          {
            text: "Complete Galactic Odyssey.",
            nextStepIndex: 5,
            log: "Galactic Odyssey Completed: Federation Ending."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Corsair Ending: Cosmic Anarchy",
        dialogText: "Envoy Nesta detonates the weapons cache, shattering the Federation planetary hubs. The sector becomes a lawless haven of smuggling, freedom, and space-faring anarchy.<br><br><strong>Alignment Ending: CORSAIR ANARCHY</strong>",
        choices: [
          {
            text: "Complete Galactic Odyssey.",
            nextStepIndex: 5,
            log: "Galactic Odyssey Completed: Corsair Ending."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Syndicate Ending: Techno-Singularity",
        dialogText: "Dr. Thorne channels the energy cache into the singularity drive, triggering a massive cybernetic leap. Organic consciousness merges with the planetary network. A new digital era begins.<br><br><strong>Alignment Ending: TECHNO-SINGULARITY</strong>",
        choices: [
          {
            text: "Complete Galactic Odyssey.",
            nextStepIndex: 5,
            log: "Galactic Odyssey Completed: Syndicate Ending."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Neutral Ending: Unified Coalition",
        dialogText: "You force the factions to sign the Coalition Treaty, locking the weapons cache in a neutral vault. The Federation, Corsairs, and Syndicate form a joint council. The sector enters a golden era of peace and trade.<br><br><strong>Alignment Ending: UNIFIED COALITION</strong>",
        choices: [
          {
            text: "Complete Galactic Odyssey.",
            nextStepIndex: 5,
            log: "Galactic Odyssey Completed: Coalition Ending."
          }
        ]
      },
      {
        type: "choice",
        dialogTitle: "Epilogue reached",
        dialogText: "The war is over. Your name is written in the stars. You are now free to roam the galaxy, finish sidequests, explore derelict ships, and upgrade your vessel as a legendary Captain.",
        choices: [
          {
            text: "Enter Free-Roam Mode.",
            nextStepIndex: 6,
            log: "Free-Roam Mode Activated."
          }
        ]
      }
    ]
  }
};

export const quests = questEntries;
