import type { HeroId } from '../core/armoryItems';
import { knightMaterials, type KnightRig } from './knightMesh';

interface HeroPalette {
  iron: number;
  darkIron: number;
  gold: number;
  tunic: number;
  leather: number;
  showHorns: boolean;
  showCrest: boolean;
}

const HERO_PALETTES: Readonly<Record<HeroId, HeroPalette>> = {
  classic_knight: {
    iron: 0xa3acb6,
    darkIron: 0x5a616b,
    gold: 0xe3b23c,
    tunic: 0xb3202a,
    leather: 0x3b2a1d,
    showHorns: false,
    showCrest: true
  },
  golden_paladin: {
    iron: 0xe2c36a,
    darkIron: 0xb08a2a,
    gold: 0xfff0b0,
    tunic: 0xf4f1e8,
    leather: 0x6b4a1d,
    showHorns: false,
    showCrest: true
  },
  drunk_barbarian: {
    iron: 0x8a5f3a,
    darkIron: 0x4a3524,
    gold: 0x8d8a82,
    tunic: 0x6b4a2b,
    leather: 0x2a1d12,
    showHorns: true,
    showCrest: false
  }
};

export function applyHeroVariant(rig: KnightRig, hero: HeroId): void {
  const palette = HERO_PALETTES[hero];
  knightMaterials.iron.color.setHex(palette.iron);
  knightMaterials.darkIron.color.setHex(palette.darkIron);
  knightMaterials.gold.color.setHex(palette.gold);
  knightMaterials.tunic.color.setHex(palette.tunic);
  knightMaterials.leather.color.setHex(palette.leather);
  rig.horns.visible = palette.showHorns;
  rig.crest.visible = palette.showCrest;
}
