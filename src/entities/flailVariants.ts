import type { WeaponId } from '../core/armoryItems';
import { DEFAULT_FLAIL_SETTINGS, type FlailChainSettings } from '../physics/flailChain';

const VARIANT_OVERRIDES: Readonly<Record<WeaponId, Partial<FlailChainSettings>>> = {
  iron_morningstar: {},
  battle_cleaver: { ballRadius: 0.5, ballMass: 2.6 },
  golden_twin: { ballRadius: 0.34, ballMass: 1.3 }
};

export function chainSettingsFor(weapon: WeaponId): FlailChainSettings {
  return { ...DEFAULT_FLAIL_SETTINGS, ...VARIANT_OVERRIDES[weapon] };
}
