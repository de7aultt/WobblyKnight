import type { AdService } from '../core/ads';
import type { GameEventBus } from '../core/events';
import type { HighScores } from '../core/highScores';
import type { MetaProgression } from '../core/metaProgression';
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
  meta: MetaProgression;
  ads: AdService;
  onRevive: () => void;
  onRestart: () => void;
  onReturnToTavern: () => void;
}

export function mountGameOverController(options: GameOverControllerOptions): void {
  const { root, events, loop, runStats, highScores, meta, ads, onRevive, onRestart, onReturnToTavern } = options;
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
      const bonus = runStats.doubleMugs();
      highScores.addLifetimeMugs(bonus);
      meta.depositMugs(bonus);
      return { summary: runStats.summary(), best: highScores.snapshot() };
    },
    async restart() {
      await ads.beforeRestart();
      dismiss();
      onRestart();
    },
    async returnToTavern() {
      await ads.beforeRestart();
      dismiss();
      onReturnToTavern();
    }
  };

  function open(): void {
    loop.pause();
    const summary = runStats.summary();
    meta.depositMugs(summary.mugsCollected - runStats.credited);
    const record = highScores.recordRun(summary, runStats.credited);
    runStats.markCredited();
    closeModal = openGameOverModal(
      root,
      { summary, best: highScores.snapshot(), record, canRevive: ads.isRewardedAvailable() && !reviveUsed, canDoubleAle: ads.isRewardedAvailable() && !doubleUsed },
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
