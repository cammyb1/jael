import {
  ComponentManager,
  type ComponentKey,
} from "./managers/ComponentManager";
import { Entity, EntityManager } from "./managers/EntityManager";
import EventRegistry from "./helpers/EventRegistry";
import { Query, QueryHashCache, type QueryConfig } from "./Query";
import { SparseSet } from "./helpers/SparseSet";
import { Serializer, type WorldSerialized } from "./helpers/Serializer";

export interface WorldEvents {
  entityCreated: { entityId: number };
  entityDestroyed: { entityId: number };
  componentAdded: { entityId: number; component: ComponentKey };
  componentRemoved: { entityId: number; component: ComponentKey };
}

export default class World extends EventRegistry<WorldEvents> {
  entityManager: EntityManager;
  componentManager: ComponentManager;
  _queries: Map<string, Query> = new Map();

  version: number;

  constructor() {
    super();
    this.entityManager = new EntityManager(this);
    this.componentManager = new ComponentManager(this);

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
      this.componentManager.clearComponentSchema(entityId);
      this._updateQueries();
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
  }

  getEntity(id: number): Entity | undefined {
    return this.exist(id) ? new Entity(this, id) : undefined;
  }

  get entityIds(): SparseSet<number> {
    return this.entityManager.entities;
  }

  query(config: QueryConfig): Query {
    const hash = QueryHashCache.generate(config);
    let query = this._queries.get(hash);
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

  createWith<T extends Record<string, any>>(schema: T): number {
    const id = this.create();
    this.componentManager.setComponentsSchema(id, schema);
    return id;
  }

  create(): number {
    return this.entityManager.create();
  }

  destroy(entityId: number) {
    this.entityManager.destroy(entityId);
  }

  addComponent<T>(entityId: number, compKey: ComponentKey, compValue: T) {
    this.componentManager.addComponent(entityId, compKey, compValue);
  }

  getComponent<T>(entityId: number, compKey: ComponentKey): T | undefined {
    return this.componentManager.getComponent<T>(entityId, compKey);
  }

  removeComponent(entityId: number, compKey: ComponentKey) {
    this.componentManager.removeComponent(entityId, compKey);
  }

  nuke() {
    this.entityManager.clear();
    this.componentManager.clear();
    this._queries.clear();
    this.version = 0;
  }

  serialize(): WorldSerialized {
    return Serializer.serializeWorld(this);
  }

  deserialize(data: WorldSerialized) {
    Serializer.deserializeWorld(this, data);
    this._updateQueries();
  }
}
