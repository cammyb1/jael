export type Event<V> = { [key: string]: V };
export type EventCallback<V> = (event: V[keyof V]) => void;

export default class EventRegistry<E extends Event<any> = {}> {
  private _listeners: Map<keyof E, Set<EventCallback<E>>> = new Map();

  on(type: keyof E, callback: EventCallback<E>): void {
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

  off(type: keyof E, callback: EventCallback<E>): void {
    if (!this.contains(type, callback)) {
      return;
    }

    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  once(type: keyof E, callback: EventCallback<E>): void {
    const onceCb: (e?: E[keyof E]) => void = ((event: E[keyof E]) => {
      callback(event);
      this.off(type, onceCb);
    }) as (e?: E[keyof E]) => void;

    this.on(type, onceCb);
  }

  clearEvent(type: keyof E) {
    if (!this._listeners.get(type)) return;
    this._listeners.get(type)?.clear();
  }

  clearAllEvents() {
    this._listeners.forEach((set: Set<EventCallback<E>>) => set.clear());
    this._listeners.clear();
  }

  contains(type: keyof E, callback: EventCallback<E>): boolean {
    if (!this._listeners.get(type)) return false;
    return this._listeners.get(type)!.has(callback);
  }

  emit(type: keyof E, data: E[keyof E]): void {
    if (!this._listeners.get(type)) {
      // Does not exist any subscribers :(
      return;
    }

    this._listeners.get(type)?.forEach((callback: EventCallback<E>) => {
      callback(data);
    });
  }
}
