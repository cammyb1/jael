import { ComponentManager, type ComponentSchema } from "./ComponentManager";
import { Entity, EntityManager } from "./EntityManager";
import EventRegistry from "./EventRegistry";
import { Query, type QueryConfig } from "./Query";
import { SparseSet } from "./SparseSet";
import { SystemManager, type System } from "./SystemManager";

export interface WorldEvents {
  entityCreated: { entityId: number };
  entityDestroyed: { entityId: number };
  componentAdded: { entityId: number; component: keyof ComponentSchema };
  componentRemoved: { entityId: number; component: keyof ComponentSchema };
  updated: void;
}

export default class World extends EventRegistry<WorldEvents> {
  entityManager: EntityManager;
  componentManager: ComponentManager;
  systemManager: SystemManager;
  queries: Map<number, Query>;
  version: number;

  constructor() {
    super();
    this.entityManager = new EntityManager(this);
    this.componentManager = new ComponentManager(this);
    this.systemManager = new SystemManager();
    this.version = 0;

    // We return a new instance proxy to make sure we get the last version ( before removed )
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

    this.queries = new Map();
  }

  getEntity(id: number): Entity | undefined {
    return this.exist(id) ? new Entity(this, id) : undefined;
  }

  get entityIds(): SparseSet<number> {
    return this.entityManager.entities;
  }

  query(config: QueryConfig): Query {
    const hash: number = Query.getHash(config);
    const existingQuery: Query | undefined = this.queries.get(hash);
    let query = existingQuery;
    if (!query) {
      query = new Query(config, this);
      this.queries.set(hash, query);
      this._updateQueries();
    }
    return query;
  }

  private _updateQueries() {
    const entities = this.componentManager.dirtyEntities;
    this.queries.forEach((query: Query) => {
      query.markDirty();
      if (entities.size > 0) {
        query.checkEntities();
      }
    });
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

  destroy(entityId: number) {
    this.entityManager.destroy(entityId);
  }

  addSystem(sys: System) {
    this.systemManager.addSystem(sys);
  }

  removeSystem(sys: System) {
    this.systemManager.removeSystem(sys);
  }

  addComponent(entityId: number, compKey: string, compValue: any) {
    this.componentManager.addComponent(entityId, compKey, compValue);
  }

  getComponent<T>(entityId: number, compKey: string): T {
    return this.componentManager.getComponent(entityId, compKey);
  }

  removeComponent(entityId: number, compKey: string) {
    this.componentManager.removeComponent(entityId, compKey);
  }

  update() {
    this.systemManager.systemList.forEach((system: System) => {
      system.update();
    });

    this.emit("updated");
  }
}
