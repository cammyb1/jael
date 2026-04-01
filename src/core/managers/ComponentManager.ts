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
    delete this.componentSet[entityId];
  }

  getComponentsSchema(entityId: number): ComponentSchema {
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

  getComponent<T extends ComponentSchema[ComponentKey] = unknown>(
    entityId: number,
    key: ComponentKey,
  ): T {
    return this.componentSet[entityId][key] as T;
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

  deserialize(payload: ComponentManagerSerialized) {
    this.clear();
    for (const [entityId, schema] of Object.entries(payload)) {
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
