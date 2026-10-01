import type { GameEventBus, ProgressSnapshot } from './events';

const FIRST_TARGET = 5;
const FIRST_STEP = 7;
const STEP_GROWTH = 3;

export function xpTargetForLevel(level: number): number {
  const steps = level - 1;
  return FIRST_TARGET + FIRST_STEP * steps + (STEP_GROWTH * steps * (steps - 1)) / 2;
}

export class Progression {
  private level = 1;
  private xp = 0;
  private mugs = 0;

  constructor(private readonly events: GameEventBus) {}

  snapshot(): ProgressSnapshot {
    return { level: this.level, xp: this.xp, xpTarget: xpTargetForLevel(this.level), mugs: this.mugs };
  }

  collectMug(): void {
    this.mugs += 1;
    this.addXp(1);
  }

  addXp(amount: number): boolean {
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= xpTargetForLevel(this.level)) {
      this.xp -= xpTargetForLevel(this.level);
      this.level += 1;
      leveledUp = true;
    }
    this.events.emit('PROGRESS_CHANGED', this.snapshot());
    if (leveledUp) this.events.emit('LEVEL_UP', { level: this.level });
    return leveledUp;
  }
}
