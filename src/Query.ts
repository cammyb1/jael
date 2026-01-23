import type { Entity } from "./EntityManager";
import { SparseSet } from "./SparseSet";
import type World from "./World";

export interface QueryConfig {
  include: string[];
  exclude: string[];
}

export class Query {
  config: QueryConfig;
  entityMap: SparseSet<Entity>;
  world: World;

  constructor(config: QueryConfig, world: World) {
    this.config = config;
    this.world = world;
    this.entityMap = new SparseSet();
  }

  hasComponents(entity: Entity) {
    return (
      this.config.include?.every((comp: string) => entity.has(comp)) &&
      this.config.exclude?.every((comp: string) => !entity.has(comp))
    );
  }

  get entities(): SparseSet<Entity> {
    return this.entityMap;
  }

  include(...comps: string[]): Query {
    return this.world.include(...comps);
  }

  exclude(...comps: string[]): Query {
    return this.world.exclude(...comps);
  }

  private _checkExistingEntities() {
    for (let entity of this.entities) {
      if (!this.world.exist(entity)) {
        this.entityMap.remove(entity);
      }
    }
  }

  checkEntities() {
    for (let entity of this.world.entities) {
      if (entity && this.hasComponents(entity)) {
        this.entityMap.add(entity);
      }
    }
    // check if current entities exist in world
    this._checkExistingEntities();
  }

  static getHash(config: QueryConfig): number {
    const inString = config.include
      ?.map((s) => s.trim())
      .filter((s) => s)
      .join("_");

    const outString = config.exclude
      ?.map((s) => s.trim())
      .filter((s) => s)
      .join("_");

    const formedString = "in_" + inString + "_out_" + outString;

    let hash = 0;
    for (const char of formedString) {
      hash = (hash << 5) - hash + char.charCodeAt(0);
      hash |= 0; // Constrain to 32bit integer
    }
    return hash;
  }
}
