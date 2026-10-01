const MAX_DELTA_SECONDS = 0.1;

export type TickCallback = (delta: number, elapsed: number) => void;

export class GameLoop {
  private tickCallbacks: TickCallback[] = [];
  private frameCallbacks: TickCallback[] = [];
  private frameId = 0;
  private lastTimestamp = 0;
  private elapsed = 0;
  private running = false;
  private pauseCount = 0;
  private pauseListeners: Array<(paused: boolean) => void> = [];

  onTick(callback: TickCallback): void {
    this.tickCallbacks.push(callback);
  }

  onFrame(callback: TickCallback): void {
    this.frameCallbacks.push(callback);
  }

  get isPaused(): boolean {
    return this.pauseCount > 0;
  }

  onPauseChange(listener: (paused: boolean) => void): void {
    this.pauseListeners.push(listener);
  }

  pause(): void {
    const wasPaused = this.isPaused;
    this.pauseCount += 1;
    if (!wasPaused) this.pauseListeners.forEach((listener) => listener(true));
  }

  resume(): void {
    const wasPaused = this.isPaused;
    this.pauseCount = Math.max(0, this.pauseCount - 1);
    if (wasPaused && !this.isPaused) this.pauseListeners.forEach((listener) => listener(false));
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
    if (this.pauseCount === 0) {
      this.elapsed += delta;
      this.tickCallbacks.forEach((callback) => callback(delta, this.elapsed));
    }
    this.frameCallbacks.forEach((callback) => callback(delta, this.elapsed));
    this.frameId = requestAnimationFrame(this.frame);
  };
}
