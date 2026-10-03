import type { LayerDefinition, LayerId, LayerKind, LayersState } from './types';

/** Registry order is also the draw order on the map: first = bottom, last = top. */
export const DEFAULT_LAYERS: readonly LayerDefinition[] = [
  { id: 'temperature', kind: 'temperature', title: 'Температура', defaultOpacity: 0.7 },
  { id: 'insolation', kind: 'insolation', title: 'Инсоляция', defaultOpacity: 0.6 },
  { id: 'wind', kind: 'wind', title: 'Ветер', defaultOpacity: 0.9 },
];

const KINDS: readonly LayerKind[] = ['temperature', 'wind', 'insolation'];

const KIND_TITLES: Readonly<Record<LayerKind, string>> = {
  temperature: 'Температура',
  wind: 'Ветер',
  insolation: 'Инсоляция',
};

/** Synthetic layers used to demonstrate how the UI behaves with 100+ layers. */
export function createSyntheticLayers(count: number): LayerDefinition[] {
  return Array.from({ length: count }, (_, index): LayerDefinition => {
    const kind = KINDS[index % KINDS.length] ?? 'temperature';
    const number = String(index + 1).padStart(3, '0');
    return {
      id: `${kind}-${number}`,
      kind,
      title: `${KIND_TITLES[kind]} #${number}`,
      defaultOpacity: 0.5,
    };
  });
}

export interface LayerRegistry {
  readonly layers: readonly LayerDefinition[];
  readonly ids: readonly LayerId[];
  get(id: LayerId): LayerDefinition;
  /** Position of a layer in the registry; used to keep a stable draw order on the map. */
  indexOf(id: LayerId): number;
}

export function createLayerRegistry(layers: readonly LayerDefinition[]): LayerRegistry {
  const byId = new Map<LayerId, LayerDefinition>();
  const indexById = new Map<LayerId, number>();
  layers.forEach((layer, index) => {
    if (byId.has(layer.id)) throw new Error(`Duplicate layer id "${layer.id}"`);
    byId.set(layer.id, layer);
    indexById.set(layer.id, index);
  });

  return {
    layers,
    ids: layers.map((layer) => layer.id),
    get(id) {
      const layer = byId.get(id);
      if (!layer) throw new Error(`Unknown layer id "${id}"`);
      return layer;
    },
    indexOf(id) {
      return indexById.get(id) ?? -1;
    },
  };
}

export function createInitialLayersState(registry: LayerRegistry): LayersState {
  const state: LayersState = {};
  for (const layer of registry.layers) {
    state[layer.id] = {
      enabled: false,
      opacity: layer.defaultOpacity,
      request: { status: 'idle' },
    };
  }
  return state;
}
