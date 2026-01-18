interface EventMap {
  [key: string]: any;
}

type EventCallback<E extends EventMap = {}> = (event: E[string]) => void;

export default class EventManager {
  private _listeners: Map<string, Set<EventCallback>> = new Map();

  on(type: string, callback: EventCallback): void {
    if (this.contains(type, callback)) {
      console.warn("");
    }
  }

  off(type: string, callback: EventCallback): void {}

  contains(type: string, callback: EventCallback): boolean {
    return this._listeners.get(type)!.has(callback);
  }
}
