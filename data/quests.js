export const quests = {
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
  }
};
