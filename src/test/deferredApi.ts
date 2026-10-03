import type { LayersApi } from '@/modules/layers/api/types';
import type { LayerData, LayerId } from '@/modules/layers/domain/types';

export interface PendingRequest {
  readonly layerId: LayerId;
  readonly signal: AbortSignal;
  readonly resolve: (data?: LayerData) => void;
  readonly reject: (error: Error) => void;
}

/**
 * Test double whose requests resolve only when the test says so. This makes the order of
 * responses fully controllable, which is what race-condition tests need. It deliberately
 * ignores the abort signal to prove that the controller does not rely on it.
 */
export function createDeferredApi() {
  const requests: PendingRequest[] = [];

  const api: LayersApi = {
    fetchLayerData(layerId, { signal }) {
      return new Promise<LayerData>((resolve, reject) => {
        requests.push({
          layerId,
          signal,
          resolve: (data) => {
            resolve(data ?? fakeLayerData(layerId));
          },
          reject,
        });
      });
    },
  };

  return {
    api,
    requests,
    last: (layerId: LayerId): PendingRequest => {
      const request = requests.filter((r) => r.layerId === layerId).at(-1);
      if (!request) throw new Error(`No request for ${layerId}`);
      return request;
    },
  };
}

export function fakeLayerData(layerId: LayerId, generatedAt = 0): LayerData {
  return {
    layerId,
    kind: 'temperature',
    generatedAt,
    geojson: { type: 'FeatureCollection', features: [] },
  };
}

/** Lets pending promise callbacks run. */
export const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
