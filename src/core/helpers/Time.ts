import EventRegistry from "./EventRegistry";

export interface TimeEvents {
  update: void;
}

export default class Time extends EventRegistry<TimeEvents> {
  private _startTime: number = 0;
  private _oldTime: number = 0;
  private _requestId: number = 0;
  private _running: boolean = false;

  public delta: number = 0;
  public elapsed: number = 0;

  constructor({ autostart }: { autostart: boolean } = { autostart: true }) {
    super();

    if (autostart) {
      this.start();
    }
  }

  isRunning(): boolean {
    return this._running;
  }

  private _loop() {
    let diff = 0;

    if (this._running) {
      const current = performance.now();

      diff = (current - this._oldTime) / 1000;
      this._oldTime = current;
      this.elapsed += diff;
    }

    this.delta = diff;

    this.emit("update");

    this._requestId = requestAnimationFrame(this._loop.bind(this));
  }

  public start() {
    if (this._running) return;
    this._startTime = performance.now();
    this._oldTime = this._startTime;
    this.elapsed = 0;
    this.delta = 0;

    this._running = true;

    this._loop();
  }

  public stop() {
    if (!this._running) return;
    this._running = false;

    cancelAnimationFrame(this._requestId);
    this._requestId = 0;
  }
}
