# Technical Design — Importable Adventure Modules

This document outlines the architectural proposal for introducing **Dungeons & Dragons-style Adventure Modules** into *Galactic Odyssey*. The goal is to allow players or developers to load self-contained zip packages or JSON files containing new storylines, quests, locations, enemies, items, and custom media (images/animations) directly into the engine without modifying the core codebase.

---

## 1. Module Structure & Package Specification

An adventure module is structured as a directory (compiled into a `.gmod` / `.zip` file, or loaded via a single manifest JSON file). 

### Module Package Folder Layout
```
/modules/cursed-nebula/
├── manifest.json          # Module metadata, entry-point, and database merges
├── assets/                # Local images, textures, audio, and styles
│   ├── images/
│   │   ├── cover.jpg      # Displayed on the Module Selection UI
│   │   ├── portal.png     # Rendered during dialogue cards
│   │   └── monster.png    # Sprite for combat or dungeon raycaster
│   ├── sfx/
│   └── styles.css         # Custom CSS animations or themes for the module
└── module-hook.js         # Optional: JavaScript containing custom script hooks
```

---

## 2. Manifest Schema (`manifest.json`)

The manifest acts as the module database. When imported, the engine dynamically merges these definitions into its active databases (`data/quests.js`, `data/items.js`, etc.) using a namespaced prefix to prevent ID collisions.

```json
{
  "id": "cursed_nebula",
  "title": "The Cursed Nebula",
  "version": "1.2.0",
  "author": "Sector-9 Scavenger Guild",
  "description": "An abandoned mining rig has begun emitting strange signals. Investigate the coordinates and recover the lost singularity battery.",
  "requiredLevel": 3,
  "entryQuestId": "cursed_nebula_act1",
  
  "locations": {
    "cursed_refinery": {
      "id": "cursed_refinery",
      "name": "Refinery Rig Theta-9",
      "description": "A dark, creaking metal hulk drifting in highly acidic gases.",
      "hazardLevel": 3,
      "environment": "Vacuum",
      "controllingFaction": "syndicate",
      "districts": [
        {
          "id": "theta9_deck_a",
          "name": "Decommissioned Hangar",
          "description": "Drifting debris blocks the main landing pad. Only small scout shuttles can dock.",
          "npc": "nesta_hologram",
          "icon": "🛸"
        }
      ]
    }
  },

  "items": {
    "cursed_battery": {
      "id": "cursed_battery",
      "name": "Unstable Singularity Battery",
      "type": "accessory",
      "rarity": "epic",
      "defense": 4,
      "effect": "Drains 2 HP from player per turn but refunds 20% Energy costs."
    }
  },

  "enemies": {
    "refinery_specter": {
      "name": "Refinery Specter",
      "hp": 90,
      "attack": 20,
      "defense": 3,
      "drops": ["Scrap Metal"]
    }
  },

  "quests": {
    "cursed_nebula_act1": {
      "id": "cursed_nebula_act1",
      "title": "The Cursed Nebula: Act I",
      "description": "Investigate the abandoned refinery rig.",
      "isMainStory": false,
      "requiredPlanet": "cursed_refinery",
      "steps": [
        {
          "type": "kill",
          "target": "refinery_specter",
          "amount": 2,
          "dialog": {
            "title": "Boarding Action",
            "text": "As your airlock seals with Rig Theta-9, shifting silhouettes advance through the dark hallway. Defend yourself!"
          }
        },
        {
          "type": "choice",
          "dialogTitle": "The Reactor Core",
          "dialogText": "The Singularity Battery hums with volatile power. A high-voltage field blocks your path. What is your play?",
          "dialogImage": "modules/cursed-nebula/assets/images/portal.png",
          "dialogAnimation": "hologram-glitch",
          "choices": [
            {
              "text": "[INT CHECK - DC 15] Bypass the circuit grid.",
              "roll": {
                "attribute": "intelligence",
                "dc": 15,
                "successStep": 2,
                "failureStep": 3
              }
            },
            {
              "text": "Brute force the container open.",
              "nextStepIndex": 3
            }
          ]
        }
      ]
    }
  }
}
```

---

## 3. Dynamic Quest Linking Mechanics

To link quests dynamically within the module, the engine's quest state machine evaluates three technical keys on quest steps or completions:

```
[Quest Complete]
       │
       ▼
Successor Rules Evaluation
       ├─► Has specific path chosen? ──► Auto-Accept Namespace ID
       ├─► Has required items? ────────► Unlock Secret Quest Node
       └─► Reputation Met? ────────────► Push to Active Quest Array
```

### A. Successor Gating & Chaining
Inside the quest schema, steps use a `successorQuests` object or a `nextStepIndex` variable.
*   **Linear Chaining:** When the final step of `cursed_nebula_act1` is turned in, the quest engine intercepts the event and automatically triggers `acceptQuest("cursed_nebula_act2")`.
*   **Branching Successors:** In dialogue choice structures, selecting an option triggers a specific successor:
    ```javascript
    "successorQuests": {
        "federation": "cursed_nebula_fed_branch",
        "corsairs": "cursed_nebula_corsair_branch"
    }
    ```

