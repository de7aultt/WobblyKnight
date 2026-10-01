import './settingsModal.css';
import type { GameEventBus } from '../core/events';
import type { GraphicsQuality, SettingsStore } from '../core/settings';
import { LOCALE_OPTIONS, getLocale, setLocale, t } from '../i18n';

const QUALITY_OPTIONS: ReadonlyArray<{ id: GraphicsQuality; labelKey: 'settings.qualityHigh' | 'settings.qualityLow' }> = [
  { id: 'high', labelKey: 'settings.qualityHigh' },
  { id: 'low', labelKey: 'settings.qualityLow' }
];

export interface SettingsModalOptions {
  root: HTMLElement;
  events: GameEventBus;
  settings: SettingsStore;
  onClose: () => void;
}

function createElement(tag: keyof HTMLElementTagNameMap, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createButton(className: string, text = ''): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  return button;
}

export function openSettingsModal(options: SettingsModalOptions): void {
  const { root, events, settings, onClose } = options;
  const overlay = createElement('div', 'settings interactive');
  const title = createElement('h2', 'settings__title');
  const audioTitle = createElement('h3', 'settings__section-title');
  const graphicsTitle = createElement('h3', 'settings__section-title');
  const languageTitle = createElement('h3', 'settings__section-title');
  const volumeLabel = createElement('span', 'settings__label');
  const volumeValue = createElement('span', 'settings__value');
  const muteLabel = createElement('span', 'settings__label');
  const qualityLabel = createElement('span', 'settings__label');
  const hint = createElement('p', 'settings__hint');
  const closeButton = createButton('settings__close');

  const volumeInput = document.createElement('input');
  volumeInput.type = 'range';
  volumeInput.min = '0';
  volumeInput.max = '100';
  volumeInput.step = '1';
  volumeInput.className = 'settings__slider';
  volumeInput.addEventListener('input', () => settings.setMasterVolume(Number(volumeInput.value) / 100));

  const muteInput = document.createElement('input');
  muteInput.type = 'checkbox';
  muteInput.className = 'settings__checkbox';
  muteInput.addEventListener('change', () => settings.setMuted(muteInput.checked));

  const qualityButtons = QUALITY_OPTIONS.map((option) => {
    const button = createButton('settings__choice');
    button.addEventListener('click', () => settings.setQuality(option.id));
    return { option, button };
  });
  const languageButtons = LOCALE_OPTIONS.map((option) => {
    const button = createButton('settings__choice', `${option.flag} ${option.code}`);
    button.addEventListener('click', () => setLocale(option.id));
    return { option, button };
  });

  function createRow(...children: HTMLElement[]): HTMLElement {
    const row = createElement('div', 'settings__row');
    row.append(...children);
    return row;
  }

  function createSection(sectionTitle: HTMLElement, ...rows: HTMLElement[]): HTMLElement {
    const section = createElement('section', 'settings__section');
    section.append(sectionTitle, ...rows);
    return section;
  }

  function applyTexts(): void {
    title.textContent = t('settings.title');
    audioTitle.textContent = t('settings.audio');
    graphicsTitle.textContent = t('settings.graphics');
    languageTitle.textContent = t('settings.language');
    volumeLabel.textContent = t('settings.volume');
    muteLabel.textContent = t('settings.mute');
    qualityLabel.textContent = t('settings.quality');
    hint.textContent = t('settings.qualityHint');
    closeButton.textContent = t('settings.close');
    qualityButtons.forEach(({ option, button }) => {
      button.textContent = t(option.labelKey);
    });
  }

  function syncValues(): void {
    const current = settings.snapshot();
    const percent = Math.round(current.masterVolume * 100);
    if (Number(volumeInput.value) !== percent) volumeInput.value = String(percent);
    volumeValue.textContent = `${percent}%`;
    muteInput.checked = current.muted;
    qualityButtons.forEach(({ option, button }) => {
      button.classList.toggle('settings__choice--active', option.id === current.quality);
    });
    languageButtons.forEach(({ option, button }) => {
      button.classList.toggle('settings__choice--active', option.id === getLocale());
    });
  }

  const muteWrapper = createElement('label', 'settings__toggle');
  muteWrapper.append(muteInput, muteLabel);

  const choiceRow = (buttons: Array<{ button: HTMLButtonElement }>): HTMLElement => {
    const row = createElement('div', 'settings__choices');
    row.append(...buttons.map(({ button }) => button));
    return row;
  };

  overlay.append(
    title,
    createSection(
      audioTitle,
      createRow(volumeLabel, volumeInput, volumeValue),
      createRow(muteWrapper)
    ),
    createSection(graphicsTitle, createRow(qualityLabel, choiceRow(qualityButtons)), hint),
    createSection(languageTitle, choiceRow(languageButtons)),
    closeButton
  );

  const stopLocale = events.on('LOCALE_CHANGED', () => {
    applyTexts();
    syncValues();
  });
  const stopSettings = events.on('SETTINGS_CHANGED', syncValues);
  closeButton.addEventListener('click', () => {
    stopLocale();
    stopSettings();
    overlay.remove();
    onClose();
  });

  applyTexts();
  syncValues();
  root.append(overlay);
}
