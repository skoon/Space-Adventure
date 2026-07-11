# Technical Design & Implementation Plan — User Interface Overhaul

This document outlines the design language, styling tokens, and step-by-step implementation plans to extend the premium **Photon Prime visual aesthetic** to all user interfaces in *Galactic Odyssey*. 

The core design system is based on **glassmorphism** (semi-translucent dark panels with soft backdrops) and **functional color coding** (using neon accents that map to the specific gameplay purpose).

---

## 1. Unified Design Tokens & CSS Variables

To achieve this, we will introduce a modular palette of CSS custom properties inside [`style.css`](file:///d:/source/Roogames/Space%20Adventure/style.css). Each UI component inherits from this central set of tokens:

```css
:root {
    /* Base Glassmorphic Backgrounds */
    --glass-bg: rgba(10, 16, 26, 0.85);
    --glass-blur: blur(10px);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);

    /* Functional UI Accent Colors */
    --color-orange: #ff7a00;   /* Commerce, Syndicate, Shopping */
    --color-red: #ff2a2a;      /* Combat, Stagger/Break, Criticals, HP Warning */
    --color-green: #00ff88;    /* Character stats, Spec Trees, Healing */
    --color-blue: #0088ff;     /* Travel, Stars, Navigation, Engines */
    --color-cyan: #00ffff;     /* Holograms, Dialogue Engine, Dice Rolls */
    --color-amber: #ffb800;    /* Derelict Maze, Oxygen, Log files */

    /* Core Glow Borders */
    --border-orange: 1px solid rgba(255, 122, 0, 0.4);
    --border-red: 1px solid rgba(255, 42, 42, 0.4);
    --border-green: 1px solid rgba(0, 255, 136, 0.4);
    --border-blue: 1px solid rgba(0, 136, 255, 0.4);
    --border-cyan: 1px solid rgba(0, 255, 255, 0.4);
    --border-amber: 1px solid rgba(255, 184, 0, 0.4);
}
```

---

## 2. Combat UI Overhaul (Theme: Tactical Red/Orange)

### Mockup Wireframe Layout
```
+--------------------------------------------------------------------------+
|  [HP: 100/100] [===================]    [ENEMY: Volcanic Hulk]           |
|  [AP: ✴ ✴ ✴ ]                           [HP: 250/250] [==========]        |
|  [STANCE: Berserker ⚡]                 [BREAK: 50/50] [----]            |
|                                                                          |
|  +-----------------------------------+  +------------------------------+ |
|  |           COMBAT ACTION LOG       |  |       ACTION CONSOLE         | |
|  |  [21:40] Vance cast Shield!       |  |  (1 AP) [⚔️ Attack]            | |
|  |  [21:41] Player dealt 45 thermal! |  |  (2 AP) [🛡️ Block]             | |
|  |  [21:41] Volcanic Hulk Staggered! |  |  (1 AP) [⚡ Stance Toggle]    | |
|  +-----------------------------------+  +------------------------------+ |
+--------------------------------------------------------------------------+
```

### Technical Implementation Spec
1.  **Card Layout:** Add the `.combat-card` class to the combat layout inside [`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html). This applies the `--glass-bg` backplate and pulses the border `--border-red` when the player is low on health.
2.  **Break Shield Gauge:** Customize the secondary Break Shield gauge in [`combat.js`](file:///d:/source/Roogames/Space%20Adventure/systems/combat.js):
    *   Change the element `#enemyBreakGauge` to use a bright orange progress filler: `background: var(--color-orange); box-shadow: 0 0 10px var(--color-orange);`
3.  **Action Point Nodes:** Render AP as discrete glowing energy pods (`✴`) instead of text. AP depletion applies a grey-out transition.

```css
/* combat-ui styles in style.css */
.combat-glass-container {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: var(--border-red);
    box-shadow: 0 0 20px rgba(255, 42, 42, 0.1);
}

.ap-node {
    width: 12px;
    height: 12px;
    background: var(--color-orange);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--color-orange);
    display: inline-block;
    margin-right: 6px;
    transition: all 0.3s ease;
}

.ap-node.spent {
    background: #332211;
    box-shadow: none;
}
```

---

## 3. Character & Specialization UI (Theme: Emerald Biotech)

### Mockup Wireframe Layout
```
+--------------------------------------------------------------------------+
|  🧬 BIO-TECH CLINIC & SPECIALIZATION CORE                                |
|  +---------------------------------+  +--------------------------------+ |
|  |      AUGMENTATION MODS          |  |       SPECIALIZATION TREE      | |
|  |  [Head: Targeting Matrix] [Mod] |  |     (Heavy Combat Branch)      | |
|  |  [Arms: Reflex Boosters]  [Mod] |  |         [● Node 1: STR +5]     | |
|  |  [Stability: 85% / 100%] [====] |  |               │                | |
|  +---------------------------------+  |         [○ Node 2: Crit +5%]   | |
|                                       +--------------------------------+ |
+--------------------------------------------------------------------------+
```

### Technical Implementation Spec
1.  **Grid System:** The Medbay Clinic tab uses a two-column emerald structure. 
2.  **Stability Bar:** Renders the cybernetic stability percentage. If instability exceeds the threshold, the bar turns warning amber and flashes.
3.  **Branching Node Connections:** Skill tree lines are drawn using SVG paths styled with `stroke: var(--color-green); stroke-width: 2px; filter: drop-shadow(0 0 4px var(--color-green));`.

```css
/* character-ui styles in style.css */
.spec-glass-container {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: var(--border-green);
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.1);
}

.skill-node {
    border: 2px solid var(--color-green);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 26, 12, 0.9);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.2);
    transition: all 0.3s ease;
}

.skill-node.locked {
    border-color: #1a4d33;
    color: #1a4d33;
    box-shadow: none;
    cursor: not-allowed;
}

.skill-node.active {
    background: var(--color-green);
    color: #000;
    box-shadow: 0 0 18px var(--color-green);
}
```

---

## 4. Space Exploration & Travel Map (Theme: Deep Nebula Blue)

### Mockup Wireframe Layout
```
+--------------------------------------------------------------------------+
|  📡 GALAXY SCANNER & HYPERDRIVE VECTOR                                   |
|  +--------------------------------------------------------------------+  |
|  |                          (Crio-Prime)                              |  |
|  |                               :                                    |  |
|  |                               :                                    |  |
|  |    (Terra Prime)────────(Galactic Nexus)────────(Xylo Delta)       |  |
|  |                                                                    |  |
|  +--------------------------------------------------------------------+  |
|  [Hyperdrive Ready: Vector Lock on Crio-Prime (-400 credits)]  [LAUNCH]  |
+--------------------------------------------------------------------------+
```

### Technical Implementation Spec
1.  **Starmap Grid Overlay:** The starmap uses a coordinate plotting grid. Lines connecting travel locations are styled with deep blue glowing traces.
2.  **Hyperdrive Animation:** In [`travel-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/travel-ui.js), the travel transition overlay utilizes the canvas or full-screen CSS parallax animation `.travelAnimationOverlay` rendering stars passing at hyperspeed.

```css
/* travel-ui styles in style.css */
.travel-glass-container {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: var(--border-blue);
    box-shadow: 0 0 20px rgba(0, 136, 255, 0.1);
}

.star-connection-line {
    border-top: 1px dashed rgba(0, 136, 255, 0.4);
    position: absolute;
    z-index: 1;
}

.star-location-dot {
    width: 16px;
    height: 16px;
    background: #000;
    border: 2px solid var(--color-blue);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--color-blue);
    position: relative;
    z-index: 2;
    cursor: pointer;
}

.star-location-dot.selected {
    border-color: var(--color-cyan);
    box-shadow: 0 0 20px var(--color-cyan);
}
```

---

## 5. Derelict Dungeon Canvas (Theme: Radioactive Amber)

### Mockup Wireframe Layout
```
+--------------------------------------------------------------------------+
|  ⚠️ HAZARD: VACUUM (OXYGEN: 12/15)                                       |
|  +--------------------------------------+  +---------------------------+ |
|  |                                      |  |      RADAR MINIMAP        | |
|  |    / \                        / \    |  |  +---------------------+  | |
|  |   /   \______________________/   \   |  |  |  ?  -  ?  -  [x]    |  | |
|  |  |     |                    |     |  |  |  |  |     |     |      |  | |
|  |  |  [x]|       [CHEST]      |[?]  |  |  |  | [👤] - [x] - [x]    |  | |
|  |  |     |                    |     |  |  |  +---------------------+  | |
|  |   \   /______________________\   /   |  |                           | |
|  |    \ /                        \ /    |  |  [Airlock Escape]         | |
|  +--------------------------------------+  +---------------------------+ |
+--------------------------------------------------------------------------+
```

### Technical Implementation Spec
1.  **Raycast Depth Shading:** The HTML5 Canvas in [`dungeon-renderer.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dungeon-renderer.js) is refactored to compute wall distance and shade wall slices using a radioactive amber/yellow-green gradient:
    ```javascript
    // Inside systems/ui/dungeon-renderer.js
    const wallColor = `rgba(255, 184, 0, ${1 - Math.min(1, distance / maxRange)})`;
    ```
2.  **Oxygen Cylinder HUD:** The Oxygen bar is styled like an industrial gauge. If O₂ reaches `< 3`, the bar turns blinking red.

```css
/* derelict-ui styles in style.css */
.derelict-glass-container {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: var(--border-amber);
    box-shadow: 0 0 20px rgba(255, 184, 0, 0.1);
}

.oxygen-bar-fill {
    background: linear-gradient(90deg, var(--color-amber) 0%, #ff8800 100%);
    box-shadow: 0 0 10px rgba(255, 184, 0, 0.3);
    height: 100%;
    transition: width 0.3s ease;
}

.oxygen-bar-fill.critical {
    background: var(--color-red);
    box-shadow: 0 0 15px var(--color-red);
    animation: flash-animation 1s infinite alternate;
}
```

---

## 6. Dialogue & Skill Roll Overlay (Theme: Holographic Cyan)

### Mockup Wireframe Layout
```
+--------------------------------------------------------------------------+
|  👥 COM-LINK OPEN: DR. ELYSE THORNE                                       |
|  +---------------------------------+  +--------------------------------+ |
|  |         [NPC PORTRAIT]          |  |        DIALOGUE CHOICES        | |
|  |                                 |  |  1. "I have the telemetry."    | |
|  |  Disposition: [=======] Friendly|  |  2. [HACK] (INT) - DC 15       | |
|  +---------------------------------+  +--------------------------------+ |
|  [ DICE ROLL: [ 14 ] + 3 (INT) = 17 vs DC 15 -> SUCCESS! ]                 |
+--------------------------------------------------------------------------+
```

### Technical Implementation Spec
1.  **Holographic CRT Overlay:** Add scanline overlays and holographic flickering CSS filters `.hologram-scanline` to the dialogue card layout in [`dialogue-ui.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dialogue-ui.js).
2.  **Dice Roll Container:** The dice roll displays as a glowing 3D-effect polygon box that scrambles numbers before stopping on the final roll.

```css
/* dialogue-ui styles in style.css */
.dialogue-glass-container {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: var(--border-cyan);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.15);
}

/* Hologram scanline effect */
.dialogue-hologram {
    background: linear-gradient(
        rgba(18, 16, 16, 0) 50%, 
        rgba(0, 0, 0, 0.25) 50%
    ), linear-gradient(
        90deg, 
        rgba(255, 0, 0, 0.06), 
        rgba(0, 255, 0, 0.02), 
        rgba(0, 0, 255, 0.06)
    );
    background-size: 100% 4px, 6px 100%;
}

.dice-container-glow {
    border: 2px solid var(--color-cyan);
    background: rgba(0, 26, 26, 0.9);
    box-shadow: 0 0 15px var(--color-cyan);
    font-size: 24px;
    font-weight: bold;
    color: var(--color-cyan);
    animation: text-flicker 0.15s infinite alternate;
}
```

---

## 7. Migration & UI Refactoring Steps

To roll out this overhaul systematically without breaking standard core gameplay:

1.  **Step 1:** Add Design Token variables and class selectors into the bottom of [`style.css`](file:///d:/source/Roogames/Space%20Adventure/style.css).
2.  **Step 2:** Refactor element panel headers in [`index.html`](file:///d:/source/Roogames/Space%20Adventure/index.html) to reference the corresponding styling class (e.g. replacing `.cyber-panel-cyan` with `.combat-glass-container` on the combat card).
3.  **Step 3:** Update the canvas colors in [`dungeon-renderer.js`](file:///d:/source/Roogames/Space%20Adventure/systems/ui/dungeon-renderer.js) to render radioactive amber wireframes.
4.  **Step 4:** Run manual visual tests on all five UI states to ensure absolute alignment with the mockup layout design specifications.
