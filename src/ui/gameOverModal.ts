import './gameOverModal.css';
import { formatDuration, type BestRecords, type RecordResult } from '../core/highScores';
import type { RunSummary } from '../core/runStats';
import { t } from '../i18n';

export interface GameOverView {
  summary: RunSummary;
  best: BestRecords;
  record: RecordResult;
  canRevive: boolean;
  canDoubleAle: boolean;
}

export interface DoubleAleResult {
  summary: RunSummary;
  best: BestRecords;
}

export interface GameOverActions {
  revive(): Promise<boolean>;
  doubleAle(): Promise<DoubleAleResult | null>;
  restart(): Promise<void>;
}

function createElement(tag: keyof HTMLElementTagNameMap, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createRow(label: string, badgeText?: string): { row: HTMLElement; value: HTMLElement } {
  const row = createElement('div', 'game-over__row');
  const value = createElement('span', 'game-over__value');
  row.append(createElement('span', 'game-over__label', label), value);
  if (badgeText) row.append(createElement('span', 'game-over__badge', badgeText));
  return { row, value };
}

function createAdButton(label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'game-over__button game-over__button--ad';
  button.append(createElement('span', 'game-over__ad-tag', t('gameOver.watchAd')), createElement('span', '', label));
  return button;
}

export function openGameOverModal(root: HTMLElement, view: GameOverView, actions: GameOverActions): () => void {
  const overlay = createElement('div', 'game-over interactive');
  const survival = createRow(t('gameOver.survival'));
  const smashed = createRow(t('gameOver.smashed'));
  const mugs = createRow(t('gameOver.mugs'));
  const bestTime = createRow(t('gameOver.bestTime'), view.record.newBestTime ? t('gameOver.newRecord') : undefined);
  const mostSmashed = createRow(t('gameOver.mostSmashed'), view.record.newMostEnemies ? t('gameOver.newRecord') : undefined);
  const lifetime = createRow(t('gameOver.lifetimeMugs'));

  function renderValues(summary: RunSummary, best: BestRecords): void {
    survival.value.textContent = formatDuration(summary.survivalSeconds);
    smashed.value.textContent = String(summary.enemiesSmashed);
    mugs.value.textContent = String(summary.mugsCollected);
    bestTime.value.textContent = formatDuration(best.bestSeconds);
    mostSmashed.value.textContent = String(best.mostEnemies);
    lifetime.value.textContent = String(best.lifetimeMugs);
  }

  const runPanel = createElement('section', 'game-over__panel');
  runPanel.append(createElement('h3', 'game-over__title', t('gameOver.runTitle')), survival.row, smashed.row, mugs.row);
  const bestPanel = createElement('section', 'game-over__panel');
  bestPanel.append(createElement('h3', 'game-over__title', t('gameOver.bestTitle')), bestTime.row, mostSmashed.row, lifetime.row);

  const reviveButton = createAdButton(t('gameOver.revive'));
  const doubleButton = createAdButton(t('gameOver.doubleAle'));
  const restartButton = document.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'game-over__button game-over__button--primary';
  restartButton.textContent = t('gameOver.restart');

  let reviveAvailable = view.canRevive;
  let doubleAvailable = view.canDoubleAle;

  function refreshButtons(busy: boolean): void {
    reviveButton.disabled = busy || !reviveAvailable;
    doubleButton.disabled = busy || !doubleAvailable;
    restartButton.disabled = busy;
    reviveButton.classList.toggle('game-over__button--used', !reviveAvailable);
    doubleButton.classList.toggle('game-over__button--used', !doubleAvailable);
  }

  reviveButton.addEventListener('click', async () => {
    refreshButtons(true);
    const revived = await actions.revive();
    if (!revived) refreshButtons(false);
  });

  doubleButton.addEventListener('click', async () => {
    refreshButtons(true);
    const result = await actions.doubleAle();
    if (result) {
      doubleAvailable = false;
      renderValues(result.summary, result.best);
    }
    refreshButtons(false);
  });

  restartButton.addEventListener('click', async () => {
    refreshButtons(true);
    await actions.restart();
  });

  const panels = createElement('div', 'game-over__panels');
  panels.append(runPanel, bestPanel);
  const buttons = createElement('div', 'game-over__actions');
  buttons.append(reviveButton, doubleButton, restartButton);
  overlay.append(createElement('h2', 'game-over__banner', t('gameOver.banner')), panels, buttons);

  renderValues(view.summary, view.best);
  refreshButtons(false);
  root.append(overlay);
  return () => overlay.remove();
}
