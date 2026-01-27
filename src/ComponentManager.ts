import EventRegistry from "./EventRegistry";
import type World from "./World";

export type ComponentSchema = Record<string, any>;

export interface ComponentManagerEvents {
  add: { entityId: number; component: keyof ComponentSchema };
  remove: { entityId: number; component: keyof ComponentSchema };
}

export class ComponentManager extends EventRegistry<ComponentManagerEvents> {
  componentSet: { [k: number]: ComponentSchema } = {};
  world: World;

  constructor(world: World) {
    super();
    this.world = world;
  }

  clearComponentSchema(entityId: number) {
    if (!this.componentSet[entityId]) return;
    delete this.componentSet[entityId];
  }

  addComponent<K extends keyof ComponentSchema>(
    entityId: number,
    key: K,
    value: ComponentSchema[K],
  ) {
    if (!this.world.exist(entityId)) return;
    const schema: ComponentSchema | undefined = this.componentSet[entityId];
    if (!schema) {
      this.componentSet[entityId] = { [key]: value };
    } else {
      schema[key] = value;
    }

    this.emit("add", { entityId, component: key });
  }

  getComponent<K extends keyof ComponentSchema>(
    entityId: number,
    key: K,
  ): ComponentSchema[K] | undefined {
    if (!this.hasComponent(entityId, key)) return;
    return this.componentSet[entityId][key];
  }

  hasComponent<K extends keyof ComponentSchema>(
    entityId: number,
    key: K,
  ): boolean {
    const schema = this.componentSet[entityId];
    if (!schema) return false;
    return key in schema;
  }

  removeComponent<K extends keyof ComponentSchema>(entityId: number, key: K) {
    if (!this.componentSet[entityId]) return;

    const schema = this.componentSet[entityId];
    if (schema && schema[key] !== undefined) {
      delete schema[key];

      if (Object.keys(schema).length === 0) {
        delete this.componentSet[entityId];
      }

      this.emit("remove", { entityId, component: key });
    }
  }
}
