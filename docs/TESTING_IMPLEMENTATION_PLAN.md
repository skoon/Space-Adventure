# Unit Testing Implementation Plan

## 1. Setup
- [x] Install Jest and Babel dependencies
- [x] Configure Babel (`babel.config.js`)
- [x] Configure Jest (`jest.config.js`)
- [x] Update `package.json` with test script

## 2. Test Structure
- [x] Create `tests/` directory
- [x] Mirror `systems/` structure in `tests/systems/`

## 3. Unit Tests Coverage
### Phase 1: Core Systems (High Priority)
- [x] **Combat System** (`systems/combat.js`)
    - [x] Test damage calculations
    - [x] Test turn mechanics
    - [x] Test victory/defeat conditions
- [x] **Character System** (`systems/character.js`)
    - [x] Test stats generation
    - [x] Test leveling up
    - [x] Test XP gain
    - [x] Test item usage
- [x] **Inventory System** (`systems/inventory.js`)
    - [x] Test adding/removing items
    - [x] Test item usage

### Phase 2: Secondary Systems
- [x] **Shop System** (`systems/shop.js`)
    - [x] Test buying items
    - [x] Test selling items
    - [x] Test price calculations
- [x] **Quests**
- [x] **Exploration**
- [x] **Save/Load**
- [x] **Item Rarity System** (`systems/rarity.js`)
    - [x] Test rarity tier weight rolling
    - [x] Test stats scaling and parsing
- [x] **Attributes Manual Allocation** (`systems/ui/attributes-ui.js`)
    - [x] Test point distribution logic and role recommendations
    - [x] Test button visual notifications

## 4. Execution
- [x] Run `npm test` to verify all tests pass. (All tests passing)
