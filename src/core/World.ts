import { ComponentManager } from "./ComponentManager";
import { EntityManager, type Entity } from "./EntityManager";
import { Query, type QueryConfig } from "./Query";
import { SystemManager, type System } from "./SystemManager";

export default class World {
  entityManager: EntityManager;
  componentManager: ComponentManager;
  systemManager: SystemManager;
  queries: Map<number, Query>;

  constructor() {
    this.entityManager = new EntityManager(this);
    this.componentManager = new ComponentManager();
    this.systemManager = new SystemManager();

    this.queries = new Map();
  }

  get entities(): Entity[] {
    return this.entityManager.entities;
  }

  query(config: QueryConfig): Query {
    const hash: number = Query.getHash(config);
    const existingQuery: Query | undefined = this.queries.get(hash);
    let query = existingQuery;
    if (!query) {
      query = new Query(config, this);
      this.queries.set(hash, query);
    }
    this.updateQueries();
    return query;
  }

  updateQueries() {
    this.queries.forEach((query: Query) => query.checkEntities());
  }

  include(...comps: string[]): Query {
    return this.query({ include: comps, exclude: [] });
  }

  exclude(...comps: string[]): Query {
    return this.query({ include: [], exclude: comps });
  }

  create(): Entity {
    const entity = this.entityManager.create();
    this.updateQueries();
    return entity;
  }

  destroy(entity: Entity) {
    this.entityManager.remove(entity);
    this.updateQueries();
  }

  addSystem(sys: System) {
    this.systemManager.addSystem(sys);
  }

  removeSystem(sys: System) {
    this.systemManager.removeSystem(sys);
  }

  addComponent(entity: Entity, compKey: string, compValue: any) {
    this.componentManager.addComponent(entity.id, compKey, compValue);
  }

  removeComponent(entity: Entity, compKey: string) {
    this.componentManager.removeComponent(entity.id, compKey);
  }

  update() {
    this.systemManager.systemList.forEach((system: System) => {
      system.update();
    });
  }
}
