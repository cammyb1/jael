import EventRegistry from "./EventRegistry";
import { SparseSet } from "./SparseSet";
import type World from "./World";

export class Entity {
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
    this._world.addComponent(this.id, compType, compValue);
  }

  /**
   * Remove component of current entity.
   * @param compType Component name
   */
  remove(compType: string) {
    this._world.removeComponent(this.id, compType);
  }

  /**
   * Check if current entity has a component.
   * @param compType Component name
   * @returns boolean
   */
  has(compKey: string): boolean {
    return this._world.componentManager.hasComponent(this.id, compKey);
  }

  /**
   * Get passed component schema of current entity.
   * @param compType Component name
   * @returns Return component schema with T(any as default) as type
   */
  get<T = any>(compType: string): T {
    return this._world.componentManager.getComponent(this.id, compType);
  }
}

export class EntityManager extends EventRegistry<EntityManagerEvents> {
  entityMap: SparseSet<number> = new SparseSet();
  nextId: number = 0;
  _world: World;

  constructor(world: World) {
    super();
    this._world = world;
  }

  get entities(): SparseSet<number> {
    return this.entityMap;
  }

  create(): number {
    const id = this.nextId++;
    this.entities.add(id);

    this.emit("create", id);

    return id;
  }

  exist(id: number): boolean {
    return this.entities.has(id);
  }

  size(): number {
    return this.entities.size();
  }

  destroy(id: number): number {
    this.entities.remove(id);
    this.emit("destroy", id);
    return id;
  }
}

export interface EntityManagerEvents {
  create: number;
  destroy: number;
}
