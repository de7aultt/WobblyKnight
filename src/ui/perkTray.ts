import type { GameEventBus } from '../core/events';
import { PERKS, type PerkDefinition, type PerkId } from '../core/perks';
import { t } from '../i18n';

const ROMAN_NUMERALS: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I']
];

export function toRoman(value: number): string {
  let remaining = value;
  let result = '';
  for (const [amount, symbol] of ROMAN_NUMERALS) {
    while (remaining >= amount) {
      result += symbol;
      remaining -= amount;
    }
  }
  return result;
}

interface PerkSlot {
  element: HTMLElement;
  badge: HTMLElement;
}

function replayPop(element: HTMLElement): void {
  element.classList.remove('perk-slot--pop');
  void element.offsetWidth;
  element.classList.add('perk-slot--pop');
}

function createSlot(perk: PerkDefinition): PerkSlot {
  const element = document.createElement('div');
  element.className = `perk-slot perk-slot--${perk.tag}`;
  element.title = `${t(perk.titleKey)} - ${t(perk.descKey)}`;

  const icon = document.createElement('span');
  icon.className = 'perk-slot__icon';
  icon.textContent = perk.icon;

  const badge = document.createElement('span');
  badge.className = 'perk-slot__badge';

  element.append(icon, badge);
  return { element, badge };
}

export function mountPerkTray(root: HTMLElement, events: GameEventBus): void {
  const tray = document.createElement('div');
  tray.className = 'perk-tray';
  root.append(tray);

  const slots = new Map<PerkId, PerkSlot>();

  events.on('PERK_ACQUIRED', ({ perkId, level }) => {
    let slot = slots.get(perkId);
    if (!slot) {
      const definition = PERKS.find((perk) => perk.id === perkId);
      if (!definition) return;
      slot = createSlot(definition);
      slots.set(perkId, slot);
      tray.append(slot.element);
    }
    slot.badge.textContent = toRoman(level);
    replayPop(slot.element);
  });
}
