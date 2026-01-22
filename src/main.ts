import EventRegistry from "./core/EventRegistry";
import { type System, SystemManager } from "./core/SystemManager";
import {
  type Entity,
  EntityManager,
  type EntityManagerEvents,
} from "./core/EntityManager";
import {
  type ComponentSchema,
  ComponentManager,
  type ComponentManagerEvents,
} from "./core/ComponentManager";
import { Query, type QueryConfig } from "./core/Query";
import { SparseSet } from "./core/SparseSet";
import { Time, type TimeEvents } from "./core/Time";
import World, { type WorldEvents } from "./core/World";

export {
  type System,
  type Entity,
  type EntityManagerEvents,
  type ComponentManagerEvents,
  type ComponentSchema,
  type QueryConfig,
  type TimeEvents,
  type WorldEvents,
  Query,
  World,
  Time,
  SparseSet,
  EventRegistry,
  SystemManager,
  EntityManager,
  ComponentManager,
};
