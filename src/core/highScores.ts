import type { RunSummary } from './runStats';
import { readJson, writeJson } from './storage';

const STORAGE_KEY = 'wobbly-knight.high-scores';

export interface BestRecords {
  bestSeconds: number;
  mostEnemies: number;
  lifetimeMugs: number;
}

export interface RecordResult {
  newBestTime: boolean;
  newMostEnemies: boolean;
}

const EMPTY_RECORDS: BestRecords = { bestSeconds: 0, mostEnemies: 0, lifetimeMugs: 0 };

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDuration(totalSeconds: number): string {
  const whole = Math.floor(Math.max(0, totalSeconds));
  return `${twoDigits(Math.floor(whole / 60))}:${twoDigits(whole % 60)}`;
}

export class HighScores {
  private records: BestRecords = { ...EMPTY_RECORDS, ...readJson<Partial<BestRecords>>(STORAGE_KEY, {}) };

  snapshot(): BestRecords {
    return { ...this.records };
  }

  recordRun(summary: RunSummary, creditedMugs: number): RecordResult {
    const result: RecordResult = {
      newBestTime: summary.survivalSeconds > this.records.bestSeconds,
      newMostEnemies: summary.enemiesSmashed > this.records.mostEnemies
    };
    this.records.bestSeconds = Math.max(this.records.bestSeconds, summary.survivalSeconds);
    this.records.mostEnemies = Math.max(this.records.mostEnemies, summary.enemiesSmashed);
    this.records.lifetimeMugs += Math.max(0, summary.mugsCollected - creditedMugs);
    this.persist();
    return result;
  }

  addLifetimeMugs(amount: number): void {
    this.records.lifetimeMugs += Math.max(0, amount);
    this.persist();
  }

  private persist(): void {
    writeJson(STORAGE_KEY, this.records);
  }
}
