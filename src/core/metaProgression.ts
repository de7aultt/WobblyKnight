import { BASE_DASH_COOLDOWN_SECONDS, BASE_MAX_HEARTS } from './baseStats';
import { META_UPGRADES, type MetaUpgradeId } from './metaUpgrades';
import { readJson, writeJson } from './storage';

const STORAGE_KEY = 'wobbly_knight_meta';
const DAMAGE_PER_RANK = 0.2;
const MAGNET_PER_RANK = 0.3;
const DASH_REDUCTION_PER_RANK = 0.8;

export interface EffectiveMetaStats {
  maxHearts: number;
  damageMultiplier: number;
  magnetRadiusMultiplier: number;
  dashCooldownSeconds: number;
}

interface MetaState {
  aleMugsBank: number;
  ranks: Record<MetaUpgradeId, number>;
}

function maxRankOf(id: MetaUpgradeId): number {
  return META_UPGRADES.find((upgrade) => upgrade.id === id)?.costs.length ?? 0;
}

function sanitize(raw: Partial<MetaState>): MetaState {
  const ranks = { max_hearts: 0, brawler_might: 0, magnetic_tankard: 0, quick_recovery: 0 };
  META_UPGRADES.forEach(({ id }) => {
    const stored = raw.ranks?.[id];
    ranks[id] = typeof stored === 'number' ? Math.min(Math.max(Math.floor(stored), 0), maxRankOf(id)) : 0;
  });
  const bank = typeof raw.aleMugsBank === 'number' ? Math.max(0, Math.floor(raw.aleMugsBank)) : 0;
  return { aleMugsBank: bank, ranks };
}

export class MetaProgression {
  private state: MetaState = sanitize(readJson<Partial<MetaState>>(STORAGE_KEY, {}));

  get bank(): number {
    return this.state.aleMugsBank;
  }

  rankOf(id: MetaUpgradeId): number {
    return this.state.ranks[id];
  }

  maxRankOf(id: MetaUpgradeId): number {
    return maxRankOf(id);
  }

  isMaxed(id: MetaUpgradeId): boolean {
    return this.rankOf(id) >= maxRankOf(id);
  }

  nextCost(id: MetaUpgradeId): number | null {
    if (this.isMaxed(id)) return null;
    return META_UPGRADES.find((upgrade) => upgrade.id === id)?.costs[this.rankOf(id)] ?? null;
  }

  canAfford(id: MetaUpgradeId): boolean {
    const cost = this.nextCost(id);
    return cost !== null && this.state.aleMugsBank >= cost;
  }

  buyUpgrade(id: MetaUpgradeId): boolean {
    const cost = this.nextCost(id);
    if (cost === null || !this.canAfford(id)) return false;
    this.state.aleMugsBank -= cost;
    this.state.ranks[id] += 1;
    this.persist();
    return true;
  }

  depositMugs(amount: number): void {
    if (amount <= 0) return;
    this.state.aleMugsBank += Math.floor(amount);
    this.persist();
  }

  getEffectiveStats(): EffectiveMetaStats {
    const ranks = this.state.ranks;
    return {
      maxHearts: BASE_MAX_HEARTS + ranks.max_hearts,
      damageMultiplier: 1 + DAMAGE_PER_RANK * ranks.brawler_might,
      magnetRadiusMultiplier: 1 + MAGNET_PER_RANK * ranks.magnetic_tankard,
      dashCooldownSeconds: Math.round((BASE_DASH_COOLDOWN_SECONDS - DASH_REDUCTION_PER_RANK * ranks.quick_recovery) * 10) / 10
    };
  }

  private persist(): void {
    writeJson(STORAGE_KEY, this.state);
  }
}
