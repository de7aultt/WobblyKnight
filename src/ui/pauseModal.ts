import './pauseModal.css';
import type { GameEventBus } from '../core/events';
import type { HighScores } from '../core/highScores';
import type { GameLoop } from '../core/loop';
import type { MetaProgression } from '../core/metaProgression';
import type { RunStats } from '../core/runStats';
import type { SettingsStore } from '../core/settings';
import { t, type TranslationKey } from '../i18n';
import { bindLocalized } from './localized';
import { openSettingsModal } from './settingsModal';

export interface PauseModalOptions {
  root: HTMLElement;
  events: GameEventBus;
  loop: GameLoop;
  runStats: RunStats;
  highScores: HighScores;
  meta: MetaProgression;
  settings: SettingsStore;
  isRunActive: () => boolean;
  onRetreat: () => void;
}

interface PauseButton {
  element: HTMLButtonElement;
  labelKey: TranslationKey;
}

function createButton(className: string, labelKey: TranslationKey, onClick: () => void): PauseButton {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = `pause-modal__button ${className}`.trim();
  element.addEventListener('click', onClick);
  return { element, labelKey };
}

export function mountPauseModal(options: PauseModalOptions): void {
  const { root, events, loop, runStats, highScores, meta, settings, isRunActive, onRetreat } = options;
  const overlay = document.createElement('div');
  overlay.className = 'pause-modal interactive';
  const title = document.createElement('h2');
  title.className = 'pause-modal__title';
  let isOpen = false;
  let settingsOpen = false;

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    settingsOpen = false;
    overlay.classList.remove('pause-modal--hidden');
    overlay.remove();
    loop.resume();
  }

  function retreat(): void {
    const summary = runStats.summary();
    meta.depositMugs(summary.mugsCollected - runStats.credited);
    highScores.recordRun(summary, runStats.credited);
    runStats.markCredited();
    close();
    onRetreat();
  }

  function openSettings(): void {
    settingsOpen = true;
    overlay.classList.add('pause-modal--hidden');
    openSettingsModal({
      root,
      events,
      settings,
      onClose: () => {
        settingsOpen = false;
        overlay.classList.remove('pause-modal--hidden');
      }
    });
  }

  function open(): void {
    isOpen = true;
    loop.pause();
    root.append(overlay);
  }

  const buttons = [
    createButton('pause-modal__button--primary', 'pause.resume', close),
    createButton('', 'pause.settings', openSettings),
    createButton('pause-modal__button--retreat', 'pause.retreat', retreat)
  ];
  overlay.append(title, ...buttons.map((button) => button.element));
  bindLocalized(events, () => {
    title.textContent = t('pause.title');
    buttons.forEach(({ element, labelKey }) => {
      element.textContent = t(labelKey);
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Escape' || event.repeat || settingsOpen) return;
    if (isOpen) close();
    else if (isRunActive() && !loop.isPaused) open();
  });
  events.on('RUN_RESET', close);
}
