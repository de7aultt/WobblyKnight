export const en = {
  'game.title': 'Wobbly Knight',
  'game.tagline': 'Swing the flail. Smash the goblins. Survive the tavern.',
  'ui.startBrawl': 'Start Brawl',
  'hud.health': 'Health',
  'hud.level': 'Level',
  'hud.ale': 'Ale',
  'hud.wave': 'Wave'
} as const;

export type TranslationKey = keyof typeof en;
