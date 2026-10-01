import type { PerkId } from './perks';

const CHAIN_REACH_PER_LEVEL = 0.4;
const MAX_CHAIN_REACH_LEVEL = 3;
const IMPACT_PER_LEVEL = 0.5;
const MAX_BOOTS_LEVEL = 2;

export class PlayerStats {
  chainReachLevel = 0;
  spikeLevel = 0;
  bootsLevel = 0;
  magnetLevel = 0;
  hasDoubleFlail = false;
  hasDash = false;

  get chainReach(): number {
    return 1 + this.chainReachLevel * CHAIN_REACH_PER_LEVEL;
  }

  get impactMultiplier(): number {
    return 1 + this.spikeLevel * IMPACT_PER_LEVEL;
  }

  get magnetMultiplier(): number {
    return 1 + this.magnetLevel;
  }

  isPerkAvailable(id: PerkId): boolean {
    if (id === 'longer_chain') return this.chainReachLevel < MAX_CHAIN_REACH_LEVEL;
    if (id === 'double_morningstar') return !this.hasDoubleFlail;
    if (id === 'drunken_dash') return !this.hasDash;
    if (id === 'spike_boots') return this.bootsLevel < MAX_BOOTS_LEVEL;
    return true;
  }

  apply(id: PerkId): void {
    if (id === 'longer_chain') this.chainReachLevel += 1;
    else if (id === 'heavy_spikes') this.spikeLevel += 1;
    else if (id === 'double_morningstar') this.hasDoubleFlail = true;
    else if (id === 'drunken_dash') this.hasDash = true;
    else if (id === 'spike_boots') this.bootsLevel += 1;
    else this.magnetLevel += 1;
  }
}
