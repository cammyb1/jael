export default class EventRegistry<E extends { [key: string]: any } = {}> {
  private _listeners: Map<string, Set<Function>> = new Map();

  on<K extends string>(type: K, callback: (e: E[K]) => void): void {
    if (this.contains(type, callback)) {
      return;
    }
    const listeners = this._listeners.get(type);
    if (!listeners) {
      this._listeners.set(type, new Set([callback]));
    } else {
      listeners.add(callback);
    }
  }

  off<K extends string>(type: K, callback: (e: E[K]) => void): void {
    if (!this.contains(type, callback)) {
      return;
    }

    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  once<K extends string>(type: K, callback: (e: E[K]) => void): void {
    const onceCb: (e: E[K]) => void = (event: E[K]) => {
      callback(event);
      this.off(type, onceCb);
    };

    this.on(type, onceCb);
  }

  clearEvent<K extends string>(type: K) {
    if (!this._listeners.get(type)) return;
    this._listeners.get(type)?.clear();
  }

  clearAllEvents() {
    this._listeners.forEach((set: Set<Function>) => set.clear());
    this._listeners.clear();
  }

  contains<K extends string>(type: K, callback: (e: E[K]) => void): boolean {
    if (!this._listeners.get(type)) return false;
    return this._listeners.get(type)!.has(callback);
  }

  emit<K extends string>(type: K, data?: E[K]): void {
    if (!this._listeners.get(type)) {
      // Does not exist any subscribers :(
      return;
    }

    this._listeners.get(type)?.forEach((callback) => {
      callback(data);
    });
  }
}
