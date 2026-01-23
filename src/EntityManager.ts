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

  /**
   * Add component to current entity.
   * @param compType Component name
   * @param compValue Component value
   */
  add(compType: string, compValue: any) {
    this._world.addComponent(this, compType, compValue);
  }

  /**
   * Remove component of current entity.
   * @param compType Component name
   */
  remove(compType: string) {
    this._world.removeComponent(this, compType);
  }

  /**
   * Check if current entity has a component.
   * @param compType Component name
   * @returns boolean
   */
  has(compKey: string): boolean {
    return this._world.componentManager.hasComponent(this, compKey);
  }

  /**
   * Get passed component schema of current entity.
   * @param compType Component name
   * @returns Return component schema with T(any as default) as type
   */
  get<T = any>(compType: string): T {
    return this._world.componentManager.getComponent(this, compType);
  }
}

export class EntityManager extends EventRegistry<EntityManagerEvents> {
  entityMap: SparseSet<Entity> = new SparseSet();
  nextId: number = 0;
  _world: World;

  constructor(world: World) {
    super();
    this._world = world;
  }

  get entities(): SparseSet<Entity> {
    return this.entityMap;
  }

  create(): Entity {
    const id = this.nextId++;
    const entity = new Entity(this._world, id);
    this.entities.add(entity);

    this.emit("create", entity);

    return entity;
  }

  exist(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  size(): number {
    return this.entities.size();
  }

  destroy(entity: Entity): Entity {
    this.entities.remove(entity);
    this.emit("destroy", entity);
    return entity;
  }
}

export interface EntityManagerEvents {
  create: Entity;
  destroy: Entity;
}

export { type Entity };
