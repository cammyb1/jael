<div align="center">

# Jael (Just Another ECS Library)

[![npm version](https://badge.fury.io/js/@jael-ecs%2Fcore.svg)](https://badge.fury.io/js/@jael-ecs%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

_A modern, performant, and user-friendly Entity Component System library written in TypeScript_

</div>

## Table of contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Api Reference](#-api-reference)
  - [World](#world)
  - [Entity](#entity)
  - [System](#system)
  - [Query](#query)
  - [SparseSet](#sparseset)
  - [Time](#time)
  - [EventRegistry](#event-registry)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

## Features

- **User Friendly API** - Clean, fluent api that's easy to learn
- **High Performance** - Optimized SparseSet implementation for fast entity lookups
- **Minimal Bundle size** - Compact bundle size without dependencies.

## Installation

```bash
npm install @jael/core
```

## Quick Start

```typescript
import { World, System } from "@jael-ecs/core";

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
const player = world.create();
world.addComponent(player, "position", { x: 0, y: 0 });
world.addComponent(player, "velocity", { dx: 1, dy: 1 });

const enemy = world.create();
world.addComponent(enemy, "position", { x: 10, y: 10 });
world.addComponent(enemy, "velocity", { dx: -1, dy: 0 });

// Create a system
const movementSystem: System = {
  priority: 0,
  update() {
    const query = world.include("position", "velocity");

    for (const entity of query.entities) {
      const position = entity.get<Position>("position");
      const velocity = entity.get<Velocity>("velocity");

      position.x += velocity.dx * (Time.delta || 0.016);
      position.y += velocity.dy * (Time.delta || 0.016);
    }
  },
};

// Add system to world
world.addSystem(movementSystem);

// Game loop
function gameLoop() {
  world.update();
}
```

## Architecture

Jael follows the classic Entity Component System pattern:

- **Entities**: Unique identifiers (just IDs) - no data attached
- **Components**: Pure data containers (no logic)
- **Systems**: Process entities with specific component combinations

## API Reference

### World

The central hub that manages entities, components, and systems.

#### Entity Management

```typescript
// Create a new entity
const entity = world.create();

// Destroy an entity
world.destroy(entity);

// Check if entity exists
const exists = world.exist(entity);
```

#### Component Management

```typescript
// Add component
world.addComponent(entity, "position", { x: 0, y: 0 });

// Remove component
world.removeComponent(entity, "position");

// Get component
const position = entity.get<Position>("position");

// Check if entity has component
const hasPosition = entity.has("position");
```

#### System Management

```typescript
// Add system
world.addSystem(yourSystem);

// Remove system
world.removeSystem(yourSystem);
```

#### Events

```typescript
// Listen to world events
world.on("entityCreated", ({ entity }) => {
  console.log("Entity created:", entity);
});

world.on("entityDestroyed", ({ entity }) => {
  console.log("Entity destroyed:", entity);
});

world.on("componentAdded", ({ entity, component }) => {
  console.log(`Component ${component} added to entity`);
});

world.on("componentRemoved", ({ entity, component }) => {
  console.log(`Component ${component} removed from entity`);
});

world.on("updated", () => {
  console.log("World updated");
});
```

### Entity

Base entity class for intuitive component management

```typescript
// Create entity
const entity = world.create();

// Add component
entity.add("position", { x: 0, y: 0 });

// Remove component
entity.remove("position");

// Check if component exist
const posExist = entity.has("position");

// Get curren value of the component
const compSchema = entity.get("position");
```

### System

Systems contain the game logic that processes entities with specific components.

```typescript
interface System {
  priority: number; // Execution order (lower = earlier)
  init?(): void // Runs when added to the world
  exit?(): void; // Cleanup when removed
  update(): void; // Main update logic
}
```

#### Example System

```typescript
const renderSystem: System = {
  priority: 100, // Render after all other systems

  init(){
    console.log('This runs first')
  }

  update(dt) {
    const renderableQuery = world.include("position", "sprite");

    for (const entity of renderableQuery.entities) {
      const position = entity.get<Position>("position");
      const sprite = entity.get<Sprite>("sprite");

      // Render entity
      drawSprite(sprite, position.x, position.y);
    }
  },

  exit() {
    console.log("Render system cleanup");
  },
};
```

### Query

Queries provide efficient, cached access to entities matching specific component patterns.

```typescript
interface QueryConfig {
  include: string[]; // Required components
  exclude: string[]; // Components to exclude
}
```

#### Creating Queries

```typescript
// Simple include query
const movingEntities = world.include("position", "velocity");

// Simple exclude query
const nonStatic = world.exclude("static");

// Complex query
const complex = world.query({
  include: ["position", "velocity", "health"],
  exclude: ["dead", "paused"],
});

// Can be use with builder pattern creating a hash for every include/exclude
const complexQuery2 = world.include("position", "health").exclude("static");
```

#### Accessing Results

```typescript
// Iterate through entities
for (const entity of query.entities) {
  // Process entity
}

// Get the first value of the query
const first = query.entities.first();

// Check query size
const count = query.entities.size();

// Check if query has any entities
const isEmpty = query.entities.size() === 0;
```

### SparseSet

High-performance data structure used internally for entity and component storage.

```typescript
const sparseSet = new SparseSet<Entity>();

// Add items
sparseSet.add(entity1);
sparseSet.add(entity2);

// Remove items
sparseSet.remove(entity1);

// Check existence
const exists = sparseSet.has(entity2);

// Iterate
for (const entity of sparseSet) {
  // Process entity
}

// Get size
const size = sparseSet.size;

// Clear all
sparseSet.clear();
```

### Time

Utility singleton class for managing time and delta time calculations.

```typescript
import { Time } from "@jael/core";

Time.start();

// Access time properties
const dt = Time.delta; // Delta time
const elapsed = Time.elapsed; // Total elapsed time

// Events
time.on("update", () => {
  console.log(`Frame: ${dt}ms, Total: ${total}ms`);
});
```

### Event Registry

Base class providing event emission and listening capabilities.

```typescript
interface WorldEvents {
  entityCreated: { entity: Entity };
  entityDestroyed: { entity: Entity };
  componentAdded: { entity: Entity; component: string };
  componentRemoved: { entity: Entity; component: string };
  updated: void;
}

// Listen to events
world.on("entityCreated", (data) => {
  // Handle event
});

// Emit events (handled internally by World)
world.emit("entityCreated", { entity: someEntity });

// Remove listeners
world.off("entityCreated", handler);

// Romeve all listeners of a type
world.clearEvent('type')

// Remove all listeners
world.clearAllEvents();
```

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

### 2. System Organization

```typescript
// Organize systems by functionality and priority
const INPUT_PRIORITY = 0;
const PHYSICS_PRIORITY = 50;
const LOGIC_PRIORITY = 100;
const RENDER_PRIORITY = 200;

const inputSystem = { priority: INPUT_PRIORITY /* ... */ };
const physicsSystem = { priority: PHYSICS_PRIORITY /* ... */ };
const renderSystem = { priority: RENDER_PRIORITY /* ... */ };
```

### 3. Query Optimization

```typescript
// ✅ Good: Cache queries when possible
class MovementSystem implements System {
  private movementQuery: Query;
  priority: number = 1

  constructor(private world: World) {
    this.movementQuery = world.include('position', 'velocity');
  }

  update() {
    for (const entity of this.movementQuery.entities) {
      // Process movement
    }
  }
}

// ✅ Also good: Use js Object:
const movementSystem: System = {
  movementQuery: Query;
  priority: number = 1;

  init(){
    this.movementQuery = world.include('position', 'velocity');
  }

  update(){
    for (const entity of this.movementQuery.entities) {
      // Process movement
    }
  }
}

// ✅ Also good: Use world.include/exclude for simple cases
update() {
  const entities = this.world.include('position', 'velocity');
  // ...
}
```

### 4. Memory Management

```typescript
// Remember to clean up when removing entities
world.destroy(entity); // Automatically removes all components

// Clean up systems if they have resources
system.exit?.(); // Called automatically when removed from world
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

## License

[MIT](https://choosealicense.com/licenses/mit/) - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspiration from ECS frameworks like [ECSY](https://github.com/ecsyjs/ecsy) and [Bevy](https://github.com/bevyengine/bevy)
- TypeScript for providing excellent type safety and developer experience

---

<div align="center">

[⭐ Star this repo if it helped you!](https://github.com/cammyb1/jael)

[☕ You can buy me a coffee :)](https://buymeacoffee.com/jonathanva5)

**Built with ❤️ by [cammyb1](https://github.com/cammyb1)**

</div>
