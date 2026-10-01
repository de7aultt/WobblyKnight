import './adOverlay.css';
import type { AdSlot } from '../core/ads';
import { t } from '../i18n';

const COUNTDOWN_STEPS = 3;
const TICK_MS = 100;

export function showMockAdOverlay(root: HTMLElement, durationMs: number, slot: AdSlot): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'ad-overlay interactive';
    overlay.dataset.slot = slot;

    const label = document.createElement('div');
    label.className = 'ad-overlay__label';
    label.textContent = t('ad.label');

    const message = document.createElement('div');
    message.className = 'ad-overlay__message';

    overlay.append(label, message);
    root.append(overlay);

    const startedAt = performance.now();
    const render = (): void => {
      const elapsed = performance.now() - startedAt;
      const remainingStep = Math.max(1, COUNTDOWN_STEPS - Math.floor((elapsed / durationMs) * COUNTDOWN_STEPS));
      message.textContent = `${t('ad.simulating')} ${remainingStep}`;
    };

    render();
    const timer = window.setInterval(render, TICK_MS);
    window.setTimeout(() => {
      window.clearInterval(timer);
      overlay.remove();
      resolve();
    }, durationMs);
  });
}
