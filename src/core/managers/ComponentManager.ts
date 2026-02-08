import EventRegistry from "../helpers/EventRegistry";
import type World from "../World";

export type ComponentKey = string;
export type ComponentSchema = Record<ComponentKey, any>;

export interface ComponentManagerEvents {
  add: { entityId: number; component: ComponentKey };
  remove: { entityId: number; component: ComponentKey };
}

export class ComponentManager extends EventRegistry<ComponentManagerEvents> {
  private componentSet: Record<number, ComponentSchema> = {};
  private world: World;
  public dirtyEntities: number[] = [];

  constructor(world: World) {
    super();
    this.world = world;
  }

  clearComponentSchema(entityId: number) {
    if (!this.componentSet[entityId]) return;
    delete this.componentSet[entityId];
  }

  getComponentsSchema(entityId: number): ComponentSchema | undefined {
    return this.componentSet[entityId];
  }

  setComponentsSchema(entityId: number, schema: ComponentSchema) {
    if (!this.componentSet[entityId]) {
      this.componentSet[entityId] = schema;
    }
  }

  addComponent(
    entityId: number,
    key: ComponentKey,
    value: ComponentSchema[ComponentKey],
  ) {
    if (!this.world.exist(entityId)) return;
    const schema: ComponentSchema | undefined = this.componentSet[entityId];
    if (!schema) {
      this.componentSet[entityId] = { [key]: value };
    } else {
      schema[key] = value;
    }

    this.dirtyEntities.push(entityId);
    this.emit("add", { entityId, component: key });
  }

  getComponent(
    entityId: number,
    key: ComponentKey,
  ): ComponentSchema[ComponentKey] | undefined {
    if (!this.hasComponent(entityId, key)) return;
    return this.componentSet[entityId][key];
  }

  cleanDirtyEntities() {
    this.dirtyEntities = [];
  }

  hasComponent(entityId: number, key: ComponentKey): boolean {
    const schema = this.componentSet[entityId];
    if (!schema) return false;
    return key in schema;
  }

  removeComponent(entityId: number, key: ComponentKey) {
    if (!this.componentSet[entityId]) return;

    const schema = this.componentSet[entityId];
    if (schema && schema[key] !== undefined) {
      delete schema[key];

      if (Object.keys(schema).length === 0) {
        delete this.componentSet[entityId];
      }

      this.dirtyEntities.push(entityId);
      this.emit("remove", { entityId, component: key });
    }
  }
}
