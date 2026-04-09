import EventRegistry from "../helpers/EventRegistry";
import { Serializer } from "../helpers/Serializer";
import type World from "../World";

export type ComponentKey = string;
export type ComponentSchema = Record<ComponentKey, unknown>;

export interface ComponentManagerEvents {
  add: { entityId: number; component: ComponentKey };
  remove: { entityId: number; component: ComponentKey };
}

export interface SerializedComponent {
  _type: string;
  data: any;
}

export type ComponentManagerSerialized = Record<
  number,
  Record<string, SerializedComponent>
>;

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
    const schema = this.componentSet[entityId];
    delete this.componentSet[entityId];

    this.dirtyEntities.push(entityId);
    Object.keys(schema).forEach((compName) => {
      this.emit("remove", { entityId, component: compName });
    });
  }

  getComponentsSchema(entityId: number): ComponentSchema {
    return this.componentSet[entityId];
  }

  setComponentsSchema(entityId: number, schema: Record<string, any>) {
    if (!this.componentSet[entityId]) {
      this.componentSet[entityId] = schema;
      this.dirtyEntities.push(entityId);
      Object.keys(schema).forEach((compName) => {
        this.emit("add", { entityId, component: compName });
      });
    }
  }

  addComponent<T>(entityId: number, key: ComponentKey, value: T) {
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

  getComponent<T>(entityId: number, key: ComponentKey): T | undefined {
    const schema = this.componentSet[entityId] ?? {};
    if (!(key in schema)) return;
    return schema[key] as T;
  }

  cleanDirtyEntities() {
    this.dirtyEntities = [];
  }

  hasComponent(entityId: number, key: ComponentKey): boolean {
    const schema = this.componentSet[entityId];
    if (!schema) return false;
    return key in schema;
  }

  clear() {
    this.cleanDirtyEntities();
    this.componentSet = {};
  }

  serialize(): ComponentManagerSerialized {
    const data: ComponentManagerSerialized = {};
    Object.keys(this.componentSet).forEach((k: string) => {
      const id = Number(k);
      data[id] = Serializer.serializeSchema(this.componentSet[id]);
    });
    return data;
  }

  deserialize(data: ComponentManagerSerialized) {
    this.clear();
    for (const [entityId, schema] of Object.entries(data)) {
      const id = Number(entityId);
      this.componentSet[id] = Serializer.deserializeSchema(schema);
    }
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
