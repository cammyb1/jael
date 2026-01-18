import { EntityManager } from "./EntityManager";
import { Query } from "./Query";

export default class World {
  entityManager: EntityManager;

  constructor() {
    this.entityManager = new EntityManager();
  }

  create() {}

  addComponent() {}

  executeQuery(): Query {
    return new Query();
  }
}
