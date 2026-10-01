const MAX_DELTA_SECONDS = 0.1;

export type TickCallback = (delta: number, elapsed: number) => void;

export class GameLoop {
  private tickCallbacks: TickCallback[] = [];
  private frameCallbacks: TickCallback[] = [];
  private frameId = 0;
  private lastTimestamp = 0;
  private elapsed = 0;
  private running = false;
  private paused = false;

  onTick(callback: TickCallback): void {
    this.tickCallbacks.push(callback);
  }

  onFrame(callback: TickCallback): void {
    this.frameCallbacks.push(callback);
  }

  get isPaused(): boolean {
    return this.paused;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.frameId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private frame = (timestamp: number): void => {
    if (!this.running) return;
    const rawDelta = (timestamp - this.lastTimestamp) / 1000;
    const delta = Math.min(Math.max(rawDelta, 0), MAX_DELTA_SECONDS);
    this.lastTimestamp = timestamp;
    if (!this.paused) {
      this.elapsed += delta;
      this.tickCallbacks.forEach((callback) => callback(delta, this.elapsed));
    }
    this.frameCallbacks.forEach((callback) => callback(delta, this.elapsed));
    this.frameId = requestAnimationFrame(this.frame);
  };
}
