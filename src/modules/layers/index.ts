// Public API of the layers module. Other parts of the app import only from here.
export type {
  LayerDefinition,
  LayerId,
  LayerKind,
  LayerState,
  LayerStatus,
  LayersState,
} from './domain/types';
export {
  DEFAULT_LAYERS,
  createLayerRegistry,
  createSyntheticLayers,
  type LayerRegistry,
} from './domain/registry';
export type { LayersApi } from './api/types';
export { createMockLayersApi, type MockLayersApi } from './api/mockLayersApi';
export { LayersProvider } from './store/LayersProvider';
export { useLayersController, useLayerSelector, useLayersSummary } from './store/hooks';
export { LayerPanel } from './ui/LayerPanel';
export { MockApiSettings } from './ui/MockApiSettings';
