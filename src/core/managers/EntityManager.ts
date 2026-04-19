import EventRegistry from "../helpers/EventRegistry";
import { SparseSet } from "../helpers/SparseSet";
import type World from "../World";
import type { ComponentKey } from "./ComponentManager";

export class Entity {
  readonly id: number;
  private _world: World;

  constructor(world: World, id: number) {
    this.id = id;
    this._world = world;
  }

  /**
   * Add / update component to current entity.
   * @param compType Component name
   * @param compValue Component value
   */
  addComponent<T>(compType: ComponentKey, compValue: T) {
    this._world.addComponent(this.id, compType, compValue);
  }

  /**
   * Remove component of current entity.
   * @param compType Component name
   */
  removeComponent(compType: ComponentKey) {
    this._world.removeComponent(this.id, compType);
  }

  /**
   * Check if current entity has a component.
   * @param compType Component name
   * @returns boolean
   */
  hasComponent(compKey: ComponentKey): boolean {
    return this._world.componentManager.hasComponent(this.id, compKey);
  }

  /**
   * Get component names attached to this entity.
   * @returns array of component names as string
   */
  getComponentNames(): string[] {
    return Object.keys(
      this._world.componentManager.getComponentsSchema(this.id),
    );
  }

  /**
   * Get passed component schema of current entity.
   * @param compType Component name
   * @returns Return component schema with T(any as default) as type
   */
  getComponent<T>(compType: ComponentKey): T | undefined {
    return this._world.componentManager.getComponent<T>(this.id, compType);
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

  clear() {
    for (let entityId of this.entityMap) {
      this.destroy(entityId);
    }
    this.nextId = 0;
  }

  create(): number {
    const id = this.nextId++;
    this.entities.add(id);

    this.emit("create", id);

    return id;
  }

  serialize(): number[] {
    return Array.from(this.entityMap);
  }

  deserialize(data: number[]) {
    this.clear();
    [...data].sort().forEach((e) => {
      this.entityMap.add(e);
      this.emit("create", e);
    });
    this.nextId = Math.max(...(data.length > 0 ? data : [0]), 0);
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
