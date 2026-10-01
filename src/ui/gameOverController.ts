import type { AdService } from '../core/ads';
import type { GameEventBus } from '../core/events';
import type { HighScores } from '../core/highScores';
import type { GameLoop } from '../core/loop';
import type { RunStats } from '../core/runStats';
import { openGameOverModal, type GameOverActions } from './gameOverModal';

const MODAL_DELAY_MS = 1200;

export interface GameOverControllerOptions {
  root: HTMLElement;
  events: GameEventBus;
  loop: GameLoop;
  runStats: RunStats;
  highScores: HighScores;
  ads: AdService;
  onRevive: () => void;
  onRestart: () => void;
}

export function mountGameOverController(options: GameOverControllerOptions): void {
  const { root, events, loop, runStats, highScores, ads, onRevive, onRestart } = options;
  let delayTimer: number | undefined;
  let closeModal: (() => void) | null = null;
  let reviveUsed = false;
  let doubleUsed = false;

  function dismiss(): void {
    closeModal?.();
    closeModal = null;
    loop.resume();
  }

  const actions: GameOverActions = {
    async revive() {
      const watched = await ads.showRewarded('revive');
      if (!watched) return false;
      reviveUsed = true;
      dismiss();
      onRevive();
      return true;
    },
    async doubleAle() {
      const watched = await ads.showRewarded('double_ale');
      if (!watched) return null;
      doubleUsed = true;
      highScores.addLifetimeMugs(runStats.doubleMugs());
      return { summary: runStats.summary(), best: highScores.snapshot() };
    },
    async restart() {
      await ads.beforeRestart();
      dismiss();
      onRestart();
    }
  };

  function open(): void {
    loop.pause();
    const summary = runStats.summary();
    const record = highScores.recordRun(summary, runStats.credited);
    runStats.markCredited();
    closeModal = openGameOverModal(
      root,
      { summary, best: highScores.snapshot(), record, canRevive: !reviveUsed, canDoubleAle: !doubleUsed },
      actions
    );
  }

  events.on('KNOCKED_OUT', () => {
    window.clearTimeout(delayTimer);
    delayTimer = window.setTimeout(open, MODAL_DELAY_MS);
  });
  events.on('RUN_RESET', () => {
    window.clearTimeout(delayTimer);
    reviveUsed = false;
    doubleUsed = false;
  });
}
