# Api reference

Here you can find all the documentation relative to the classes that uses this library.

## Table of contents

- [World](#world)
- [Entity](#entity)
- [Query](#query)
- [System](#system)
- [Helpers](#helpers)
  - [SparseSet](#sparseset)
  - [Time](#time)
  - [EventRegistry](#event-registry)1
  - [Input](#input)

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
const first = query.firstEntity();
const firstId = query.firstId();

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

Helper classes that will make your life easier developing your tool.

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

Utility class for managing time and delta time calculations.

```typescript
import { Time } from "@jael-ecs/core";

const time = new Time({ autostart: true }); // default autostart is true

time.start(); // start if not running already

// Access time properties
const dt = time.delta; // Delta time
const elapsed = time.elapsed; // Total elapsed time

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
