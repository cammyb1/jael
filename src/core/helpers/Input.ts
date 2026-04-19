import EventRegistry from "./EventRegistry";

export interface InputConfig {
  mandatory: boolean;
  states: {
    down: boolean;
    up: boolean;
    pressed: boolean;
  };
  values: Record<string, boolean>;
}

export const KeyDirection = Object.freeze({
  UP: 1,
  DOWN: 2,
});

export type Duplet = { x: number; y: number };
export type ConnectAble = Element | Window | Document;

export interface PointerEvents {
  down: PointerEvent;
  middle: MouseEvent;
  up: PointerEvent;
}

export interface InputEvents {
  down: { code: string; repeated: boolean };
  up: { code: string; repeated: boolean };
}

export class Pointer extends EventRegistry<PointerEvents> {
  readonly position: Duplet = { x: 0, y: 0 };
  private _connected: boolean = false;
  private dom: ConnectAble = window;

  constructor() {
    super();
    this.position = { x: 0, y: 0 };
  }

  private _onMove(e: Event) {
    const { clientX, clientY } = e as PointerEvent;

    if (this.dom instanceof Window) {
      this.position.x = (clientX / window.innerWidth) * 2 - 1;
      this.position.y = -(clientY / window.innerHeight) * 2 + 1;
    } else {
      const _dom = this.dom instanceof Document ? this.dom.body : this.dom;
      const rect = _dom.getBoundingClientRect();
      this.position.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.position.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }
  }

  private _onDown(e: Event) {
    this.emit("down", e as PointerEvent);
  }

  private _onUp(e: Event) {
    this.emit("up", e as PointerEvent);
  }

  connect(el: ConnectAble | undefined) {
    if (this.dom && this._connected) {
      this.disconnect();
    }

    this.dom = el ?? this.dom;
    this._connected = true;
    this.dom.addEventListener("pointermove", this._onMove.bind(this));
    this.dom.addEventListener("pointerdown", this._onDown.bind(this));
    this.dom.addEventListener("pointerup", this._onUp.bind(this));
  }

  disconnect() {
    this._connected = false;
    this.dom.removeEventListener("pointermove", this._onMove.bind(this));
    this.dom.removeEventListener("pointerdown", this._onDown.bind(this));
    this.dom.removeEventListener("pointerup", this._onUp.bind(this));
    this.dom = window;
  }
}

export class Keyboard extends EventRegistry<InputEvents> {
  keys: Map<string, InputConfig>;
  private dom: ConnectAble = window;
  private _connected: Boolean = false;
  constructor() {
    super();
    this.keys = new Map();
  }

  private _keyDown(evt: Event) {
    this._checkKeys(<KeyboardEvent>evt, KeyDirection.DOWN);
  }

  private _keyUp(evt: Event) {
    this._checkKeys(<KeyboardEvent>evt, KeyDirection.UP);
  }

  private _onBlur() {
    if (!document.hasFocus() || document.hidden) {
      this.clearSet();
    }
  }

  connect(dom: ConnectAble) {
    if (this.dom && this._connected) {
      this.disconnect();
    }

    this._connected = true;
    this.dom = dom;
    this.dom.addEventListener("keydown", this._keyDown.bind(this));
    this.dom.addEventListener("keyup", this._keyUp.bind(this));
    window.addEventListener("visibilitychanged", this._onBlur.bind(this));
    window.addEventListener("blur", this._onBlur.bind(this));
  }

  disconnect() {
    if (!this._connected) return;
    this._connected = false;
    this.dom.removeEventListener("keydown", this._keyDown.bind(this));
    this.dom.removeEventListener("keyup", this._keyUp.bind(this));
    window.removeEventListener("visibilitychanged", this._onBlur.bind(this));
    window.removeEventListener("blur", this._onBlur.bind(this));
    this.dom = window;
  }

  registerMultiple(keyMap: {
    [k: string]: { keys: string[]; config?: Partial<InputConfig> };
  }) {
    for (let keyname in keyMap) {
      this.register(keyname, keyMap[keyname].keys, keyMap[keyname].config);
    }
  }

  register(name: string, keys: string[], config?: Partial<InputConfig>) {
    // add or override
    this.keys.set(name, {
      values: keys.reduce<Record<string, boolean>>((acc, k: string) => {
        acc[k.trim()] = false;
        return acc;
      }, {}),
      states: {
        down: false,
        up: false,
        pressed: false,
      },
      mandatory: config?.mandatory || false,
    });
  }

  unregister(name: string) {
    if (!this.keys.has(name)) return;
    this.keys.delete(name);
  }

  clearSet() {
    this.keys.forEach((set: InputConfig) => {
      Object.keys(set.values).forEach((key: string) => {
        set.values[key] = false;
      });
    });
  }

  private _configPressed(config: InputConfig): boolean {
    return config.mandatory
      ? Object.keys(config.values).every((k) => config.values[k])
      : Object.keys(config.values).some((k) => config.values[k]);
  }

  isDown(name: string): boolean {
    if (!this.keys.has(name)) return false;

    const config = this.keys.get(name)!;
    return config.states.down;
  }

  isUp(name: string): boolean {
    if (!this.keys.has(name)) return false;

    const config = this.keys.get(name)!;
    return config.states.up;
  }

  isPressed(name: string): boolean {
    if (!this.keys.has(name)) return false;
    const config = this.keys.get(name)!;
    return config.states.pressed;
  }

  private _checkKeys(
    keyEvent: KeyboardEvent,
    direction: (typeof KeyDirection)[keyof typeof KeyDirection],
  ) {
    if (!this._connected) return;
    if (direction === KeyDirection.UP) {
      this.emit("up", { code: keyEvent.code, repeated: keyEvent.repeat });
    } else if (direction === KeyDirection.DOWN) {
      this.emit("down", { code: keyEvent.code, repeated: keyEvent.repeat });
    }

    this.keys.forEach((keyConfig: InputConfig) => {
      const keyCode = keyEvent.code;
      const values = keyConfig.values;

      const existInConfig = values[keyCode] !== undefined;
      let pressed = this._configPressed(keyConfig);

      if (
        direction === KeyDirection.UP &&
        !keyEvent.repeat &&
        pressed &&
        existInConfig
      ) {
        keyConfig.states.up = true;
        // Disable it on next frame
        let id = requestAnimationFrame(() => {
          keyConfig.states.up = false;
          cancelAnimationFrame(id);
        });
      }

      if (existInConfig) {
        values[keyCode] = direction === KeyDirection.DOWN;
      }

      pressed = this._configPressed(keyConfig);

      if (
        direction === KeyDirection.DOWN &&
        !keyEvent.repeat &&
        pressed &&
        existInConfig
      ) {
        keyConfig.states.down = true;
        // Disable it on next frame
        let id = requestAnimationFrame(() => {
          keyConfig.states.down = false;
          cancelAnimationFrame(id);
        });
      }

      keyConfig.states.pressed = pressed;
    });
  }
}

export abstract class Input {
  static pointer: Pointer = new Pointer();
  static keyboard: Keyboard = new Keyboard();

  static connect(dom: ConnectAble = window) {
    this.keyboard.connect(dom);
    this.pointer.connect(dom);
  }

  static disconnect() {
    this.keyboard.disconnect();
    this.pointer.disconnect();
  }
}
