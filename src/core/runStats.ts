export interface RunSummary {
  survivalSeconds: number;
  enemiesSmashed: number;
  mugsCollected: number;
}

export class RunStats {
  private survivalSeconds = 0;
  private enemiesSmashed = 0;
  private mugsCollected = 0;
  private creditedMugs = 0;
  private running = false;

  get credited(): number {
    return this.creditedMugs;
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  tick(deltaSeconds: number): void {
    if (this.running) this.survivalSeconds += deltaSeconds;
  }

  addEnemy(): void {
    this.enemiesSmashed += 1;
  }

  addMug(): void {
    this.mugsCollected += 1;
  }

  markCredited(): void {
    this.creditedMugs = this.mugsCollected;
  }

  doubleMugs(): number {
    const bonus = this.mugsCollected;
    this.mugsCollected += bonus;
    this.creditedMugs += bonus;
    return bonus;
  }

  summary(): RunSummary {
    return {
      survivalSeconds: this.survivalSeconds,
      enemiesSmashed: this.enemiesSmashed,
      mugsCollected: this.mugsCollected
    };
  }

  reset(): void {
    this.survivalSeconds = 0;
    this.enemiesSmashed = 0;
    this.mugsCollected = 0;
    this.creditedMugs = 0;
    this.running = false;
  }
}
