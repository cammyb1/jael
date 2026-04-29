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

/**
 * Base clase that contains all entities and its components, and
 * capable of managing queries of entities
 */
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

  /**
   * Wraps and existing entity into an Entity Proxy (with its utils funcitions)
   * @param id
   * @returns Proxy Entity (if exist) or undefined
   */
  getEntity(id: number): Entity | undefined {
    return this.exist(id) ? new Entity(this, id) : undefined;
  }

  /**
   * World entity list as ids
   */
  get entityIds(): SparseSet<number> {
    return this.entityManager.entities;
  }

  /**
   * World entity list as Proxy Class
   */
  get entities(): Entity[] {
    const values: Entity[] = [];
    this.entityIds.forEach((item) => {
      const entity = this.getEntity(item);
      if (entity) values.push(entity);
    });
    return values;
  }

  /**
   * Creates a query of entities with the passed componentes
   * @param config - { include:[componentKey...], exclude: [componentKey...] }
   * @returns Query instance to manage entities with passed config
   */
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

  /**
   * Check if a passed entity exist in this world
   * @param entityId
   * @returns boolean
   */
  exist(entityId: number): boolean {
    return this.entityManager.exist(entityId);
  }

  /**
   * Creates an include query with the passed components
   * @param comps
   * @returns Query instance
   */
  include(...comps: string[]): Query {
    return this.query({ include: comps, exclude: [] });
  }

  /**
   * Creates an exclude query with the passed components
   * @param comps
   * @returns Query instance
   */
  exclude(...comps: string[]): Query {
    return this.query({ include: [], exclude: comps });
  }

  /**
   * Creates an entity with the passed schema
   * @param schema
   * @returns EntityId
   */
  createWith<T extends Record<string, any>>(schema: T): number {
    const id = this.create();
    this.componentManager.setComponentsSchema(id, schema);
    return id;
  }

  /**
   * Creates an entity
   * @returns EntityId
   */
  create(): number {
    return this.entityManager.create();
  }

  /**
   * Destroys the passed entity
   */
  destroy(entityId: number) {
    this.entityManager.destroy(entityId);
  }

  /**
   * Adds a component to the current Entity Schema
   * @param entityId 
   * @param compKey (Component name)
   * @param compValue (Component Schema)
   */
  addComponent<T>(entityId: number, compKey: ComponentKey, compValue: T) {
    this.componentManager.addComponent(entityId, compKey, compValue);
  }

  /**
   * Gets a component if exist inside and entity Schema
   * @param entityId 
   * @param compKey (Component name)
   * @returns ComponentSchema | undefined
   */
  getComponent<T>(entityId: number, compKey: ComponentKey): T | undefined {
    return this.componentManager.getComponent<T>(entityId, compKey);
  }

  /**
   * Removes a component if exist inside an entity Schema
   * @param entityId 
   * @param compKey (Component name)
   */
  removeComponent(entityId: number, compKey: ComponentKey) {
    this.componentManager.removeComponent(entityId, compKey);
  }

  /**
   * Launches a nuclear missile and destroys all the world.
   */
  nuke() {
    this.entityManager.clear();
    this.componentManager.clear();
    this._queries.clear();
    this.version = 0;
  }

  /**
   * Serialize all entities and its components, queries are not serialized.
   * @returns World serialized
   */
  serialize(): WorldSerialized {
    return Serializer.serializeWorld(this);
  }

  /**
   * Nukes current world and imports all passed entities/components
   * @param data World Serialized
   */
  deserialize(data: WorldSerialized) {
    Serializer.deserializeWorld(this, data);
  }
}
