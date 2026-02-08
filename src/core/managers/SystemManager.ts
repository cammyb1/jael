export interface System {
  priority: number;
  init?(): void;
  exit?(): void;
  update(): void;
}

export class SystemManager {
  systemList: System[] = [];

  addSystem(system: System) {
    this.systemList.push(system);
    system.init?.();
    this.reorder();
  }

  reorder() {
    this.systemList.sort((a: System, b: System) => a.priority - b.priority);
  }

  has(system: System): boolean {
    const index = this.systemList.indexOf(system);
    return index > 0;
  }

  removeSystem(system: System) {
    if (!this.has(system)) return;

    const index = this.systemList.indexOf(system);
    if (index >= 0) {
      this.systemList.splice(index, 1);
      system.exit?.();
      this.reorder();
    }
  }
}
