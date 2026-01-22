type ComponentSchema = { [key: string]: any };

export class ComponentManager {
  componentSet: Map<number, ComponentSchema> = new Map();

  addComponent<K extends keyof ComponentSchema>(
    entityId: number,
    key: K,
    value: ComponentSchema[K],
  ) {
    const oldSchema: ComponentSchema | undefined =
      this.componentSet.get(entityId);
    if (!oldSchema) {
      this.componentSet.set(entityId, { [key]: value });
    } else {
      oldSchema[key] = value;
    }
  }

  getComponent<K extends keyof ComponentSchema>(
    entityId: number,
    key: K,
  ): ComponentSchema[K] | undefined {
    if (!this.hasComponent(entityId, key)) return;
    const schema = this.componentSet.get(entityId)!;

    return schema[key];
  }

  hasComponent<K extends keyof ComponentSchema>(
    entityId: number,
    key: K,
  ): boolean {
    const schema = this.componentSet.get(entityId);
    if (!schema) return false;
    return key in schema;
  }

  removeComponent<K extends keyof ComponentSchema>(entityId: number, key: K) {
    if (!this.componentSet.get(entityId)) return;

    const schema = this.componentSet.get(entityId);
    if (schema && schema[key] !== undefined) {
      delete schema[key];
    }
  }
}
