import {
  DEFAULT_LAYERS,
  createLayerRegistry,
  createSyntheticLayers,
  type LayerRegistry,
} from '@/modules/layers';

export const MAX_LAYERS = 1000;

/** `?layers=150` adds synthetic layers to demonstrate behaviour with 100+ layers. */
export function createRegistryFromUrl(search: string): LayerRegistry {
  const requested = Number.parseInt(new URLSearchParams(search).get('layers') ?? '', 10);
  if (!Number.isFinite(requested) || requested <= DEFAULT_LAYERS.length) {
    return createLayerRegistry(DEFAULT_LAYERS);
  }
  const extra = Math.min(requested, MAX_LAYERS) - DEFAULT_LAYERS.length;
  return createLayerRegistry([...DEFAULT_LAYERS, ...createSyntheticLayers(extra)]);
}
