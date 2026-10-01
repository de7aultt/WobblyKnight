import type { HeroId } from '../core/armoryItems';

export type SkillKind = 'whirlwind' | 'stomp' | 'frenzy';

export const SKILL_BY_HERO: Readonly<Record<HeroId, SkillKind>> = {
  classic_knight: 'whirlwind',
  golden_paladin: 'stomp',
  drunk_barbarian: 'frenzy'
};

export const STOMP_HOP_SECONDS = 0.4;
export const STOMP_RADIUS = 5;
export const STOMP_STUN_SECONDS = 2;
export const FRENZY_SECONDS = 3.5;
export const FRENZY_SPEED_MULTIPLIER = 1.6;
export const FRENZY_KNOCKBACK_MULTIPLIER = 1.8;
export const FRENZY_GLOW_BASE = 0.3;
export const FRENZY_GLOW_PULSE = 0.15;

export function skillDurationSeconds(kind: SkillKind): number | undefined {
  if (kind === 'stomp') return STOMP_HOP_SECONDS;
  if (kind === 'frenzy') return FRENZY_SECONDS;
  return undefined;
}
