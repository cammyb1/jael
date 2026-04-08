import type {
  ComponentSchema,
  SerializedComponent,
} from "../managers/ComponentManager";

export type DetectorType = (v: any) => string | null;
export type SerializeFunction = (v: any) => any;
export type DeserializeFunction = (v: any) => any;

class Serializer {
  private _serializeDetectors: DetectorType[] = [];

  private _serializers: Map<string, SerializeFunction> = new Map();
  private _deserializers: Map<string, DeserializeFunction> = new Map();

  constructor() {
    this.registerSerializer(
      "array",
      (v: any[]) => v.slice(),
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

  registerSerializer(
    type: string,
    serializer: SerializeFunction,
    deserializer: DeserializeFunction,
  ) {
    this._serializers.set(type, serializer);
    this._deserializers.set(type, deserializer);
  }

  registerSerializeDetector(detector: DetectorType) {
    if (this._serializeDetectors.includes(detector)) return;
    this._serializeDetectors.push(detector);
  }

  private _getSerializeType(value: any): string {
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

  serializeSchema(
    schema: ComponentSchema,
  ): Record<string, SerializedComponent> {
    const result: Record<string, SerializedComponent> = {};

    for (const [key, value] of Object.entries(schema)) {
      const type = this._getSerializeType(value);
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

  deserializeSchema(
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
}

const serializerInstance = new Serializer();

export { serializerInstance as Serializer };
