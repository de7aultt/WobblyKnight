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
  init(): Promise<void>;
  environment?: string;
  game: { gameplayStart(): void; gameplayStop(): void };
  ad: { requestAd(type: SdkAdType, callbacks: SdkAdCallbacks): void };
}

declare global {
  interface Window {
    CrazyGames?: { SDK?: CrazyGamesSdk };
  }
}

export const ADS_ENABLED = false;

const MOCK_AD_DURATION_MS = 2500;
const RUN_COUNTER_KEY = 'wobbly-knight.completed-runs';
const MIDROLL_EVERY_N_RUNS = 2;
const DISABLED_ENVIRONMENT = 'disabled';

export class AdService {
  private ready = false;
  private gameplayWanted = false;
  private gameplayActive = false;

  constructor(private readonly renderMockAd: MockAdRenderer) {}

  async initialize(): Promise<void> {
    const sdk = window.CrazyGames?.SDK;
    if (!sdk) return;
    try {
      await sdk.init();
      this.ready = sdk.environment !== DISABLED_ENVIRONMENT;
    } catch {
      this.ready = false;
    }
    this.syncGameplay();
  }

  gameplayStart(): void {
    this.gameplayWanted = true;
    this.syncGameplay();
  }

  gameplayStop(): void {
    this.gameplayWanted = false;
    this.syncGameplay();
  }

  isRewardedAvailable(): boolean {
    return ADS_ENABLED && this.ready;
  }

  async showRewarded(placement: AdPlacement): Promise<boolean> {
    const sdk = this.findSdk();
    if (sdk) return this.requestSdkAd(sdk, 'rewarded');
    await this.renderMockAd(MOCK_AD_DURATION_MS, placement);
    return true;
  }

  async showMidroll(): Promise<void> {
    if (!ADS_ENABLED) return;
    const sdk = this.findSdk();
    if (sdk) {
      await this.requestSdkAd(sdk, 'midgame');
      return;
    }
    await this.renderMockAd(MOCK_AD_DURATION_MS, 'midroll');
  }

  async beforeRestart(): Promise<void> {
    if (!ADS_ENABLED) return;
    const completedRuns = readJson<number>(RUN_COUNTER_KEY, 0) + 1;
    writeJson(RUN_COUNTER_KEY, completedRuns);
    if (completedRuns % MIDROLL_EVERY_N_RUNS === 0) await this.showMidroll();
  }

  private findSdk(): CrazyGamesSdk | null {
    const sdk = window.CrazyGames?.SDK;
    return this.ready && sdk ? sdk : null;
  }

  private syncGameplay(): void {
    const sdk = this.findSdk();
    if (!sdk || this.gameplayActive === this.gameplayWanted) return;
    try {
      if (this.gameplayWanted) sdk.game.gameplayStart();
      else sdk.game.gameplayStop();
      this.gameplayActive = this.gameplayWanted;
    } catch {
      return;
    }
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
