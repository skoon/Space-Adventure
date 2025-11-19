# Galactic Odyssey

A sci-fi adventure game built with vanilla JavaScript, HTML, and CSS.

## Features

- Character creation with multiple races and roles
- Turn-based combat system
- Exploration mechanics
- Leveling and progression
- Inventory management
- Multiple combat actions (Attack, Block, Dodge, Special Abilities)
- Status effects system
- Energy/resource management
- Critical hit system
- XP progression with visual bars
- Level-up notifications
- Character avatars

## Getting Started

Simply open `index.html` in your web browser. No build process or dependencies required!

## Project Structure

```
├── index.html      # Main HTML file
├── game.js         # Game logic and functionality
├── style.css       # Styling and animations
└── todo.md         # Feature roadmap
```

## Game Controls

- **Attack**: Standard attack with critical hit chance (15% base, 25% for Rogues)
- **Block**: Reduces incoming damage by 50% for one turn
- **Dodge**: 30% chance to completely avoid enemy attack
- **Special Ability**: Role-specific powerful ability (costs 30 energy)
  - Warrior: Power Strike (1.5x damage)
  - Rogue: Assassinate (2.5x damage, guaranteed crit)
  - Scientist: Shield Boost (+5 DEF for 3 turns)

## Technologies

- Vanilla JavaScript (ES6+)
- HTML5
- CSS3
- Tailwind CSS (via CDN)

## License

All rights reserved.
