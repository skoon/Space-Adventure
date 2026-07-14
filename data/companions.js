export const COMPANIONS = {
    vance: {
        id: "vance",
        name: "Vance",
        role: "Cyborg Scrapper",
        avatar: "🦾",
        abilityName: "Shield Generator",
        abilityDesc: "Adds a defense shield (+5 DEF) for 3 turns. Cooldown: 3 turns.",
        cooldown: 3,
        preferredGifts: ["Data Chip", "Scrap Metal"],
        alliedFaction: "federation",
        cabin: {
            title: "Vance's Heavy Scrap Workshop",
            desc: "The room is littered with copper wiring, half- dismantled weapon chassis, and a heavy scent of hydraulic oil. A makeshift workbench dominates the corner."
        },
        dialogues: {
            recruit: "Need a hand? The name's Vance. I can watch your back in combat. For 200 credits, I'm in.",
            recruitCost: 200,
            greetings: [
                "System status nominal. What's the plan?",
                "Ready to scrap some metal.",
                "My cybernetics are fully charged and ready."
            ],
            trustUp: "Not bad, Captain. I'm starting to like this crew.",
            maxTrust: "I've served on a lot of ships, but this feels like home. Let's conquer the stars."
        }
    },
    lyra: {
        id: "lyra",
        name: "Dr. Lyra",
        role: "Android Medic",
        avatar: "🔬",
        abilityName: "Nano-Heal",
        abilityDesc: "Restores 25 HP. Cooldown: 4 turns.",
        cooldown: 4,
        preferredGifts: ["Bio-Gel", "Nanites"],
        alliedFaction: "syndicate",
        cabin: {
            title: "Dr. Lyra's Clinical Lab",
            desc: "Sterile and impeccably clean. Fluorescent tubes illuminate shelves of bio-gels, a neat surgical cot, and a terminal displaying DNA sequence graphs."
        },
        dialogues: {
            recruit: "Salutations. I am Dr. Lyra. I specialize in trauma medicine. I would like to join your mission for a research fee of 250 credits.",
            recruitCost: 250,
            greetings: [
                "Analyzing biological signatures. You are in optimal health.",
                "Medical systems active. Ready to heal.",
                "How can I assist your scientific endeavors today?"
            ],
            trustUp: "My trust subroutines have increased in value. Thank you.",
            maxTrust: "You have shown exceptional leadership. My loyalty is mathematically absolute."
        }
    },
    apex: {
        id: "apex",
        name: "Apex",
        role: "Human Smuggler",
        avatar: "🔫",
        abilityName: "Precision Shot",
        abilityDesc: "Deals 20 direct damage to the enemy. Cooldown: 3 turns.",
        cooldown: 3,
        preferredGifts: ["Alien Crystal", "Quantum Chip"],
        alliedFaction: "corsairs",
        cabin: {
            title: "Apex's Smuggler Holdout",
            desc: "Draped in dim amber lights. A Sabacc table sits in the center with holograms of playing cards. Crates of unlabeled contraband are piled against the wall."
        },
        dialogues: {
            recruit: "Hey there. Name's Apex. Best shot this side of the sector. I need to get off this rock. How about 150 credits and I join your crew?",
            recruitCost: 150,
            greetings: [
                "Keep your eyes open, danger's everywhere.",
                "Got any targets for me?",
                "Let's make some credits."
            ],
            trustUp: "Ha! You're alright, boss. Let's keep this streak going.",
            maxTrust: "I'd follow you into a black hole. You've got real grit."
        }
    }
};
