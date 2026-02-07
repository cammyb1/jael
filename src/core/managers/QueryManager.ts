import type { Entity } from "./EntityManager";
import EventRegistry from "../helpers/EventRegistry";
import type World from "../World";
import { SparseSet } from "../helpers/SparseSet";

export interface QueryConfig {
  include: string[];
  exclude: string[];
}

export interface QueryEvents {
  added: number;
  removed: number;
}

export interface QueryManagerEvents {
  update: void;
  create: Query;
}

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

  hasComponents(entityId: number) {
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

  size(): number {
    return this._entityMap.size();
  }

  get ids(): SparseSet<number> {
    return this._entityMap;
  }

  get entities(): Entity[] {
    const values: Entity[] = [];
    this._entityMap.forEach((item) => {
      const entity = this._world.getEntity(item);
      if (entity) values.push(entity);
    });
    return values;
  }

  include(...comps: string[]): Query {
    return this._world.include(...comps);
  }

  exclude(...comps: string[]): Query {
    return this._world.exclude(...comps);
  }

  setDirty(v: boolean) {
    this._dirty = v;
  }

  isDirty(): boolean {
    return this._dirty;
  }

  checkEntities(entities?: Set<number>) {
    if (!this.isDirty() || this._world.version === this._lastVersion) return;

    const checkedEntities = entities || this._world.entityIds;

    for (let entityId of checkedEntities) {
      if (this.hasComponents(entityId)) {
        this._entityMap.add(entityId);
        this.emit("added", entityId);
      }
    }

    this.setDirty(false);
    this._lastVersion = this._world.version;
  }
}

export class QueryManager extends EventRegistry<QueryManagerEvents> {
  _queries: Record<number, Query> = {};
  _world: World;

  constructor(world: World) {
    super();
    this._world = world;
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

  hasQuery(hash: number): boolean {
    return !!this._queries[hash];
  }

  getQuery(hash: number): Query | undefined {
    return this._queries[hash];
  }

  createQuery(config: QueryConfig): Query {
    const hash = QueryManager.getHash(config);
    const existingQuery = this.getQuery(hash);
    let query = existingQuery;
    if (!query) {
      query = new Query(config, this._world);
      this._queries[hash] = query;
      this.emit("create", query);
    }
    return query;
  }

  update(entities: Set<number>) {
    for (const query of Object.values(this._queries)) {
      query.setDirty(true);
      query.checkEntities(entities.size > 0 ? entities : undefined);
    }
    this.emit("update");
  }
}
