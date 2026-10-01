import './lobbyView.css';
import { unlockAudio } from '../core/audio';
import type { ArmoryStore } from '../core/armoryState';
import type { GameEventBus } from '../core/events';
import { formatDuration, type HighScores } from '../core/highScores';
import type { MetaProgression } from '../core/metaProgression';
import type { SettingsStore } from '../core/settings';
import { t } from '../i18n';
import { bindLocalized } from './localized';
import { openSettingsModal } from './settingsModal';
import { openShopView } from './shopView';

const BANK_ICON = '🍺';
const SOUND_ON_ICON = '🔊';
const SOUND_OFF_ICON = '🔇';
const GEAR_ICON = '⚙';

export interface LobbyOptions {
  root: HTMLElement;
  events: GameEventBus;
  meta: MetaProgression;
  highScores: HighScores;
  settings: SettingsStore;
  armory: ArmoryStore;
  onEnterBrawl: () => void;
}

export interface LobbyHandle {
  show(): void;
  hide(): void;
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

export function mountLobby(options: LobbyOptions): LobbyHandle {
  const { root, events, meta, highScores, settings, armory, onEnterBrawl } = options;
  const overlay = createElement('div', 'lobby interactive');
  const title = createElement('h1', 'lobby__title');
  const tagline = createElement('p', 'lobby__tagline');
  const bank = createElement('div', 'lobby__bank');
  const bestTime = createElement('span', 'lobby__badge');
  const bestSmashed = createElement('span', 'lobby__badge');
  const records = createElement('div', 'lobby__records');
  records.append(bestTime, bestSmashed);

  const enterButton = createButton('lobby__button lobby__button--primary');
  const shopButton = createButton('lobby__button lobby__button--secondary');
  const muteButton = createButton('lobby__icon-button lobby__mute');
  const gearButton = createButton('lobby__icon-button lobby__gear', GEAR_ICON);

  function renderMute(): void {
    const muted = settings.snapshot().muted;
    muteButton.textContent = muted ? SOUND_OFF_ICON : SOUND_ON_ICON;
    muteButton.title = muted ? t('lobby.unmute') : t('lobby.mute');
    muteButton.setAttribute('aria-label', muteButton.title);
  }

  function renderRecords(): void {
    const best = highScores.snapshot();
    bank.textContent = `${BANK_ICON} ${meta.bank} ${t('lobby.bankLabel')}`;
    bestTime.textContent = `${t('lobby.bestTime')}: ${formatDuration(best.bestSeconds)}`;
    bestSmashed.textContent = `${t('lobby.bestSmashed')}: ${best.mostEnemies}`;
  }

  function renderTexts(): void {
    document.title = t('game.title');
    title.textContent = t('game.title');
    tagline.textContent = t('game.tagline');
    enterButton.textContent = t('lobby.enterBrawl');
    shopButton.textContent = t('lobby.shop');
    gearButton.title = t('lobby.settings');
    gearButton.setAttribute('aria-label', gearButton.title);
    renderMute();
    renderRecords();
  }

  function show(): void {
    renderRecords();
    root.append(overlay);
  }

  function hide(): void {
    overlay.remove();
  }

  enterButton.addEventListener('click', () => {
    void unlockAudio();
    hide();
    onEnterBrawl();
  });

  shopButton.addEventListener('click', () => {
    void unlockAudio();
    hide();
    openShopView({ root, events, meta, armory, onBack: show });
  });

  gearButton.addEventListener('click', () => {
    void unlockAudio();
    hide();
    openSettingsModal({ root, events, settings, onClose: show });
  });

  muteButton.addEventListener('click', () => {
    void unlockAudio();
    settings.toggleMuted();
  });

  overlay.append(gearButton, muteButton, title, tagline, bank, records, enterButton, shopButton);
  bindLocalized(events, renderTexts);
  events.on('SETTINGS_CHANGED', renderMute);
  return { show, hide };
}
