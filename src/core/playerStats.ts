import { BASE_DASH_COOLDOWN_SECONDS } from './baseStats';
import type { WeaponEffects } from './armoryItems';
import type { EffectiveMetaStats } from './metaProgression';
import { MomentumTracker } from './momentum';
import type { PerkId } from './perks';

const CHAIN_REACH_PER_LEVEL = 0.4;
const MAX_CHAIN_REACH_LEVEL = 3;
const IMPACT_PER_LEVEL = 0.5;
const MAX_BOOTS_LEVEL = 2;
const MAX_ARMOR_LEVEL = 3;
const WINDUP_PER_ARMOR_LEVEL = 0.3;
const MAX_LIGHTNING_LEVEL = 2;
const MAX_VAMPIRIC_LEVEL = 3;
const VAMPIRIC_CHANCE_PER_LEVEL = 0.06;

export class PlayerStats {
  chainReachLevel = 0;
  spikeLevel = 0;
  bootsLevel = 0;
  magnetLevel = 0;
  hasDoubleFlail = false;
  armorLevel = 0;
  lightningLevel = 0;
  vampiricLevel = 0;
  momentumLevel = 0;
  trailLevel = 0;
  readonly momentum = new MomentumTracker();
  weaponImpactMultiplier = 1;
  weaponReach = 1;
  weaponDual = false;
  knockbackBuff = 1;
  metaDamageMultiplier = 1;
  metaMagnetRadiusMultiplier = 1;
  dashCooldownSeconds = BASE_DASH_COOLDOWN_SECONDS;

  get chainReach(): number {
    return (1 + this.chainReachLevel * CHAIN_REACH_PER_LEVEL) * this.weaponReach;
  }

  get impactMultiplier(): number {
    return (1 + this.spikeLevel * IMPACT_PER_LEVEL) * this.metaDamageMultiplier * this.weaponImpactMultiplier;
  }

  get contactWindupMultiplier(): number {
    return 1 + this.armorLevel * WINDUP_PER_ARMOR_LEVEL;
  }

  get lightningTargets(): number {
    return this.lightningLevel;
  }

  get vampiricChance(): number {
    return this.vampiricLevel * VAMPIRIC_CHANCE_PER_LEVEL;
  }

  get spinMultiplier(): number {
    return this.momentumLevel > 0 ? this.momentum.multiplier : 1;
  }

  get magnetMultiplier(): number {
    return 1 + this.magnetLevel;
  }

  get magnetRadiusMultiplier(): number {
    return this.magnetMultiplier * this.metaMagnetRadiusMultiplier;
  }

  applyWeapon(effects: WeaponEffects): void {
    this.weaponImpactMultiplier = effects.impactMultiplier;
    this.weaponReach = effects.reachMultiplier;
    this.weaponDual = effects.dual;
  }

  applyMeta(meta: EffectiveMetaStats): void {
    this.metaDamageMultiplier = meta.damageMultiplier;
    this.metaMagnetRadiusMultiplier = meta.magnetRadiusMultiplier;
    this.dashCooldownSeconds = meta.dashCooldownSeconds;
  }

  levelOf(id: PerkId): number {
    if (id === 'longer_chain') return this.chainReachLevel;
    if (id === 'heavy_spikes') return this.spikeLevel;
    if (id === 'double_morningstar') return this.hasDoubleFlail ? 1 : 0;
    if (id === 'iron_armor') return this.armorLevel;
    if (id === 'spike_boots') return this.bootsLevel;
    if (id === 'ale_magnet') return this.magnetLevel;
    if (id === 'chain_lightning') return this.lightningLevel;
    if (id === 'vampiric_ale') return this.vampiricLevel;
    if (id === 'momentum_cleave') return this.momentumLevel;
    return this.trailLevel;
  }

  reset(): void {
    this.chainReachLevel = 0;
    this.spikeLevel = 0;
    this.bootsLevel = 0;
    this.magnetLevel = 0;
    this.hasDoubleFlail = false;
    this.armorLevel = 0;
    this.lightningLevel = 0;
    this.vampiricLevel = 0;
    this.momentumLevel = 0;
    this.trailLevel = 0;
    this.momentum.reset();
    this.knockbackBuff = 1;
  }

  isPerkAvailable(id: PerkId): boolean {
    if (id === 'longer_chain') return this.chainReachLevel < MAX_CHAIN_REACH_LEVEL;
    if (id === 'double_morningstar') return !this.hasDoubleFlail && !this.weaponDual;
    if (id === 'iron_armor') return this.armorLevel < MAX_ARMOR_LEVEL;
    if (id === 'spike_boots') return this.bootsLevel < MAX_BOOTS_LEVEL;
    if (id === 'chain_lightning') return this.lightningLevel < MAX_LIGHTNING_LEVEL;
    if (id === 'vampiric_ale') return this.vampiricLevel < MAX_VAMPIRIC_LEVEL;
    if (id === 'momentum_cleave') return this.momentumLevel === 0;
    if (id === 'spiked_trail') return this.trailLevel === 0;
    return true;
  }

  apply(id: PerkId): void {
    if (id === 'longer_chain') this.chainReachLevel += 1;
    else if (id === 'heavy_spikes') this.spikeLevel += 1;
    else if (id === 'double_morningstar') this.hasDoubleFlail = true;
    else if (id === 'iron_armor') this.armorLevel += 1;
    else if (id === 'spike_boots') this.bootsLevel += 1;
    else if (id === 'ale_magnet') this.magnetLevel += 1;
    else if (id === 'chain_lightning') this.lightningLevel += 1;
    else if (id === 'vampiric_ale') this.vampiricLevel += 1;
    else if (id === 'momentum_cleave') this.momentumLevel += 1;
    else this.trailLevel += 1;
  }
}
