import type { ComponentSchema } from "./ComponentManager";
import type World from "../World";
import EventRegistry from "../helpers/EventRegistry";
import { Serializer } from "../helpers/Serializer";

export interface Prefab {
  readonly id: number;
  readonly name: string;
  readonly schema: ComponentSchema;
}

export interface PrefabManagerEvents {
  created: { prefab: string };
  instantiated: { prefab: string; entityId: number };
}

export type PrefabManagerSerialized = Record<string, ComponentSchema>;

export class PrefabManager extends EventRegistry<PrefabManagerEvents> {
  protected prefabs: Record<string, Prefab> = {};
  private _world: World;

  private _nexPrefabId = 0;

  constructor(world: World) {
    super();
    this._world = world;
  }

  hasPrefab(name: string): boolean {
    return !!this.prefabs[name];
  }

  clear() {
    this.prefabs = {};
    this._nexPrefabId = 0;
  }

  getPrefab(name: string): Prefab | undefined {
    return this.prefabs[name];
  }

  removePrefab(name: string) {
    delete this.prefabs[name];
  }

  createFromSchema(name: string, schema: ComponentSchema): Prefab {
    const existingPrefab = this.prefabs[name];
    if (existingPrefab) return existingPrefab;

    const prefab: Prefab = {
      id: this._nexPrefabId,
      name,
      schema: Serializer.cloneScheme(schema),
    };
    this.prefabs[prefab.name] = prefab;
    this._nexPrefabId++;

    this.emit("created", { prefab: prefab.name });
    return prefab;
  }

  createFromEntity(name: string, entityId: number): Prefab | undefined {
    const existingPrefab = this.prefabs[name];
    if (existingPrefab) return existingPrefab;

    const schema = this._world.componentManager.getComponentsSchema(entityId);
    if (!schema) return;
    return this.createFromSchema(name, schema);
  }

  instantiate(name: string): number | undefined {
    const prefab: Prefab | undefined = this.prefabs[name];
    if (!prefab) return;

    const entityId = this._world.create();
    this._world.componentManager.setComponentsSchema(
      entityId,
      Serializer.cloneScheme(prefab.schema),
    );
    this.emit("instantiated", { prefab: prefab.name, entityId });

    return entityId;
  }

  serialize(): PrefabManagerSerialized {
    let data: PrefabManagerSerialized = {};

    for (let name in this.prefabs) {
      data[name] = this.prefabs[name].schema;
    }

    return data;
  }

  deserialize(data: PrefabManagerSerialized) {
    this.clear();

    for (let name in data) {
      this.createFromSchema(name, data[name]);
    }
  }
}
