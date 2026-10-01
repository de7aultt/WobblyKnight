import type { ArenaId } from '../core/armoryItems';

export interface FloorColor {
  hue: number;
  saturation: number;
  lightness: number;
  variance: number;
}

export interface ArenaTheme {
  floorStyle: 'planks' | 'tiles';
  floorColor: FloorColor;
  roughness: number;
  hasRunner: boolean;
  wallColor: number;
  postColor: number;
  capColor: number;
  flameColor: number;
  torchColor: number;
  ambientColor: number;
}

export const ARENA_THEMES: Readonly<Record<ArenaId, ArenaTheme>> = {
  tavern_pit: {
    floorStyle: 'planks',
    floorColor: { hue: 0.07, saturation: 0.5, lightness: 0.27, variance: 0.05 },
    roughness: 0.85,
    hasRunner: false,
    wallColor: 0x6b6670,
    postColor: 0x4a2e1a,
    capColor: 0x3b3a40,
    flameColor: 0xffb347,
    torchColor: 0xff8a3d,
    ambientColor: 0x5a4a66
  },
  dungeon_crypt: {
    floorStyle: 'tiles',
    floorColor: { hue: 0.6, saturation: 0.12, lightness: 0.16, variance: 0.035 },
    roughness: 0.95,
    hasRunner: false,
    wallColor: 0x2c3340,
    postColor: 0x232a35,
    capColor: 0x15191f,
    flameColor: 0x7df3ff,
    torchColor: 0x4fe0ff,
    ambientColor: 0x24344a
  },
  royal_courtyard: {
    floorStyle: 'tiles',
    floorColor: { hue: 0.1, saturation: 0.06, lightness: 0.72, variance: 0.04 },
    roughness: 0.35,
    hasRunner: true,
    wallColor: 0xcfc6b8,
    postColor: 0xe8dfd0,
    capColor: 0xd9a82e,
    flameColor: 0xffe08a,
    torchColor: 0xffd36b,
    ambientColor: 0x6b5f52
  }
};
