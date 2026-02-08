import EventRegistry from "./core/helpers/EventRegistry";
import { type System, SystemManager } from "./core/managers/SystemManager";
import {
  type Entity,
  EntityManager,
  type EntityManagerEvents,
} from "./core/managers/EntityManager";
import {
  type ComponentSchema,
  type ComponentKey,
  ComponentManager,
  type ComponentManagerEvents,
} from "./core/managers/ComponentManager";
import { Query, type QueryConfig, type QueryEvents } from "./core/Query";
import {
  PrefabManager,
  type PrefabManagerEvents,
  type Prefab,
} from "./core/managers/PrefabManager";
import { SparseSet } from "./core/helpers/SparseSet";
import { Time, type TimeEvents } from "./core/helpers/Time";
import World, { type WorldEvents } from "./core/World";

export {
  type System,
  type Entity,
  type Prefab,
  type QueryConfig,
  type ComponentSchema,
  type ComponentKey,
  type EntityManagerEvents,
  type PrefabManagerEvents,
  type ComponentManagerEvents,
  type QueryEvents,
  type TimeEvents,
  type WorldEvents,
  Query,
  World,
  Time,
  SparseSet,
  EventRegistry,
  SystemManager,
  EntityManager,
  PrefabManager,
  ComponentManager,
};
