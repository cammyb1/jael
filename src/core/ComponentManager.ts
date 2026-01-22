import type { Entity } from "./EntityManager";
import EventRegistry from "./EventRegistry";

export type ComponentSchema = Record<string, any>;

export interface ComponentManagerEvents {
  add: { entity: Entity, component: keyof ComponentSchema };
  remove: { entity: Entity, component: keyof ComponentSchema };
}

export class ComponentManager extends EventRegistry<ComponentManagerEvents> {
  componentSet: Map<number, ComponentSchema> = new Map();

  addComponent<K extends keyof ComponentSchema>(
    entity: Entity,
    key: K,
    value: ComponentSchema[K],
  ) {
    const oldSchema: ComponentSchema | undefined = this.componentSet.get(
      entity.id,
    );
    if (!oldSchema) {
      this.componentSet.set(entity.id, { [key]: value });
    } else {
      oldSchema[key] = value;
    }

    this.emit("add", { entity, component: key });
  }

  getComponent<K extends keyof ComponentSchema>(
    entity: Entity,
    key: K,
  ): ComponentSchema[K] | undefined {
    if (!this.hasComponent(entity, key)) return;
    const schema = this.componentSet.get(entity.id)!;

    return schema[key];
  }

  hasComponent<K extends keyof ComponentSchema>(
    entity: Entity,
    key: K,
  ): boolean {
    const schema = this.componentSet.get(entity.id);
    if (!schema) return false;
    return key in schema;
  }

  removeComponent<K extends keyof ComponentSchema>(entity: Entity, key: K) {
    if (!this.componentSet.get(entity.id)) return;

    const schema = this.componentSet.get(entity.id);
    if (schema && schema[key] !== undefined) {
      delete schema[key];

      this.emit("remove", { entity, component: key });
    }
  }
}
