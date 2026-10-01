const MAX_DELTA_SECONDS = 0.1;

export type TickCallback = (delta: number, elapsed: number) => void;

export class GameLoop {
  private callbacks: TickCallback[] = [];
  private frameId = 0;
  private lastTimestamp = 0;
  private elapsed = 0;
  private running = false;

  onTick(callback: TickCallback): void {
    this.callbacks.push(callback);
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
    this.elapsed += delta;
    this.callbacks.forEach((callback) => callback(delta, this.elapsed));
    this.frameId = requestAnimationFrame(this.frame);
  };
}
