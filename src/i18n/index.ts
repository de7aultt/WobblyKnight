import type { GameEventBus } from '../core/events';
import { readJson, writeJson } from '../core/storage';
import { en, type TranslationKey } from './en';
import { es } from './es';
import { pl } from './pl';
import { ru } from './ru';

export type Locale = 'en' | 'ru' | 'pl' | 'es';

export interface LocaleOption {
  id: Locale;
  flag: string;
  code: string;
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { id: 'en', flag: '🇬🇧', code: 'EN' },
  { id: 'ru', flag: '🇷🇺', code: 'RU' },
  { id: 'pl', flag: '🇵🇱', code: 'PL' },
  { id: 'es', flag: '🇪🇸', code: 'ES' }
];

const STORAGE_KEY = 'wobbly_knight_lang';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, ru, pl, es };

function isLocale(value: unknown): value is Locale {
  return LOCALE_OPTIONS.some((option) => option.id === value);
}

function detectLocale(): Locale {
  const stored = readJson<unknown>(STORAGE_KEY, null);
  if (isLocale(stored)) return stored;
  const browserLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language.slice(0, 2).toLowerCase();
  return isLocale(browserLanguage) ? browserLanguage : 'en';
}

let activeLocale: Locale = detectLocale();
let eventBus: GameEventBus | null = null;

export function bindLocaleEvents(events: GameEventBus): void {
  eventBus = events;
}

export function getLocale(): Locale {
  return activeLocale;
}

export function setLocale(locale: Locale): void {
  if (locale === activeLocale) return;
  activeLocale = locale;
  writeJson(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  eventBus?.emit('LOCALE_CHANGED', { locale });
}

export function t(key: TranslationKey): string {
  return dictionaries[activeLocale][key];
}

export type { TranslationKey };
