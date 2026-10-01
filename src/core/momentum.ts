const BONUS_PER_STACK = 0.04;
const MAX_STACKS = 6;
const CHAIN_WINDOW_SECONDS = 1.6;

export class MomentumTracker {
  private stacks = 0;
  private remainingSeconds = 0;

  get multiplier(): number {
    return 1 + this.stacks * BONUS_PER_STACK;
  }

  registerHit(): void {
    this.stacks = Math.min(this.stacks + 1, MAX_STACKS);
    this.remainingSeconds = CHAIN_WINDOW_SECONDS;
  }

  update(deltaSeconds: number): void {
    if (this.stacks === 0) return;
    this.remainingSeconds -= deltaSeconds;
    if (this.remainingSeconds <= 0) this.reset();
  }

  reset(): void {
    this.stacks = 0;
    this.remainingSeconds = 0;
  }
}
