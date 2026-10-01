import { itemsOf, type ArenaId, type ArmoryCategory, type HeroId, type WeaponId } from './armoryItems';
import type { GameEventBus } from './events';
import type { MetaProgression } from './metaProgression';
import { readJson, writeJson } from './storage';

const STORAGE_KEY = 'wobbly_knight_armory';
const CATEGORIES: readonly ArmoryCategory[] = ['hero', 'weapon', 'arena'];

export interface ArmoryLoadout {
  hero: HeroId;
  weapon: WeaponId;
  arena: ArenaId;
}

interface ArmoryData {
  unlocked: Record<ArmoryCategory, string[]>;
  equipped: Record<ArmoryCategory, string>;
}

function defaultIdOf(category: ArmoryCategory): string {
  return itemsOf(category)[0].id;
}

function sanitize(raw: Partial<ArmoryData>): ArmoryData {
  const data: ArmoryData = {
    unlocked: { hero: [], weapon: [], arena: [] },
    equipped: { hero: '', weapon: '', arena: '' }
  };
  CATEGORIES.forEach((category) => {
    const validIds = itemsOf(category).map((item) => item.id);
    const stored = raw.unlocked?.[category] ?? [];
    const unlocked = new Set([defaultIdOf(category), ...stored.filter((id) => validIds.includes(id))]);
    data.unlocked[category] = [...unlocked];
    const equipped = raw.equipped?.[category];
    data.equipped[category] = equipped && unlocked.has(equipped) ? equipped : defaultIdOf(category);
  });
  return data;
}

export class ArmoryStore {
  private data: ArmoryData = sanitize(readJson<Partial<ArmoryData>>(STORAGE_KEY, {}));

  constructor(
    private readonly meta: MetaProgression,
    private readonly events: GameEventBus
  ) {}

  loadout(): ArmoryLoadout {
    const { equipped } = this.data;
    return { hero: equipped.hero as HeroId, weapon: equipped.weapon as WeaponId, arena: equipped.arena as ArenaId };
  }

  announce(): void {
    this.events.emit('ARMORY_CHANGED', this.loadout());
  }

  isUnlocked(category: ArmoryCategory, id: string): boolean {
    return this.data.unlocked[category].includes(id);
  }

  isEquipped(category: ArmoryCategory, id: string): boolean {
    return this.data.equipped[category] === id;
  }

  canAfford(category: ArmoryCategory, id: string): boolean {
    const item = itemsOf(category).find((candidate) => candidate.id === id);
    return item !== undefined && this.meta.bank >= item.cost;
  }

  buy(category: ArmoryCategory, id: string): boolean {
    const item = itemsOf(category).find((candidate) => candidate.id === id);
    if (!item || this.isUnlocked(category, id) || !this.meta.spendMugs(item.cost)) return false;
    this.data.unlocked[category].push(id);
    this.persist();
    return true;
  }

  equip(category: ArmoryCategory, id: string): boolean {
    if (!this.isUnlocked(category, id) || this.isEquipped(category, id)) return false;
    this.data.equipped[category] = id;
    this.persist();
    this.announce();
    return true;
  }

  private persist(): void {
    writeJson(STORAGE_KEY, this.data);
  }
}
