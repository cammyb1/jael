<div align="center">

# Jael (Just Another ECS Library)

[![npm version](https://img.shields.io/npm/v/%40jael-ecs%2Fcore)](https://www.npmjs.com/package/@jael-ecs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Bundle size](https://img.shields.io/npm/unpacked-size/%40jael-ecs%2Fcore)]()

_A modern, performant, and user-friendly Entity Component System library written in TypeScript_

</div>

## Table of contents

- [Api Reference](#api-reference)
  - [World](#world)
  - [Entity](#entity)
  - [Query](#query)
  - [System](#system)
  - [Prefab](#prefab)
- [Helpers](#helpers)
  - [SparseSet](#sparseset)
  - [Time](#time)
  - [EventRegistry](#event-registry)
  - [Input](#input)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
- [Planned Features](#planned-features)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

## Features

- **User Friendly API** - Clean, fluent api that's easy to learn
- **High Performance** - Optimized SparseSet implementation for fast entity lookups
- **Query System** - Optimized cache query system for entity packets
- **Minimal Bundle size** - Compact bundle size without dependencies.(48kb 📦)

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

## API Reference

### World

The central hub that manages entities, components, and systems.

#### Entity Management

```typescript
// Create a new entity
const entityId = world.create();

// Destroy an entity
world.destroy(entityId);

// Check if entity exists
const exists = world.exist(entityId);
```

#### Component Management

```typescript
// Add component
world.addComponent(entityId, "position", { x: 0, y: 0 });

// Remove component
world.removeComponent(entityId, "position");

// Get component
const position = world.getComponent<ComponentSchema | any>(
  entityId,
  "position",
);
```

#### Events

```typescript
// Listen to world events
world.on("entityCreated", ({ entityId }) => {
  console.log("Entity created:", entityId);
});

world.on("entityDestroyed", ({ entityId }) => {
  console.log("Entity destroyed:", entityId);
});

world.on("componentAdded", ({ entityId, component }) => {
  console.log(`Component ${component} added to entity ${entityId}`);
});

world.on("componentRemoved", ({ entityId, component }) => {
  console.log(`Component ${component} removed from entity ${entityId}`);
});

world.on("prefabCreated", ({ prefab }) => {
  console.log(`Prefab ${prefab} has been created.`);
});

world.on("prefabInstantiated", ({ prefab; entityId }) => {
  console.log(`Prefab ${prefab} instantiated whitin world with id ${entityId}`);
});
```

### Entity

Base entity class for intuitive component management as proxy around id

```typescript
// Create entity
const entityId = world.create();
const entity = world.getEntity(entityId); // Returns Entity class proxy

// Add component
entity.addComponent<ComponentSchema | any>("position", { x: 0, y: 0 });

// Remove component
entity.remove("position");

// Check if component exist
const posExist = entity.has("position");

// Get curren value of the component
const compSchema = entity.get("position");

entity.id; // Returns unique entity id from proxy
```

### Prefab

Components schema template for easy multiple entities creation/instancing with primitive schemas

```typescript
const world = new World();

const livingSchema = {
  damage: 20,
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  health: { current: 100, max: 100 },
};

// Create from schema
const prefab = world.createPrefab("living", livingSchema);

// Create from existing Entity
const entityId = world.create();
world.addComponent(entityId, "position", { x: 0, y: 0, z: 0 });
world.addComponent(entityId, "velocity", { x: 0, y: 0, z: 0 });
world.addComponent(entityId, "health", { current: 100, max: 100 });

const prefab = world.createPrefab("living", entityId);

// Instantiate existing prefab
const entityId = world.instantiate("living"); // number | undefined;
```

### System

Systems are not implemented as a class because of javascript simplicity, they can be plain objects/functions

#### Example System

```typescript
const renderSystem = {
  query: world.include("position", "sprite")
  update() {
    this.query.entities.forEach((entity) => {
      const position = entity.getComponent<Position>("position");
      const sprite = entity.getComponent<Sprite>("sprite");

      // Render entity
      drawSprite(sprite, position.x, position.y);
    });
  },
};

const query = world.include("position", "sprite")

function renderSystem(){
  query.entities.forEach((entity) => {
    const position = entity.getComponent<Position>("position");
    const sprite = entity.getComponent<Sprite>("sprite");

    // Render entity
    drawSprite(sprite, position.x, position.y);
  });
}


function loop(){
  renderSystem.update(); // As plain object
  renderSystem() // as Function
}

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
// Iterate through entities as proxy
query.entities.forEach((entity) => {
  // Process Entity proxy
});

// Iterate through entities ids
for (const entityId of query.ids) {
  // Process Entity id
}

// Get the first value of the query
const first = query.entities[0];
const firstId = query.ids.first();

// Check query size
const count = query.size();

// Check if query has any entities
const isEmpty = query.size() === 0;

// Subscribe to query events
query.on("added", (entityId: number) => {
  // Entity added or updated
});

query.on("removed", (entityId: number) => {
  // Entity removed
});
```

### Helpers

Helper classes to help you build your tool as easy as posible.

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
import { Time } from "@jael-ecs/core";

Time.start();

// Access time properties
const dt = Time.delta; // Delta time
const elapsed = Time.elapsed; // Total elapsed time

// Events
time.on("update", () => {
  console.log(`Frame: ${dt}ms, Total: ${total}ms`);
});
```

### Input

Abstract class as wrapper for pointer and keyboard classes, this only unify both of them.

```typescript
import { Input } from "@jael-ecs/core";

//Connect listeners. Window class as default argument.
Input.connect(Document | Window | Element);

// Pointer position as Duplet{x,y}.
Input.pointer.position;
Input.pointer.on("down", (e: PointerEvent) => {
  // On pointer down
});
Input.pointer.on("up", (e: PointerEvent) => {
  // On pointer up
});

interface InputConfig {
  mandatory: boolean // Make every key mandatory to be pressed
}

Input.keyboard.register("forward", ["KeyW", "ArrowUp"], config?: InputConfig)
Input.keyboard.registerMultiple({
  forward: {keys: ["KeyW", "ArrowUp"], config?: InputConfig},
  backward: {keys: ["KeyS", "ArrowDown"], config?: InputConfig},
})
Input.keyboard.unregister("forward") // Remove all reference to forward keys

Input.keyboard.isPressed("forward") // Returns true if key/s are pressed
Input.keyboard.isDown("forward") // Returns true if key is down, false on next frame
Input.keyboard.isUp("forward") // Returns true if key is released, false on next frame


Input.keyboard.clearSet() // Makes everything false


// Cleanup
Input.disconnect();
```

Keyboard and Pointer classes

```typescript
import { Keyboard, Pointer } from "@jael-ecs/core";

const pointer = new Pointer();
const keyboard = new Keyboard();

//Connect listeners.
pointer.connect();
keyboard.connect(Document | Window | Element);

// Cleanup
keyboard.disconnect();
pointer.disconnect();
```

```typescript
import { Time } from "@jael-ecs/core";

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
}

interface QueryEvents {
  added: number; //EntityId added to query entities
  removed: number; //EntityId removed to query entities
}

// Listen to events
world.on("entityCreated", (data) => {
  // Handle event
});

// Emit events (handled internally by World)
world.emit("entityCreated", { entityId });

// Remove listeners
world.off("entityCreated", handler);

// Romeve all listeners of a type
world.clearEvent("type");

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

- ~~Instancing / Prefab system.~~
- ~~Input Helper with pointer and keyboard management.~~
- Prefab updated scheme updates instances
- Serialization for raw export
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

## License

[MIT](https://choosealicense.com/licenses/mit/) - see the [LICENSE](LICENSE) file for details.

<div align="center">

[⭐ Star this repo if it helped you!](https://github.com/cammyb1/jael)

[☕ You can buy me a coffee :)](https://buymeacoffee.com/jonathanva5)

**Built with ❤️ by [cammyb1](https://github.com/cammyb1)**

</div>
