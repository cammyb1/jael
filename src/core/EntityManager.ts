import { SparseSet } from "./SparseSet";
import type World from "./World";

class Entity {
  readonly id: number;
  private world: World;

  constructor(world: World, id: number) {
    this.id = id;
    this.world = world;
  }

  add(compType: string | Record<string, any>, compValue: any) {
    if (typeof compType !== "string") {
      Object.keys(compType).forEach((key: string) => {
        const value: any = compType[key];
        this.world.addComponent(this, key, value);
      });
    } else {
      this.world.addComponent(this, compType, compValue);
    }
  }

  remove(compType: string) {
    this.world.removeComponent(this, compType);
  }

  get(compType: string) {}
}

export { type Entity };

export class EntityManager {
  world: World;
  entityLocations: SparseSet<Entity> = new SparseSet();
  nextId: number = 0;

  constructor(world: World) {
    this.world = world;
  }

  create(): Entity {
    const id = this.nextId++;
    const entity = new Entity(this.world, id);
    this.entityLocations.add(entity);

    return entity;
  }

  destroy(entity: Entity) {
    if (typeof entity === "number") {
      this.entityLocations.remove(entity);

      // Remove entity from all queries.
    }
  }
}
