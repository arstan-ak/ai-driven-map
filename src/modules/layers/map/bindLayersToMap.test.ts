import Vedro from 'vedro';
import { fakeLayerData } from '@/test/deferredApi';
import { createInitialLayersState, createLayerRegistry, DEFAULT_LAYERS } from '../domain/registry';
import type { LayerId, LayerState, LayersState } from '../domain/types';
import type { LayerDataCache } from '../services/layersController';
import { getLayerState } from '../store/layersStore';
import { bindLayersToMap, mapLayerId, type MapLike } from './bindLayersToMap';

/** In-memory stand-in for MapLibre that records the calls the binding makes. */
function createFakeMap() {
  const sources = new Map<string, unknown>();
  const layers: string[] = []; // bottom → top
  const setData = vi.fn();
  const fake = {
    layers,
    setPaintProperty: vi.fn(),
    addSource: vi.fn((id: string, source: unknown) => {
      sources.set(id, source);
    }),
    getSource: vi.fn((id: string) => (sources.has(id) ? { setData } : undefined)),
    removeSource: vi.fn((id: string) => {
      sources.delete(id);
    }),
    addLayer: vi.fn((layer: { id: string }, beforeId?: string) => {
      const index = beforeId === undefined ? -1 : layers.indexOf(beforeId);
      if (index === -1) layers.push(layer.id);
      else layers.splice(index, 0, layer.id);
    }),
    getLayer: vi.fn((id: string) => (layers.includes(id) ? { id } : undefined)),
    removeLayer: vi.fn((id: string) => {
      layers.splice(layers.indexOf(id), 1);
    }),
  };
  // The fake implements only what the binding uses; the cast is confined to the test.
  return { fake, map: fake as unknown as MapLike, setData };
}

function setup() {
  const registry = createLayerRegistry(DEFAULT_LAYERS);
  const store = new Vedro<LayersState>(createInitialLayersState(registry));
  const cache: LayerDataCache = new Map();
  const { fake, map, setData } = createFakeMap();
  const unbind = bindLayersToMap({ map, store, registry, cache });

  const update = (id: LayerId, changes: Partial<LayerState>) => {
    store.dispatch(id, { ...getLayerState(store, id), ...changes });
  };
  const load = (id: LayerId) => {
    cache.set(id, fakeLayerData(id));
    update(id, { enabled: true, request: { status: 'success', requestId: 1, loadedAt: 0 } });
  };
  return { fake, setData, update, load, unbind, cache };
}

describe('bindLayersToMap', () => {
  it('adds a layer to the map only once it has loaded', () => {
    const { fake, update, load } = setup();

    update('wind', { enabled: true, request: { status: 'loading', requestId: 1 } });
    expect(fake.layers).toEqual([]);

    load('wind');
    expect(fake.layers).toEqual([mapLayerId('wind')]);
  });

  it('changes only paint opacity on the map when opacity changes', () => {
    const { fake, update, load } = setup();
    load('temperature');
    fake.addLayer.mockClear();

    update('temperature', { opacity: 0.3 });

    expect(fake.setPaintProperty).toHaveBeenCalledExactlyOnceWith(
      mapLayerId('temperature'),
      'fill-opacity',
      0.3,
    );
    expect(fake.addLayer).not.toHaveBeenCalled();
  });

  it('keeps registry draw order regardless of the order responses arrive in', () => {
    const { fake, load } = setup();

    load('wind');
    load('temperature');
    load('insolation');

    expect(fake.layers).toEqual(DEFAULT_LAYERS.map((l) => mapLayerId(l.id)));
  });

  it('removes layer and source when the layer is disabled', () => {
    const { fake, update, load } = setup();
    load('insolation');

    update('insolation', { enabled: false, request: { status: 'idle' } });

    expect(fake.layers).toEqual([]);
    expect(fake.removeSource).toHaveBeenCalledOnce();
  });

  it('only updates source data when a new payload arrives', () => {
    const { setData, load, update } = setup();
    load('wind');
    update('wind', { opacity: 0.5 });
    expect(setData).not.toHaveBeenCalled();

    load('wind');
    expect(setData).toHaveBeenCalledOnce();
  });

  it('unbind stops syncing and cleans the map up', () => {
    const { fake, load, unbind } = setup();
    load('wind');
    unbind();
    expect(fake.layers).toEqual([]);

    load('temperature');
    expect(fake.layers).toEqual([]);
  });
});
