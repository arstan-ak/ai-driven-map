import { use, useCallback, useSyncExternalStore } from 'react';
import type { LayerId, LayerState } from '../domain/types';
import { getLayerState, useLayersSelector } from './layersStore';
import { LayersRuntimeContext, type LayersRuntime } from './LayersRuntimeContext';
import { selectSummary, type LayersSummary } from './selectors';

export function useLayersRuntime(): LayersRuntime {
  const runtime = use(LayersRuntimeContext);
  if (!runtime) throw new Error('useLayersRuntime must be used inside <LayersProvider>');
  return runtime;
}

export const useLayersController = () => useLayersRuntime().controller;
export const useLayerRegistry = () => useLayersRuntime().registry;

/**
 * Subscribes a component to ONE layer via `store.on(id)` (vedro's per-key subscription).
 *
 * Why not vedro's `useSelector` here: it subscribes to the whole state ("@state"), so each
 * dispatch runs every mounted selector twice plus JSON.stringify — O(N) per update for N
 * rows. It also captures the selector once (`useEffect(..., [])`), so a changed `id` prop
 * would keep reading the old layer. `useSyncExternalStore` + per-key subscription gives
 * O(1) notifications per update, re-subscribes when `id` changes and is tearing-safe
 * in concurrent rendering.
 *
 * `selector` must return a primitive or a reference stored in the state (see selectors.ts).
 */
export function useLayerSelector<T>(id: LayerId, selector: (layer: LayerState) => T): T {
  const { store } = useLayersRuntime();
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      store.on(id, () => {
        onStoreChange();
      }),
    [store, id],
  );
  const getSnapshot = () => selector(getLayerState(store, id));
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Aggregate over all layers. Here vedro's own `useSelector` is a good fit: there is a
 * single subscriber, no props to go stale, and the result is compared structurally, so
 * the component re-renders only when one of the counters actually changes.
 */
export function useLayersSummary(): LayersSummary {
  return useLayersSelector(selectSummary);
}
