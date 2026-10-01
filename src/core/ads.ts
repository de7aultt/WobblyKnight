import { readJson, writeJson } from './storage';

export type AdPlacement = 'revive' | 'double_ale';
export type AdSlot = AdPlacement | 'midroll';
export type MockAdRenderer = (durationMs: number, slot: AdSlot) => Promise<void>;

type SdkAdType = 'rewarded' | 'midgame';

interface SdkAdCallbacks {
  adStarted?: () => void;
  adFinished: () => void;
  adError: () => void;
}

interface CrazyGamesSdk {
  ad: { requestAd(type: SdkAdType, callbacks: SdkAdCallbacks): void };
}

declare global {
  interface Window {
    CrazyGames?: { SDK?: CrazyGamesSdk };
  }
}

const MOCK_AD_DURATION_MS = 2500;
const RUN_COUNTER_KEY = 'wobbly-knight.completed-runs';
const MIDROLL_EVERY_N_RUNS = 2;

export class AdService {
  constructor(private readonly renderMockAd: MockAdRenderer) {}

  async showRewarded(placement: AdPlacement): Promise<boolean> {
    const sdk = this.findSdk();
    if (sdk) return this.requestSdkAd(sdk, 'rewarded');
    await this.renderMockAd(MOCK_AD_DURATION_MS, placement);
    return true;
  }

  async showMidroll(): Promise<void> {
    const sdk = this.findSdk();
    if (sdk) {
      await this.requestSdkAd(sdk, 'midgame');
      return;
    }
    await this.renderMockAd(MOCK_AD_DURATION_MS, 'midroll');
  }

  async beforeRestart(): Promise<void> {
    const completedRuns = readJson<number>(RUN_COUNTER_KEY, 0) + 1;
    writeJson(RUN_COUNTER_KEY, completedRuns);
    if (completedRuns % MIDROLL_EVERY_N_RUNS === 0) await this.showMidroll();
  }

  private findSdk(): CrazyGamesSdk | null {
    const sdk = window.CrazyGames?.SDK;
    return sdk?.ad ? sdk : null;
  }

  private requestSdkAd(sdk: CrazyGamesSdk, type: SdkAdType): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        sdk.ad.requestAd(type, { adFinished: () => resolve(true), adError: () => resolve(false) });
      } catch {
        resolve(false);
      }
    });
  }
}
