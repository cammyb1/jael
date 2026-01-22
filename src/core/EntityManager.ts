import EventRegistry from "./EventRegistry";
import { SparseSet } from "./SparseSet";
import type World from "./World";

class Entity {
  readonly id: number;
  private _world: World;

  constructor(world: World, id: number) {
    this.id = id;
    this._world = world;
  }

  add(compType: string, compValue: any) {
    this._world.addComponent(this, compType, compValue);
  }

  remove(compType: string) {
    this._world.removeComponent(this, compType);
  }

  has(compKey: string): boolean {
    return this._world.componentManager.hasComponent(this.id, compKey);
  }

  get(compType: string): any {
    return this._world.componentManager.getComponent(this.id, compType);
  }
}

export { type Entity };

export interface EntityManagerEvents {
  onCreate: Entity;
  onRemove: Entity;
}

export class EntityManager extends EventRegistry<EntityManagerEvents> {
  entityMap: SparseSet<Entity> = new SparseSet();
  nextId: number = 0;
  _world: World;

  constructor(world: World) {
    super();
    this._world = world;
  }

  get entities(): Entity[] {
    return this.entityMap.values;
  }

  create(): Entity {
    const id = this.nextId++;
    const entity = new Entity(this._world, id);
    this.entityMap.add(entity);

    this.emit("onCreate", entity);

    return entity;
  }

  size(): number {
    return this.entityMap.size();
  }

  remove(entity: Entity): Entity {
    this.entityMap.remove(entity);
    this.emit("onRemove", entity);
    return entity;
  }
}
