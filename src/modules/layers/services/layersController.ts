import { errorMessage } from '@/shared/lib/abort';
import type { LayersApi } from '../api/types';
import { normalizeOpacity } from '../domain/opacity';
import type { LayerRegistry } from '../domain/registry';
import type {
  LayerData,
  LayerId,
  LayerRequestState,
  LayerState,
  LayersState,
} from '../domain/types';
import { getLayerState, type LayersStore } from '../store/layersStore';

export type LayerDataCache = Map<LayerId, LayerData>;

/** All state transitions of layers go through here; components never dispatch directly. */
export interface LayersController {
  setEnabled(id: LayerId, enabled: boolean): void;
  toggle(id: LayerId): void;
  setOpacity(id: LayerId, opacity: number): void;
  retry(id: LayerId): void;
  setAllEnabled(enabled: boolean): void;
  retryFailed(): void;
  /**
   * Cancels every in-flight request on teardown. Layer states are left as is because the
   * store is discarded together with the controller. Holds no "disposed" flag, so it is
   * safe with StrictMode's mount → unmount → mount cycle.
   */
  dispose(): void;
}

interface CreateLayersControllerOptions {
  readonly store: LayersStore;
  readonly api: LayersApi;
  readonly registry: LayerRegistry;
  readonly cache: LayerDataCache;
  readonly now?: () => number;
}

interface InFlightRequest {
  readonly requestId: number;
  readonly abortController: AbortController;
}

export function createLayersController({
  store,
  api,
  registry,
  cache,
  now = Date.now,
}: CreateLayersControllerOptions): LayersController {
  let lastRequestId = 0;
  const inFlight = new Map<LayerId, InFlightRequest>();

  const isCurrent = (id: LayerId, requestId: number) => inFlight.get(id)?.requestId === requestId;

  const patch = (id: LayerId, changes: Partial<LayerState>) => {
    store.dispatch(id, { ...getLayerState(store, id), ...changes });
  };

  const cancelRequest = (id: LayerId) => {
    const request = inFlight.get(id);
    if (!request) return;
    inFlight.delete(id);
    request.abortController.abort();
  };

  /**
   * Race-condition handling has two independent guards:
   * 1. AbortController cancels the stale request (saves network/CPU);
   * 2. every request gets a monotonically increasing id, and a response is applied only
   *    if it still belongs to the latest request for that layer. This keeps state correct
   *    even if a transport ignores the abort signal or resolves after it.
   */
  const startRequest = (id: LayerId): LayerRequestState => {
    cancelRequest(id);
    lastRequestId += 1;
    const requestId = lastRequestId;
    const abortController = new AbortController();
    inFlight.set(id, { requestId, abortController });

    api.fetchLayerData(id, { signal: abortController.signal }).then(
      (data) => {
        if (!isCurrent(id, requestId)) return;
        inFlight.delete(id);
        cache.set(id, data);
        patch(id, { request: { status: 'success', requestId, loadedAt: now() } });
      },
      (error: unknown) => {
        // Aborted or superseded requests are no longer current, so they are dropped here.
        if (!isCurrent(id, requestId)) return;
        inFlight.delete(id);
        patch(id, { request: { status: 'error', requestId, message: errorMessage(error) } });
      },
    );

    return { status: 'loading', requestId };
  };

  const enabledState = (id: LayerId): LayerState => ({
    ...getLayerState(store, id),
    enabled: true,
    request: startRequest(id),
  });

  const disabledState = (id: LayerId): LayerState => {
    cancelRequest(id);
    cache.delete(id);
    return { ...getLayerState(store, id), enabled: false, request: { status: 'idle' } };
  };

  const setEnabled = (id: LayerId, enabled: boolean) => {
    if (getLayerState(store, id).enabled === enabled) return;
    store.dispatch(id, enabled ? enabledState(id) : disabledState(id));
  };

  return {
    setEnabled,
    toggle(id) {
      setEnabled(id, !getLayerState(store, id).enabled);
    },
    setOpacity(id, opacity) {
      const next = normalizeOpacity(opacity);
      if (getLayerState(store, id).opacity === next) return;
      patch(id, { opacity: next });
    },
    retry(id) {
      const layer = getLayerState(store, id);
      if (!layer.enabled || layer.request.status !== 'error') return;
      patch(id, { request: startRequest(id) });
    },
    setAllEnabled(enabled) {
      // One object dispatch instead of N: subscribers of the whole state are notified once.
      const changes: LayersState = {};
      for (const id of registry.ids) {
        if (getLayerState(store, id).enabled === enabled) continue;
        changes[id] = enabled ? enabledState(id) : disabledState(id);
      }
      if (Object.keys(changes).length > 0) store.dispatch(changes);
    },
    retryFailed() {
      const changes: LayersState = {};
      for (const id of registry.ids) {
        const layer = getLayerState(store, id);
        if (!layer.enabled || layer.request.status !== 'error') continue;
        changes[id] = { ...layer, request: startRequest(id) };
      }
      if (Object.keys(changes).length > 0) store.dispatch(changes);
    },
    dispose() {
      for (const id of [...inFlight.keys()]) cancelRequest(id);
    },
  };
}
