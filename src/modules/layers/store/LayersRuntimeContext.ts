import { createContext } from 'react';
import type { LayersApi } from '../api/types';
import type { LayerRegistry } from '../domain/registry';
import type { LayerDataCache, LayersController } from '../services/layersController';
import type { LayersStore } from './layersStore';

/** Non-reactive dependencies. The value is created once, so consumers never re-render from it. */
export interface LayersRuntime {
  readonly store: LayersStore;
  readonly registry: LayerRegistry;
  readonly controller: LayersController;
  readonly cache: LayerDataCache;
  readonly api: LayersApi;
}

export const LayersRuntimeContext = createContext<LayersRuntime | null>(null);
