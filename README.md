<div align="center">

# Jael (Just Another ECS Library)

[![npm version](https://img.shields.io/npm/v/%40jael-ecs%2Fcore)](https://www.npmjs.com/package/@jael-ecs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Bundle size](https://img.shields.io/npm/unpacked-size/%40jael-ecs%2Fcore)]()

_A modern, performant, and user-friendly Entity Component System library written in TypeScript_

</div>

## Table of contents
- [Api docs](docs/api-reference.md)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [Planned Features](#planned-features)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

## Features

- **User Friendly API** - Clean, fluent api that's easy to learn
- **High Performance** - Optimized SparseSet implementation for fast entity lookups
- **Query System** - Optimized cache query system for entity packets
- **Minimal Bundle size** - Compact bundle size without dependencies.(56kb 📦)

## Projects using Jael

- [topwavy](https://github.com/cammyb1/topwavy) - A simple wave survival game demonstrating Jael's ECS capabilities

## Installation

```bash
npm install @jael-ecs/core
```

## Quick Start

```typescript
import { World } from "@jael-ecs/core";

// Create your world
const world = new World();

// Define components
interface Position {
  x: number;
  y: number;
}

interface Velocity {
  dx: number;
  dy: number;
}

// Create entities
const playerId = world.create();
world.addComponent(playerId, "position", { x: 0, y: 0 });
world.addComponent(playerId, "velocity", { dx: 1, dy: 1 });

const enemyId = world.create();
world.addComponent(enemyId, "position", { x: 10, y: 10 });
world.addComponent(enemyId, "velocity", { dx: -1, dy: 0 });

// Using Entity Proxy
const playerId = world.create();
const player = world.getEntity(playerId);
player.addComponent("position", { x: 0, y: 0 });
player.addComponent("velocity", { dx: 1, dy: 1 });

// Create a system
function MovementSystem() {
  const query = world.include("position", "velocity");

  // Get direct proxy access
  query.entities.forEach((entity) => {
    const position = entity.getComponent<Position>("position");
    const velocity = entity.getComponent<Velocity>("velocity");

    position.x += velocity.dx * (Time.delta || 0.016);
    position.y += velocity.dy * (Time.delta || 0.016);
  });
}

// Game loop
function gameLoop() {
  MovementSystem();
}
```

## Architecture

Jael follows the classic Entity Component System pattern:

- **Entities**: Unique identifiers (just IDs) - no data attached
- **Components**: Pure data containers (no logic)
- **Systems**: Process entities with specific component combinations as plain js functions

## Best Practices

### 1. Component Design

```typescript
// ✅ Good: Simple data containers
interface Position {
  x: number;
  y: number;
}

interface Health {
  current: number;
  max: number;
}

// ❌ Avoid: Methods in components
interface BadComponent {
  x: number;
  move(): void; // Put this in a system!
}
```

### 2. Query Optimization

```typescript
// ✅ Good: Cache queries when possible
const reusableQuery = world.include('position', 'velocity');

function MovementSystem(){
  reusableQuery.entities.forEach((entity) => {
    // Handle entity movement
  })
}

// ✅ Also good: Use world.include/exclude for simple cases
update() {
  const entities = this.world.include('position', 'velocity');
  // ...
}
```

### 3. Memory Management

```typescript
// Remember to clean up when removing entities
world.destroy(entityId); // Automatically removes all components and query pointer
world.removeComponent(entityId, compKey); // Removes comp from entity
world.removePrefab(prefabName); // Remove prefab if exist
```

## Advanced Usage

### Custom Events

```typescript
// Extend world with custom events
interface CustomWorldEvents extends WorldEvents {
  playerScored: { points: number };
  gameOver: void;
}

const world = new World() as any as EventRegistry<CustomWorldEvents>;

// Emit custom events
world.emit("playerScored", { points: 100 });

// Listen to custom events
world.on("playerScored", ({ points }) => {
  updateScore(points);
});
```

### Extending Prefab Manager

Current Prefab manager only supports array/primivite/planeObjets but can be extended.

```typescript
// Create detector function - (any) => string|null

world.prefabManager.addDetector((compValue) => {
  if (typeof compValue === "object" && compValue.isTest) return "test";
  return null;
});

// Create cloner for new Detector function
world.prefabManager.addCloner("test", (value: any) => value.clone());

// This adds support for complex component values
const prefab = world.createPrefab("test", {
  name: "test",
  testComp: { isTest: true, clone: (v) => ({ ...v }), ...rest },
});
```

## Planned Features

- ~~Input Helper with pointer and keyboard management.~~
- ~~Serialization for raw export
- Implement basic one level tag manager.
- Entity with childrens and parents.
- React wrapper (?)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/cammyb1/jael.git
cd jael

# Install dependencies
npm install

# Start development
npm run dev

# Build
npm run build
```

## Acknowledgments

- Inspiration from ECS frameworks like [ECSY](https://github.com/ecsyjs/ecsy) and [Bevy](https://github.com/bevyengine/bevy)
- Deep digging documentation at [Austin Morlan Post](https://austinmorlan.com/posts/entity_component_system/)
- TypeScript for providing excellent type safety and developer experience

---

This README has been Vibecoded almost entirely due to the author's null skills at writing readmes 😄. But all the rest of the code has been written from scratch.

## License

[MIT](https://choosealicense.com/licenses/mit/) - see the [LICENSE](LICENSE) file for details.

<div align="center">

[⭐ Star this repo if it helped you!](https://github.com/cammyb1/jael)

[☕ You can buy me a coffee :)](https://ko-fi.com/cammyb1)

**Built with ❤️ by [cammyb1](https://github.com/cammyb1)**

</div>
