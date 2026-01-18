export class System {
  priority: number;

  constructor(priority: number) {
    this.priority = priority;
  }

  init() {}
  update(dt: number): void;
  update(): void {}
}

export class SystemManager {}
