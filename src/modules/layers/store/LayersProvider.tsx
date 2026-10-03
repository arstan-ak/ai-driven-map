import { useEffect, useState, type ReactNode } from 'react';
import type { LayersApi } from '../api/types';
import { createInitialLayersState, type LayerRegistry } from '../domain/registry';
import { createLayersController, type LayerDataCache } from '../services/layersController';
import { LayersStoreProvider, useVedroLayersStore } from './layersStore';
import { LayersRuntimeContext, type LayersRuntime } from './LayersRuntimeContext';

interface LayersProviderProps {
  /** Static configuration: read once on mount. */
  readonly registry: LayerRegistry;
  readonly api: LayersApi;
  readonly children: ReactNode;
}

export function LayersProvider({ registry, api, children }: LayersProviderProps) {
  const [initialState] = useState(() => createInitialLayersState(registry));
  return (
    <LayersStoreProvider state={initialState}>
      <LayersRuntimeProvider registry={registry} api={api}>
        {children}
      </LayersRuntimeProvider>
    </LayersStoreProvider>
  );
}

function LayersRuntimeProvider({ registry, api, children }: LayersProviderProps) {
  const store = useVedroLayersStore();
  const [runtime] = useState((): LayersRuntime => {
    const cache: LayerDataCache = new Map();
    return {
      store,
      registry,
      api,
      cache,
      controller: createLayersController({ store, api, registry, cache }),
    };
  });

  useEffect(
    () => () => {
      runtime.controller.dispose();
    },
    [runtime],
  );

  return <LayersRuntimeContext value={runtime}>{children}</LayersRuntimeContext>;
}
