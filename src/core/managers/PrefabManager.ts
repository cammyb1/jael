import type { ComponentSchema } from "./ComponentManager";
import type World from "../World";
import EventRegistry from "../helpers/EventRegistry";

export interface Prefab {
  readonly id: number;
  readonly name: string;
  readonly schema: ComponentSchema;
}

type CloneFunction = (v: any) => any;
type DetectorType = (v: any) => string | null;

export interface PrefabManagerEvents {
  created: { prefab: string };
  instantiated: { prefab: string; entityId: number };
}

export class PrefabManager extends EventRegistry<PrefabManagerEvents> {
  protected prefabs: Record<string, Prefab> = {};
  private _world: World;

  private _detectors: DetectorType[] = [];
  private _typeCache: WeakMap<any, string | null> = new WeakMap();
  private _cloners: Record<string, CloneFunction> = {};

  private _nexPrefabId = 0;

  constructor(world: World) {
    super();
    this._world = world;

    this.addCloner("array", (v: any[]) => v.slice());
    this.addCloner("primitive", (v) => v);
    this.addCloner("plainObject", (v) => Object.assign({}, v));

    this.addDetector((value) => {
      if (Array.isArray(value)) return "array";
      if (typeof value !== "object" || value === null) return "primitive";
      if (value.constructor === Object) return "plainObject";
      return null;
    });
  }

  addCloner(type: string, fn: CloneFunction) {
    if (this._cloners[type]) return;
    this._cloners[type] = fn;
  }

  addDetector(detector: DetectorType) {
    if (this._detectors.includes(detector)) return;
    this._detectors.push(detector);
  }

  private _getSchemaAttrType(value: any): string {
    let type = this._typeCache.get(value);
    if (type !== undefined) {
      for (let detector of this._detectors) {
        type = detector(value);
        if (type) {
          this._typeCache.set(value, type);
          return type;
        }
      }
    }
    return "primitive";
  }

  private _cloneScheme(scheme: ComponentSchema): ComponentSchema {
    const cloned: ComponentSchema = {};

    for (let [key, value] of Object.entries(scheme)) {
      const type = this._getSchemaAttrType(value);
      const cloner = this._cloners[type];
      cloned[key] = cloner ? cloner(value) : value;
    }

    return cloned;
  }

  hasPrefab(name: string): boolean {
    return !!this.prefabs[name];
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
      schema: this._cloneScheme(schema),
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
      this._cloneScheme(prefab.schema),
    );
    this.emit("instantiated", { prefab: prefab.name, entityId });

    return entityId;
  }
}
