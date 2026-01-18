import ComponentPool from "./ComponentPool";
import EntityManager from "./EntityManager";

export default class World {
  entityManager: EntityManager;
  componentPool: ComponentPool;

  constructor() {
    this.entityManager = new EntityManager();
    this.componentPool = new ComponentPool();
  }
}
