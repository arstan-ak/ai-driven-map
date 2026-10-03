import type { LayerRequestState, LayerState, LayersState } from '../domain/types';

// Selectors return primitives or references already held by the state, never new
// objects, so `useSyncExternalStore` can compare snapshots with Object.is.
export const selectEnabled = (layer: LayerState): boolean => layer.enabled;
export const selectOpacity = (layer: LayerState): number => layer.opacity;
export const selectRequest = (layer: LayerState): LayerRequestState => layer.request;

export interface LayersSummary {
  readonly total: number;
  readonly enabled: number;
  readonly loading: number;
  readonly failed: number;
}

export function selectSummary(state: LayersState): LayersSummary {
  let total = 0;
  let enabled = 0;
  let loading = 0;
  let failed = 0;
  for (const layer of Object.values(state)) {
    if (!layer) continue;
    total += 1;
    if (layer.enabled) enabled += 1;
    if (layer.request.status === 'loading') loading += 1;
    if (layer.request.status === 'error') failed += 1;
  }
  return { total, enabled, loading, failed };
}
