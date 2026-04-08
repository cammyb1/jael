import type {
  ComponentSchema,
  SerializedComponent,
} from "../managers/ComponentManager";
import type World from "../World";

export type DetectorType = (v: any) => string | null;
export type SerializeFunction = (v: any) => any;
export type DeserializeFunction = (v: any) => any;

export interface WorldSerialized {
  entities: number[];
  components: Record<number, Record<string, SerializedComponent>>;
  version: number;
}

export class Serializer {
  private static _serializeDetectors: DetectorType[] = [];

  private static _serializers: Map<string, SerializeFunction> = new Map();
  private static _deserializers: Map<string, DeserializeFunction> = new Map();

  static {
    this.registerSerializer(
      "array",
      (v: any[]) => v,
      (v) => Array.from(v),
    );
    this.registerSerializer(
      "primitive",
      (v) => v,
      (v) => v,
    );
    this.registerSerializer(
      "plainObject",
      (v) => Object.assign({}, v),
      (v) => v,
    );

    this.registerSerializeDetector((value) => {
      if (Array.isArray(value)) return "array";
      if (typeof value !== "object" || value === null) return "primitive";
      if (value.constructor === Object) return "plainObject";
      return null;
    });
  }

  static registerSerializer(
    type: string,
    serializer: SerializeFunction,
    deserializer: DeserializeFunction,
  ) {
    this._serializers.set(type, serializer);
    this._deserializers.set(type, deserializer);
  }

  static registerSerializeDetector(detector: DetectorType) {
    if (this._serializeDetectors.includes(detector)) return;
    this._serializeDetectors.push(detector);
  }

  private static getSerializeType(value: any): string {
    const constructorName = value?.constructor?.name;
    if (!constructorName) return "primitive";
    if (this._serializers.has(constructorName)) {
      return constructorName;
    }

    for (const detector of this._serializeDetectors) {
      const type = detector(value);
      if (type && this._serializers.has(type)) {
        return type;
      }
    }

    return "primitive";
  }

  static serializeSchema(
    schema: ComponentSchema,
  ): Record<string, SerializedComponent> {
    const result: Record<string, SerializedComponent> = {};

    for (const [key, value] of Object.entries(schema)) {
      const type = this.getSerializeType(value);
      const serializer = this._serializers.get(type);

      if (serializer) {
        result[key] = {
          _type: type,
          data: serializer(value),
        };
      } else {
        result[key] = {
          _type: "primitive",
          data: value,
        };
      }
    }

    return result;
  }

  static deserializeSchema(
    data: Record<string, SerializedComponent>,
  ): ComponentSchema {
    const result: ComponentSchema = {};

    for (const [key, serialized] of Object.entries(data)) {
      const deserializer = this._deserializers.get(serialized._type);

      if (deserializer) {
        result[key] = deserializer(serialized.data);
      } else {
        result[key] = serialized.data;
      }
    }

    return result;
  }

  static serializeWorld(world: World): WorldSerialized {
    return {
      entities: world.entityManager.serialize(),
      components: world.componentManager.serialize(),
      version: world.version,
    };
  }

  static deserializeWorld(world: World, data: WorldSerialized) {
    if (data.version === undefined) return;

    world.nuke();
    world.entityManager.deserialize(data.entities);
    world.componentManager.deserialize(data.components);
    world.version = data.version;
  }
}
