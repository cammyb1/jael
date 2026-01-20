import { EntityManager, type Entity } from "./EntityManager";
import { Query } from "./Query";

export default class World {
  entityManager: EntityManager;

  constructor() {
    this.entityManager = new EntityManager(this);
  }

  get query(): Query {
    return new Query();
  }

  create(): Entity {
    return this.entityManager.create();
  }

  addComponent(
    entity: Entity,
    compType: string | Record<string, any>,
    compValue: any,
  ) {}
}
