import type { GameEventBus } from './events';

export const MAX_HEALTH = 4;

const INVULNERABLE_SECONDS = 1;
const REVIVE_INVULNERABLE_SECONDS = 2;

export class Health {
  readonly max = MAX_HEALTH;
  private current = MAX_HEALTH;
  private invulnerableRemaining = 0;
  private knockedOut = false;

  constructor(private readonly events: GameEventBus) {}

  get value(): number {
    return this.current;
  }

  get isInvulnerable(): boolean {
    return this.invulnerableRemaining > 0;
  }

  get isKnockedOut(): boolean {
    return this.knockedOut;
  }

  get isProtected(): boolean {
    return this.knockedOut || this.invulnerableRemaining > 0;
  }

  update(deltaSeconds: number): void {
    this.invulnerableRemaining = Math.max(0, this.invulnerableRemaining - deltaSeconds);
  }

  takeDamage(amount: number): boolean {
    if (this.isProtected || amount <= 0) return false;
    this.current = Math.max(0, this.current - amount);
    this.invulnerableRemaining = INVULNERABLE_SECONDS;
    this.events.emit('HEALTH_CHANGED', { current: this.current, max: this.max, damaged: true });
    if (this.current === 0) {
      this.knockedOut = true;
      this.events.emit('KNOCKED_OUT');
    }
    return true;
  }

  healFull(): void {
    this.current = this.max;
    this.knockedOut = false;
    this.invulnerableRemaining = REVIVE_INVULNERABLE_SECONDS;
    this.events.emit('HEALTH_CHANGED', { current: this.current, max: this.max, damaged: false });
  }

  reset(): void {
    this.current = this.max;
    this.knockedOut = false;
    this.invulnerableRemaining = 0;
    this.events.emit('HEALTH_CHANGED', { current: this.current, max: this.max, damaged: false });
  }
}
