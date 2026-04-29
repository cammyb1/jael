import type { Entity } from "./managers/EntityManager";
import EventRegistry from "./helpers/EventRegistry";
import type World from "./World";
import { SparseSet } from "./helpers/SparseSet";

export interface QueryConfig {
  include: string[];
  exclude: string[];
}

export interface QueryEvents {
  added: number;
  removed: number;
}

export abstract class QueryHashCache {
  public static cache: Map<QueryConfig, string> = new Map();

  public static generate(config: QueryConfig): string {
    const existing = this.cache.get(config);
    if (existing) return existing;

    const hash = JSON.stringify(config);
    QueryHashCache.cache.set(config, hash);
    return hash;
  }
}
/**
 * Query class that manages a list of entities with a \
 * certain component configuration
 */
export class Query extends EventRegistry<QueryEvents> {
  private _config: QueryConfig;
  private _world: World;
  private _lastVersion: number = 0;
  private _entityMap: SparseSet<number> = new SparseSet();
  private _dirty: boolean;

  constructor(config: QueryConfig, world: World) {
    super();
    this._config = config;
    this._world = world;
    this._dirty = false;

    this._world.on("entityDestroyed", ({ entityId }) => {
      if (this._entityMap.has(entityId)) {
        this.emit("removed", entityId);
        this._entityMap.remove(entityId);
      }
    });
  }

  private hasComponents(entityId: number) {
    const componentManager = this._world.componentManager;
    return (
      this._config.include?.every((comp: string) =>
        componentManager.getComponent(entityId, comp),
      ) &&
      this._config.exclude?.every(
        (comp: string) => !componentManager.getComponent(entityId, comp),
      )
    );
  }

  /**
   * Get the first Entity id
   * @returns number
   */
  firstId(): number {
    return this._entityMap.first();
  }

  /**
   * Get the first Entity as proxy if exist
   * @returns Entity | undefined
   */
  firstEntity(): Entity | undefined {
    return this.entities[0];
  }

  /**
   * Gets the total number of entities in this query
   * @returns number
   */
  size(): number {
    return this._entityMap.size();
  }

  /**
   * List of entities as an iterable of numbers
   */
  get ids(): SparseSet<number> {
    return this._entityMap;
  }

  /**
   * List of entities as an iterable of EntityProxy
   */
  get entities(): Entity[] {
    const values: Entity[] = [];
    this._entityMap.forEach((item) => {
      const entity = this._world.getEntity(item);
      if (entity) values.push(entity);
    });
    return values;
  }

  /**
   * Creates an include query with the passed components
   * @param comps
   * @returns Query instance
   */
  include(...comps: string[]): Query {
    return this._world.include(...comps);
  }

  /**
   * Creates an exclude query with the passed components
   * @param comps
   * @returns Query instance
   */
  exclude(...comps: string[]): Query {
    return this._world.exclude(...comps);
  }

  setDirty(v: boolean) {
    this._dirty = v;
  }

  isDirty(): boolean {
    return this._dirty;
  }

  checkEntities(entities?: number[]) {
    if (!this.isDirty() || this._world.version === this._lastVersion) return;

    const checkedEntities = entities || this._world.entityIds;

    for (let entityId of checkedEntities) {
      if (this.hasComponents(entityId)) {
        this._entityMap.add(entityId);
        this.emit("added", entityId);
      } else if (this._entityMap.has(entityId)) {
        this._entityMap.remove(entityId);
        this.emit("removed", entityId);
      }
    }

    this.setDirty(false);
    this._lastVersion = this._world.version;
  }
}
