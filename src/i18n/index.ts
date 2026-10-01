import { en, type TranslationKey } from './en';

const dictionaries = { en } as const;

type Locale = keyof typeof dictionaries;

let activeLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  activeLocale = locale;
}

export function t(key: TranslationKey): string {
  return dictionaries[activeLocale][key];
}

export type { TranslationKey };
