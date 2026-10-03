import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { LayerRegistry } from '../domain/registry';
import type { LayerData, LayerId } from '../domain/types';
import type { LayerDataCache } from '../services/layersController';
import { getLayerState, type LayersStore } from '../store/layersStore';
import { LAYER_STYLES } from './layerStyles';

/** The subset of the MapLibre API the binding needs — easy to fake in tests. */
export type MapLike = Pick<
  MapLibreMap,
  | 'addSource'
  | 'getSource'
  | 'removeSource'
  | 'addLayer'
  | 'getLayer'
  | 'removeLayer'
  | 'setPaintProperty'
>;

interface BindLayersToMapOptions {
  readonly map: MapLike;
  readonly store: LayersStore;
  readonly registry: LayerRegistry;
  readonly cache: LayerDataCache;
}

export const mapLayerId = (id: LayerId) => `layer:${id}`;
export const mapSourceId = (id: LayerId) => `source:${id}`;

/**
 * Imperatively mirrors the store into MapLibre. It subscribes to every layer key
 * separately (vedro `store.on(id)`), so an opacity change of one layer touches only that
 * layer on the map — and React is not involved at all: the map never re-renders.
 */
export function bindLayersToMap({
  map,
  store,
  registry,
  cache,
}: BindLayersToMapOptions): () => void {
  /** Which data object is currently uploaded for each layer, to avoid re-uploading it. */
  const rendered = new Map<LayerId, LayerData>();
  const appliedOpacity = new Map<LayerId, number>();

  /** Layers are inserted below the next visible layer, so the draw order follows the registry
   *  regardless of the order in which responses arrive. */
  const findBeforeId = (id: LayerId): string | undefined => {
    const ids = registry.ids;
    for (let i = registry.indexOf(id) + 1; i < ids.length; i += 1) {
      const nextId = ids[i];
      if (nextId !== undefined && rendered.has(nextId)) return mapLayerId(nextId);
    }
    return undefined;
  };

  const remove = (id: LayerId) => {
    if (map.getLayer(mapLayerId(id))) map.removeLayer(mapLayerId(id));
    if (map.getSource(mapSourceId(id))) map.removeSource(mapSourceId(id));
    rendered.delete(id);
    appliedOpacity.delete(id);
  };

  const sync = (id: LayerId) => {
    const layer = getLayerState(store, id);
    const data = cache.get(id);
    const visible = layer.enabled && layer.request.status === 'success' && data !== undefined;

    if (!visible) {
      // While a layer reloads after retry we keep nothing stale on screen.
      if (rendered.has(id)) remove(id);
      return;
    }

    const style = LAYER_STYLES[registry.get(id).kind];
    const renderedData = rendered.get(id);

    if (renderedData === undefined) {
      map.addSource(mapSourceId(id), { type: 'geojson', data: data.geojson });
      map.addLayer(
        style.create({ id: mapLayerId(id), source: mapSourceId(id), opacity: layer.opacity }),
        findBeforeId(id),
      );
      rendered.set(id, data);
      appliedOpacity.set(id, layer.opacity);
      return;
    }

    if (renderedData !== data) {
      void map.getSource<GeoJSONSource>(mapSourceId(id))?.setData(data.geojson);
      rendered.set(id, data);
    }

    if (appliedOpacity.get(id) !== layer.opacity) {
      map.setPaintProperty(mapLayerId(id), style.opacityProperty, layer.opacity);
      appliedOpacity.set(id, layer.opacity);
    }
  };

  // vedro calls the listener immediately on subscribe, which performs the initial sync.
  const unsubscribers = registry.ids.map((id) =>
    store.on(id, () => {
      sync(id);
    }),
  );

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
    for (const id of [...rendered.keys()]) remove(id);
  };
}
