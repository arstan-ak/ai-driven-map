import { abortableDelay } from '@/shared/lib/abort';
import { createSeededRandom, hashString, type RandomSource } from '@/shared/lib/random';
import type { LayerRegistry } from '../domain/registry';
import type { LayerData } from '../domain/types';
import { generateLayerGeoJson } from './mockGeoData';
import { LayerRequestError, type LayersApi } from './types';

export interface MockApiSettings {
  /** Probability in [0, 1] that a request fails. */
  readonly failureRate: number;
  readonly minLatencyMs: number;
  readonly maxLatencyMs: number;
}

export interface MockLayersApi extends LayersApi {
  getSettings(): MockApiSettings;
  configure(settings: Partial<MockApiSettings>): void;
}

export const DEFAULT_MOCK_SETTINGS: MockApiSettings = {
  failureRate: 0.2,
  minLatencyMs: 300,
  maxLatencyMs: 1500,
};

interface CreateMockLayersApiOptions {
  readonly registry: LayerRegistry;
  readonly settings?: Partial<MockApiSettings>;
  /** Drives latency and failures; injectable to make tests deterministic. */
  readonly random?: RandomSource;
  readonly now?: () => number;
}

/**
 * Imitates a backend: random latency (so responses can arrive out of order), random
 * failures and support for cancellation through AbortSignal.
 */
export function createMockLayersApi({
  registry,
  settings: initialSettings,
  random = Math.random,
  now = Date.now,
}: CreateMockLayersApiOptions): MockLayersApi {
  let settings: MockApiSettings = { ...DEFAULT_MOCK_SETTINGS, ...initialSettings };

  return {
    getSettings: () => settings,
    configure(patch) {
      settings = { ...settings, ...patch };
    },
    async fetchLayerData(layerId, { signal }) {
      const { kind } = registry.get(layerId);
      const { minLatencyMs, maxLatencyMs, failureRate } = settings;
      const latency = minLatencyMs + random() * Math.max(0, maxLatencyMs - minLatencyMs);

      await abortableDelay(latency, signal);

      if (random() < failureRate) {
        throw new LayerRequestError(`Сервер не ответил для слоя «${layerId}» (mock 503)`);
      }

      const generatedAt = now();
      const data: LayerData = {
        layerId,
        kind,
        generatedAt,
        geojson: generateLayerGeoJson(kind, createSeededRandom(hashString(layerId) ^ generatedAt)),
      };
      return data;
    },
  };
}
