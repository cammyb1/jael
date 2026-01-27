import type { Entity } from "./EntityManager";
import EventRegistry from "./EventRegistry";
import { SparseSet } from "./SparseSet";
import type World from "./World";

export interface QueryConfig {
  include: string[];
  exclude: string[];
}

export interface QueryEvents {
  added: number;
  removed: number;
}

export class Query extends EventRegistry<QueryEvents> {
  private config: QueryConfig;
  private entityMap: SparseSet<number>;
  private entityInstancesCache: Map<number, Entity>;
  private world: World;

  constructor(config: QueryConfig, world: World) {
    super();
    this.config = config;
    this.world = world;
    this.entityInstancesCache = new Map();
    this.entityMap = new SparseSet();

    this.on("removed", (entityId) => {
      this.entityInstancesCache.delete(entityId);
    });
  }

  hasComponents(entityId: number) {
    const componentManager = this.world.componentManager;
    return (
      this.config.include?.every((comp: string) =>
        componentManager.getComponent(entityId, comp),
      ) &&
      this.config.exclude?.every(
        (comp: string) => !componentManager.getComponent(entityId, comp),
      )
    );
  }

  size(): number {
    return this.ids.size();
  }

  get hash(): number {
    return Query.getHash(this.config);
  }

  get ids(): SparseSet<number> {
    return this.entityMap;
  }

  private getCachedEntity(id: number): Entity | undefined {
    const existingEntity = this.entityInstancesCache.get(id);
    if (existingEntity) {
      return existingEntity;
    } else {
      const entity = this.world.getEntity(id);
      if (entity) {
        this.entityInstancesCache.set(id, entity);
        return entity;
      }
      return;
    }
  }

  get entities(): Entity[] {
    const values: Entity[] = [];

    // Queries cache threshold
    const isOverSize = this.entityMap.size() > 100;
    this.entityMap.forEach((item) => {
      if (isOverSize) {
        const entity = this.getCachedEntity(item);
        if (entity) values.push(entity);
      } else {
        const entity = this.world.getEntity(item);
        if (entity) values.push(entity);
      }
    });
    return values;
  }

  include(...comps: string[]): Query {
    return this.world.include(...comps);
  }

  exclude(...comps: string[]): Query {
    return this.world.exclude(...comps);
  }

  private _checkExistingEntities() {
    for (let entityId of this.ids) {
      if (!this.world.exist(entityId)) {
        this.emit("removed", entityId);
        this.entityMap.remove(entityId);
      }
    }
  }

  checkEntities() {
    this.entityInstancesCache.clear();

    for (let entityId of this.world.entityIds) {
      if (this.hasComponents(entityId)) {
        this.entityMap.add(entityId);
        this.emit("added", entityId);
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
