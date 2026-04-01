import {
  ComponentManager,
  type ComponentKey,
  type ComponentManagerSerialized,
  type ComponentSchema,
} from "./managers/ComponentManager";
import { Entity, EntityManager } from "./managers/EntityManager";
import EventRegistry from "./helpers/EventRegistry";
import { Query, QueryHashCache, type QueryConfig } from "./Query";
import { SparseSet } from "./helpers/SparseSet";
import {
  PrefabManager,
  type Prefab,
  type PrefabManagerSerialized,
} from "./managers/PrefabManager";

export interface WorldEvents {
  entityCreated: { entityId: number };
  entityDestroyed: { entityId: number };
  componentAdded: { entityId: number; component: ComponentKey };
  componentRemoved: { entityId: number; component: ComponentKey };
  prefabCreated: { prefab: string };
  prefabInstantiated: { prefab: string; entityId: number };
}

export interface WorldSerialized {
  entityManager: number[];
  componentManager: ComponentManagerSerialized;
  prefabManager: PrefabManagerSerialized;
}

export default class World extends EventRegistry<WorldEvents> {
  entityManager: EntityManager;
  componentManager: ComponentManager;
  prefabManager: PrefabManager;
  _queries: Map<number, Query> = new Map();

  version: number;

  constructor() {
    super();
    this.entityManager = new EntityManager(this);
    this.componentManager = new ComponentManager(this);
    this.prefabManager = new PrefabManager(this);

    this.version = 0;

    // Propagate events
    this.entityManager.on("create", (entityId: number) => {
      this.emit("entityCreated", {
        entityId,
      });
      this._updateQueries();
    });
    this.entityManager.on("destroy", (entityId: number) => {
      this.emit("entityDestroyed", {
        entityId,
      });
      this._updateQueries();
      this.componentManager.clearComponentSchema(entityId);
    });
    this.componentManager.on("add", ({ entityId, component }) => {
      this.emit("componentAdded", {
        entityId,
        component,
      });
      this._updateQueries();
    });
    this.componentManager.on("remove", ({ entityId, component }) => {
      const entityInstance = this.getEntity(entityId);
      if (entityInstance) {
        this.emit("componentRemoved", {
          entityId,
          component,
        });
      }
      this._updateQueries();
    });

    this.prefabManager.on("created", (event) =>
      this.emit("prefabCreated", event),
    );
    this.prefabManager.on("instantiated", (event) =>
      this.emit("prefabInstantiated", event),
    );
  }

  getEntity(id: number): Entity | undefined {
    return this.exist(id) ? new Entity(this, id) : undefined;
  }

  get entityIds(): SparseSet<number> {
    return this.entityManager.entities;
  }

  query(config: QueryConfig): Query {
    const hash = QueryHashCache.generate(config);
    const existingQuery = this._queries.get(hash);
    let query = existingQuery;
    if (!query) {
      query = new Query(config, this);
      this._queries.set(hash, query);
      this._updateQueries();
    }
    return query;
  }

  private _updateQueries() {
    const entities: number[] = this.componentManager.dirtyEntities;
    for (const [, query] of this._queries) {
      query.setDirty(true);
      query.checkEntities(entities.length > 0 ? entities : undefined);
    }
    this.componentManager.cleanDirtyEntities();
    this.version++;
  }

  exist(entityId: number): boolean {
    return this.entityManager.exist(entityId);
  }

  include(...comps: string[]): Query {
    return this.query({ include: comps, exclude: [] });
  }

  exclude(...comps: string[]): Query {
    return this.query({ include: [], exclude: comps });
  }

  create(): number {
    return this.entityManager.create();
  }

  createPrefab(
    name: string,
    arg: ComponentSchema | number,
  ): Prefab | undefined {
    return typeof arg === "number"
      ? this.prefabManager.createFromEntity(name, arg)
      : this.prefabManager.createFromSchema(name, arg);
  }

  getPrefab(name: string): Prefab | undefined {
    return this.prefabManager.getPrefab(name);
  }

  removePrefab(name: string) {
    this.prefabManager.removePrefab(name);
  }

  instantiate(name: string): number | undefined {
    return this.prefabManager.instantiate(name);
  }

  destroy(entityId: number) {
    this.entityManager.destroy(entityId);
  }

  addComponent(entityId: number, compKey: ComponentKey, compValue: any) {
    this.componentManager.addComponent(entityId, compKey, compValue);
  }

  getComponent<T = unknown>(
    entityId: number,
    compKey: ComponentKey,
  ): T | undefined {
    return this.componentManager.getComponent<T>(entityId, compKey);
  }

  removeComponent(entityId: number, compKey: ComponentKey) {
    this.componentManager.removeComponent(entityId, compKey);
  }

  nuke() {
    this.entityManager.clear();
    this.prefabManager.clear();
    this.componentManager.clear();
    this._updateQueries();
    this.version = 0;
  }

  serialize(): WorldSerialized {
    const data = {
      entityManager: this.entityManager.serialize(),
      componentManager: this.componentManager.serialize(),
      prefabManager: this.prefabManager.serialize(),
    };

    return data;
  }

  deserialize(data: WorldSerialized) {
    this.nuke();

    this.entityManager.deserialize(data.entityManager);
    this.componentManager.deserialize(data.componentManager);
    this.prefabManager.deserialize(data.prefabManager);

    this._updateQueries();
  }
}
