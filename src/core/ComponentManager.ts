export class ComponentManager {
  componentSet: Map<number, { [key: string]: any }> = new Map();

  addComponent(entityId: number, key: string, value: any) {
    const oldSchema = this.componentSet.get(entityId);
    if (!oldSchema) {
      this.componentSet.set(entityId, { [key]: value });
    } else {
      oldSchema[key] = value;
    }
  }

  removeComponent(entityId: number, key: string) {
    if (!this.componentSet.get(entityId)) return;

    const schema = this.componentSet.get(entityId);
    if (schema && schema[key] !== undefined) {
      delete schema[key];
    }
  }
}