### B. Precondition Hooks
Quests in imported modules are registered in the world registry with preconditions. The game's exploration and travel loop checks these before displaying them on Job Boards:
```javascript
function canUnlockQuest(quest, characterState) {
    if (quest.preconditions) {
        if (characterState.level < quest.preconditions.minLevel) return false;
        if (characterState.factions[quest.preconditions.faction] < quest.preconditions.minRep) return false;
        // Check for specific quest completions
        if (!characterState.completedQuests.includes(quest.preconditions.requiredQuest)) return false;
    }
    return true;
}
```

---

## 4. Visuals, Media & Animation Pipeline

To deliver a premium visual D&D-style module experience, the engine supports media mapping directly in the step definitions:

### A. Image Rendering Channel
The `dialogue-ui.js` module is expanded with an image viewport panel:
1. When a quest step loads, the engine checks for `step.dialog.dialogImage` (or `dialogImage` on choice states).
2. If present, it sets the `src` of a dedicated image container (`#dialogueIllustration`) and displays it.
3. The image box uses CSS glassmorphism styling to match the CRT amber screen overlay.

### B. CSS Animation Injector
To evoke specific atmospheres during narrative scenes, the step defines a `dialogAnimation` token:
*   `hologram-glitch`: Triggers a brief horizontal distortion filter on the text console using CSS animations.
*   `fade-in`: Volumetrically fades the background cover art.
*   `red-alert`: Pulses the border glow of the screen red (useful for ambush/boss steps).

#### Implementation Example:
```javascript
// Inside systems/ui/dialogue-ui.js
export function renderDialogueStep(step) {
    const dialogBox = document.getElementById("dialogueOverlay");
    
    // Clear previous animation classes
    dialogBox.className = "cyber-panel-cyan dialogue-box-layout";
    
    if (step.dialogAnimation) {
        dialogBox.classList.add(step.dialogAnimation);
    }
    
    // Render image if defined
    const illustration = document.getElementById("dialogueIllustration");
    if (step.dialogImage) {
        illustration.src = step.dialogImage;
        illustration.style.display = "block";
    } else {
        illustration.style.display = "none";
    }
}
```

---

## 5. Script Hooks & Dynamic Events (`module-hook.js`)

For modules that need custom behavior (e.g., a special puzzle, a mini-game, or a custom combat scaling formula), the module can import an optional JS file. This script hooks into the game's **Event Bus**:

```javascript
// modules/cursed-nebula/module-hook.js
export const ModuleHooks = {
    onLoad: (state) => {
        console.log("Cursed Nebula hooks loaded into memory.");
    },
    
    onTravelIntercept: (from, to, characterState) => {
        // If traveling near the cursed refinery, trigger special gravity waves
        if (to === "cursed_refinery") {
            characterState.energy = Math.max(0, characterState.energy - 30);
            return {
                log: "⚠️ GRAVITY WAVES: Magnetic shields overloaded! Lost 30 Energy in transit.",
                cancelTravel: false
            };
        }
    },
    
    onCombatWin: (enemyName, characterState) => {
        // Double drops if defeating a specter with a scientific analyzer
        if (enemyName === "Refinery Specter" && characterState.equipment.accessory === "scanner_array") {
            characterState.inventory.push("Alien Crystal");
            return "🦾 ANALYZER: Extracted secondary crystalline matrix from Specter.";
        }
    }
};
```

---

## 6. Integration & Loading System (`module-loader.js`)

A new system file, [`systems/module-loader.js`](file:///d:/source/Roogames/Space%20Adventure/systems/module-loader.js), handles imports:

```javascript
import { items as baseItems } from '../data/items.js';
import { enemies as baseEnemies } from '../data/enemies.js';
import { locations as baseLocations } from '../data/locations.js';
import { quests as baseQuests } from '../data/quests.js';

export function loadModulePackage(moduleJson, customCssString = null) {
    const modId = moduleJson.id;

    // 1. Inject custom css rules for module animations if provided
    if (customCssString) {
        const styleSheet = document.createElement("style");
        styleSheet.id = `style_mod_${modId}`;
        styleSheet.innerText = customCssString;
        document.head.appendChild(styleSheet);
    }

    // 2. Merge items database
    if (moduleJson.items) {
        Object.assign(baseItems, moduleJson.items);
    }

    // 3. Merge locations database
    if (moduleJson.locations) {
        Object.assign(baseLocations, moduleJson.locations);
    }

    // 4. Merge enemies database
    if (moduleJson.enemies) {
        // Map simplified key-value enemy definitions to base array
        for (const [key, value] of Object.entries(moduleJson.enemies)) {
            baseEnemies.push({
                name: value.name,
                hp: value.hp,
                attack: value.attack,
                defense: value.defense,
                locations: [modId],
                drops: value.drops
            });
        }
    }

    // 5. Merge quests database
    if (moduleJson.quests) {
        Object.assign(baseQuests, moduleJson.quests);
    }

    return `Module '${moduleJson.title}' successfully loaded. ${Object.keys(moduleJson.quests || {}).length} quests registered.`;
}
```

### UI Integration (Settings / Module Manager Tab)
*   A new file upload area is created under Settings.
*   The player uploads a `.json` manifest or a compressed `.gmod` (which parses manifest + CSS styles).
*   The parser invokes `loadModulePackage()` and outputs a log entry: `"Successfully loaded Module: The Cursed Nebula."`
*   The new locations immediately appear on the Travel Map coordinate layout.
