import { BASE_MAX_HEARTS } from './baseStats';
import type { GameEventBus } from './events';

const INVULNERABLE_SECONDS = 1;
const REVIVE_INVULNERABLE_SECONDS = 2;

export class Health {
  private maxHealth = BASE_MAX_HEARTS;
  private current = BASE_MAX_HEARTS;
  private invulnerableRemaining = 0;
  private knockedOut = false;

  constructor(private readonly events: GameEventBus) {}

  get max(): number {
    return this.maxHealth;
  }

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

  setMax(maxHealth: number): void {
    this.maxHealth = Math.max(1, Math.floor(maxHealth));
    this.reset();
  }

  takeDamage(amount: number): boolean {
    if (this.isProtected || amount <= 0) return false;
    this.current = Math.max(0, this.current - amount);
    this.invulnerableRemaining = INVULNERABLE_SECONDS;
    this.emitChange(true);
    if (this.current === 0) {
      this.knockedOut = true;
      this.events.emit('KNOCKED_OUT');
    }
    return true;
  }

  healFull(): void {
    this.current = this.maxHealth;
    this.knockedOut = false;
    this.invulnerableRemaining = REVIVE_INVULNERABLE_SECONDS;
    this.emitChange(false);
  }

  reset(): void {
    this.current = this.maxHealth;
    this.knockedOut = false;
    this.invulnerableRemaining = 0;
    this.emitChange(false);
  }

  private emitChange(damaged: boolean): void {
    this.events.emit('HEALTH_CHANGED', { current: this.current, max: this.maxHealth, damaged });
  }
}
