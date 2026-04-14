# Api reference

Here you can find all the documentation relative to the classes that uses this library.

## Table of contents

- [World](#world)
- [Entity](#entity)
- [Query](#query)
- [System](#system)
- [Serialization](#serialization)
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
// Add component with type safety
world.addComponent<Position>(entityId, "position", { x: 0, y: 0 });

// Create an entity with multiple components in one call:
// TypeScript - type-safe
const entityId = world.createWith<{ position: Position; velocity: Velocity }>({
  position: { x: 0, y: 0 },
  velocity: { dx: 1, dy: 1 },
});

// JavaScript - dynamic
const entityId = world.createWith({
  position: { x: 0, y: 0 },
  velocity: { dx: 1, dy: 1 },
});

// Remove component
world.removeComponent(entityId, "position");

// Get component with type safety
const position = world.getComponent<Position>(entityId, "position");

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

// Add component with type safety
entity.addComponent<Position>("position", { x: 0, y: 0 });

// Remove component
entity.removeComponent("position");

// Check if component exist
const posExist = entity.hasComponent("position");

// Get current value of the component with type safety
const position = entity.getComponent<Position>("position");

// Get current entity component names
const components: string[] = entity.getComponentNames()

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

### Serialization

Jael provides a powerful serialization system for saving and loading world state.

#### Basic Usage

```typescript
// Serialize world to JavaScript object
const data = world.serialize();

// Save as JSON string
const json = JSON.stringify(data);

// Load from JSON string
world.deserialize(JSON.parse(json));
```

#### Extending Serializers

You can register custom serializers for complex types (like Three.js objects):

```typescript
import { Serializer } from "@jael-ecs/core";

// Register custom type detector
Serializer.registerSerializeDetector((value: any) => {
  if (value.isObject3D) return "transform";
  if (value.isVector3) return "vector";
  return null;
});

// Register serializer/deserializer for custom types
Serializer.registerSerializer(
  "transform",
  (v) => v.toJSON(), // Serialize: object to JSON (three.js method)
  (v) => objectLoader.parse(v), // Deserialize: JSON to object
);

Serializer.registerSerializer(
  "vector",
  (v) => v.toArray(), // Serialize: Vector3 to array
  (v) => new Vector3().fromArray(v), // Deserialize: array to Vector3
);
```

#### World Serialized Interface

The serialized data structure:

```typescript
interface WorldSerialized {
  entities: number[]; // Entity IDs
  components: Record<number, Record<string, SerializedComponent>>; // Components by entity
  version: number; // World version
}

interface SerializedComponent {
  _type: string; // Detected type (primitive, array, plainObject, custom)
  data: any; // Serialized data
}
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
