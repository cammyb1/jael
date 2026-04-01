import type {
  ComponentSchema,
  SerializedComponent,
} from "../managers/ComponentManager";

export type CloneFunction = (v: any) => any;
export type DetectorType = (v: any) => string | null;
export type SerializeFunction = (v: any) => any;
export type DeserializeFunction = (v: any) => any;

class Serializer {
  private _cloneDetectors: DetectorType[] = [];
  private _serializeDetectors: DetectorType[] = [];

  private _cloners: Record<string, CloneFunction> = {};
  private _serializers: Map<string, SerializeFunction> = new Map();
  private _deserializers: Map<string, DeserializeFunction> = new Map();

  constructor() {
    this.registerCloner("array", (v: any[]) => v.slice());
    this.registerCloner("primitive", (v) => v);
    this.registerCloner("plainObject", (v) => Object.assign({}, v));

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

    this.registerCommonDetector((value) => {
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

  registerCloner(type: string, fn: CloneFunction) {
    if (this._cloners[type]) return;
    this._cloners[type] = fn;
  }

  registerCommonDetector(detector: DetectorType) {
    this.registerCloneDetector(detector);
    this.registerSerializeDetector(detector);
  }

  registerSerializeDetector(detector: DetectorType) {
    if (this._serializeDetectors.includes(detector)) return;
    this._serializeDetectors.push(detector);
  }

  registerCloneDetector(detector: DetectorType) {
    if (this._cloneDetectors.includes(detector)) return;
    this._cloneDetectors.push(detector);
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

  private _getSchemaAttrType(value: any): string {
    let type;

    for (let detector of this._cloneDetectors) {
      type = detector(value);
    }

    return type || "primitive";
  }

  cloneScheme(scheme: ComponentSchema): ComponentSchema {
    const cloned: ComponentSchema = {};

    for (let [key, value] of Object.entries(scheme)) {
      const type = this._getSchemaAttrType(value);
      const cloner = this._cloners[type];
      cloned[key] = cloner ? cloner(value) : value;
    }

    return cloned;
  }
}

const serializerInstance = new Serializer();

export { serializerInstance as Serializer };
