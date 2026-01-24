import { ComponentManager, type ComponentSchema } from "./ComponentManager";
import { EntityManager, type Entity } from "./EntityManager";
import EventRegistry from "./EventRegistry";
import { Query, type QueryConfig } from "./Query";
import { SparseSet } from "./SparseSet";
import { SystemManager, type System } from "./SystemManager";

export interface WorldEvents {
  entityCreated: { entity: Entity };
  entityDestroyed: { entity: Entity };
  componentAdded: { entity: Entity; component: keyof ComponentSchema };
  componentRemoved: { entity: Entity; component: keyof ComponentSchema };
  updated: void;
}

export default class World extends EventRegistry<WorldEvents> {
  entityManager: EntityManager;
  componentManager: ComponentManager;
  systemManager: SystemManager;
  queries: Map<number, Query>;

  constructor() {
    super();

    this.entityManager = new EntityManager(this);
    this.componentManager = new ComponentManager(this);
    this.systemManager = new SystemManager();

    this.entityManager.on("create", (entity: Entity | undefined) => {
      if (entity) {
        this.emit("entityCreated", { entity });
        this._updateQueries();
      }
    });
    this.entityManager.on("destroy", (entity: Entity | undefined) => {
      if (entity) {
        this.emit("entityDestroyed", { entity });
        this._updateQueries();
        this.componentManager.clearComponentSchema(entity);
      }
    });
    this.componentManager.on(
      "add",
      (payload: { entity: Entity; component: keyof ComponentSchema }) => {
        this.emit("componentAdded", {
          entity: payload.entity,
          component: payload.component,
        });
        this._updateQueries();
      },
    );
    this.componentManager.on(
      "remove",
      (payload: { entity: Entity; component: keyof ComponentSchema }) => {
        this.emit("componentRemoved", {
          entity: payload.entity,
          component: payload.component,
        });
        this._updateQueries();
      },
    );

    this.queries = new Map();
  }

  get entities(): SparseSet<Entity> {
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
    this.queries.forEach((query: Query) => query.checkEntities());
  }

  exist(entity: Entity): boolean {
    return this.entityManager.exist(entity);
  }

  include(...comps: string[]): Query {
    return this.query({ include: comps, exclude: [] });
  }

  exclude(...comps: string[]): Query {
    return this.query({ include: [], exclude: comps });
  }

  create(): Entity {
    return this.entityManager.create();
  }

  destroy(entity: Entity) {
    this.entityManager.destroy(entity);
  }

  addSystem(sys: System) {
    this.systemManager.addSystem(sys);
  }

  removeSystem(sys: System) {
    this.systemManager.removeSystem(sys);
  }

  addComponent(entity: Entity, compKey: string, compValue: any) {
    this.componentManager.addComponent(entity, compKey, compValue);
  }

  removeComponent(entity: Entity, compKey: string) {
    this.componentManager.removeComponent(entity, compKey);
  }

  update() {
    this.systemManager.systemList.forEach((system: System) => {
      system.update();
    });

    this.emit("updated");
  }
}
