import type { BossTier } from '../core/bossTier';
import type { TranslationKey } from '../i18n/en';

export interface BossText {
  name: TranslationKey;
  title: TranslationKey;
  incoming: TranslationKey;
  defeated: TranslationKey;
}

export const BOSS_TEXT: Record<BossTier, BossText> = {
  butcher: {
    name: 'boss.butcher.name',
    title: 'boss.butcher.title',
    incoming: 'boss.butcher.incoming',
    defeated: 'boss.butcher.defeated'
  },
  goblinKing: {
    name: 'boss.goblinKing.name',
    title: 'boss.goblinKing.title',
    incoming: 'boss.goblinKing.incoming',
    defeated: 'boss.goblinKing.defeated'
  },
  executioner: {
    name: 'boss.executioner.name',
    title: 'boss.executioner.title',
    incoming: 'boss.executioner.incoming',
    defeated: 'boss.executioner.defeated'
  }
};
