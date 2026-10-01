import './lobbyView.css';
import { unlockAudio } from '../core/audio';
import { loadMuted, saveMuted } from '../core/audioSettings';
import type { GameEventBus } from '../core/events';
import { formatDuration, type HighScores } from '../core/highScores';
import type { MetaProgression } from '../core/metaProgression';
import { t } from '../i18n';
import { openShopView } from './shopView';

const BANK_ICON = '🍺';
const SOUND_ON_ICON = '🔊';
const SOUND_OFF_ICON = '🔇';

export interface LobbyOptions {
  root: HTMLElement;
  events: GameEventBus;
  meta: MetaProgression;
  highScores: HighScores;
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
  const { root, events, meta, highScores, onEnterBrawl } = options;
  const overlay = createElement('div', 'lobby interactive');
  const bank = createElement('div', 'lobby__bank');
  const bestTime = createElement('span', 'lobby__badge');
  const bestSmashed = createElement('span', 'lobby__badge');
  const records = createElement('div', 'lobby__records');
  records.append(bestTime, bestSmashed);

  const enterButton = createButton('lobby__button lobby__button--primary', t('lobby.enterBrawl'));
  const shopButton = createButton('lobby__button lobby__button--secondary', t('lobby.shop'));
  const muteButton = createButton('lobby__mute');
  let muted = loadMuted();

  function renderMute(): void {
    muteButton.textContent = muted ? SOUND_OFF_ICON : SOUND_ON_ICON;
    muteButton.title = muted ? t('lobby.unmute') : t('lobby.mute');
    muteButton.setAttribute('aria-label', muteButton.title);
  }

  function refresh(): void {
    const best = highScores.snapshot();
    bank.textContent = `${BANK_ICON} ${meta.bank} ${t('lobby.bankLabel')}`;
    bestTime.textContent = `${t('lobby.bestTime')}: ${formatDuration(best.bestSeconds)}`;
    bestSmashed.textContent = `${t('lobby.bestSmashed')}: ${best.mostEnemies}`;
  }

  function show(): void {
    refresh();
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
    openShopView({ root, events, meta, onBack: show });
  });

  muteButton.addEventListener('click', () => {
    void unlockAudio();
    muted = !muted;
    saveMuted(muted);
    events.emit('MUTE_CHANGED', { muted });
    renderMute();
  });

  overlay.append(
    muteButton,
    createElement('h1', 'lobby__title', t('game.title')),
    createElement('p', 'lobby__tagline', t('game.tagline')),
    bank,
    records,
    enterButton,
    shopButton
  );
  renderMute();
  events.emit('MUTE_CHANGED', { muted });
  return { show, hide };
}
