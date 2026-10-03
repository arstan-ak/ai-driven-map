import { createVedro } from 'vedro';
import type Vedro from 'vedro';
import type { LayerId, LayerState, LayersState } from '../domain/types';

export type LayersStore = Vedro<LayersState>;

/**
 * The actual initial state is passed to the Provider (it depends on the registry),
 * so every Provider gets its own store instance — no module-level singleton, which
 * keeps tests isolated.
 */
export const {
  Provider: LayersStoreProvider,
  useStore: useVedroLayersStore,
  useSelector: useLayersSelector,
} = createVedro<LayersState>({});

export function getLayerState(store: LayersStore, id: LayerId): LayerState {
  const layer = store.get(id);
  if (!layer) throw new Error(`Layer "${id}" is not registered in the store`);
  return layer;
}
