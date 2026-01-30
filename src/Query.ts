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
  private world: World;
  private lastVersion: number = 0;
  dirty: boolean;

  constructor(config: QueryConfig, world: World) {
    super();
    this.config = config;
    this.world = world;
    this.entityMap = new SparseSet();
    this.dirty = false;

    this.world.on("entityDestroyed", ({ entityId }) => {
      if (this.entityMap.has(entityId)) {
        this.emit("removed", entityId);
        this.entityMap.remove(entityId);
      }
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

  get entities(): Entity[] {
    const values: Entity[] = [];
    this.entityMap.forEach((item) => {
      const entity = this.world.getEntity(item);
      if (entity) values.push(entity);
    });
    return values;
  }

  include(...comps: string[]): Query {
    return this.world.include(...comps);
  }

  exclude(...comps: string[]): Query {
    return this.world.exclude(...comps);
  }

  markDirty() {
    this.dirty = true;
  }

  checkEntities(entities?: Set<number>) {
    if (!this.dirty || this.world.version === this.lastVersion) return;

    const checkedEntities = entities || this.world.entityIds;

    for (let entityId of checkedEntities) {
      if (this.hasComponents(entityId)) {
        this.entityMap.add(entityId);
        this.emit("added", entityId);
      }
    }

    this.dirty = false;
    this.lastVersion = this.world.version;
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
