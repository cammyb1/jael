export class Entity {
  id: number;
  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  add() {
    // add Component via World
  }

  remove() {}
  get() {}
}

export class EntityManager {
  entities: Map<number, Entity>;
  entityIdCounter: number = 0;

  constructor() {
    this.entities = new Map();
  }

  create(name: string): Entity {
    this.entityIdCounter++;
    const entity = new Entity(this.entityIdCounter, name);
    this.entities.set(this.entityIdCounter, entity);
    return entity;
  }

  destroy(entity: Entity) {}
}
