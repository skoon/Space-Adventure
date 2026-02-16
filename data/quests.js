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
  }
};
