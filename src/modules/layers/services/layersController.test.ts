import Vedro from 'vedro';
import { createDeferredApi, fakeLayerData, flushPromises } from '@/test/deferredApi';
import {
  createLayerRegistry,
  createInitialLayersState,
  createSyntheticLayers,
  DEFAULT_LAYERS,
} from '../domain/registry';
import type { LayersState } from '../domain/types';
import { getLayerState } from '../store/layersStore';
import { createLayersController, type LayerDataCache } from './layersController';

function setup(layers = DEFAULT_LAYERS) {
  const registry = createLayerRegistry(layers);
  const store = new Vedro<LayersState>(createInitialLayersState(registry));
  const cache: LayerDataCache = new Map();
  const deferred = createDeferredApi();
  const controller = createLayersController({
    store,
    api: deferred.api,
    registry,
    cache,
    now: () => 42,
  });
  const layer = (id: string) => getLayerState(store, id);
  return { registry, store, cache, controller, layer, ...deferred };
}

describe('layersController', () => {
  it('enabling a layer requests data: loading → success', async () => {
    const { controller, layer, last, cache } = setup();

    controller.setEnabled('temperature', true);
    expect(layer('temperature')).toMatchObject({ enabled: true, request: { status: 'loading' } });

    last('temperature').resolve();
    await flushPromises();

    expect(layer('temperature').request).toMatchObject({ status: 'success', loadedAt: 42 });
    expect(cache.has('temperature')).toBe(true);
  });

  it('shows an error and recovers after retry', async () => {
    const { controller, layer, last, requests } = setup();

    controller.setEnabled('wind', true);
    last('wind').reject(new Error('503'));
    await flushPromises();
    expect(layer('wind').request).toMatchObject({ status: 'error', message: '503' });

    controller.retry('wind');
    expect(layer('wind').request.status).toBe('loading');
    expect(requests).toHaveLength(2);

    last('wind').resolve();
    await flushPromises();
    expect(layer('wind').request.status).toBe('success');
  });

  it('retry is a no-op unless the layer is enabled and failed', () => {
    const { controller, requests } = setup();
    controller.retry('wind');
    controller.setEnabled('wind', true);
    controller.retry('wind'); // still loading
    expect(requests).toHaveLength(1);
  });

  it('ignores a stale response that arrives after a newer one (on → off → on)', async () => {
    const { controller, layer, requests, cache } = setup();

    controller.setEnabled('temperature', true); // request #1 (slow)
    controller.setEnabled('temperature', false);
    controller.setEnabled('temperature', true); // request #2 (fast)
    const [first, second] = requests;

    const fresh = fakeLayerData('temperature', 2);
    second?.resolve(fresh);
    await flushPromises();
    first?.resolve(fakeLayerData('temperature', 1));
    await flushPromises();

    expect(first?.signal.aborted).toBe(true);
    expect(second?.signal.aborted).toBe(false);
    expect(layer('temperature').request).toMatchObject({ status: 'success' });
    expect(cache.get('temperature')).toBe(fresh);
  });

  it('a stale error cannot overwrite a newer success', async () => {
    const { controller, layer, requests } = setup();

    controller.setEnabled('wind', true);
    controller.setEnabled('wind', false);
    controller.setEnabled('wind', true);
    requests[1]?.resolve();
    await flushPromises();
    requests[0]?.reject(new Error('late failure'));
    await flushPromises();

    expect(layer('wind').request.status).toBe('success');
  });

  it('a response that arrives after the layer was disabled is dropped', async () => {
    const { controller, layer, last, cache } = setup();

    controller.setEnabled('insolation', true);
    const request = last('insolation');
    controller.setEnabled('insolation', false);
    request.resolve();
    await flushPromises();

    expect(layer('insolation')).toMatchObject({ enabled: false, request: { status: 'idle' } });
    expect(cache.has('insolation')).toBe(false);
  });

  it('survives rapid toggling: only the latest request can win', async () => {
    const { controller, layer, requests } = setup();

    for (let i = 0; i < 11; i += 1) controller.toggle('temperature'); // ends enabled
    expect(requests).toHaveLength(6);
    expect(requests.slice(0, -1).every((r) => r.signal.aborted)).toBe(true);

    // Resolve in reverse order to maximise the chance of a stale write.
    for (const request of [...requests].reverse()) request.resolve();
    await flushPromises();

    expect(layer('temperature')).toMatchObject({ enabled: true, request: { status: 'success' } });
    expect(layer('temperature').request).toMatchObject({ requestId: requests.length });
  });

  it('setEnabled is idempotent and does not refetch', () => {
    const { controller, requests } = setup();
    controller.setEnabled('wind', true);
    controller.setEnabled('wind', true);
    expect(requests).toHaveLength(1);
  });

  it('normalizes opacity and skips no-op updates', () => {
    const { controller, layer, store } = setup();
    const listener = vi.fn();
    store.on('wind', listener);
    listener.mockClear();

    controller.setOpacity('wind', 1.7);
    expect(layer('wind').opacity).toBe(1);
    controller.setOpacity('wind', 1);
    controller.setOpacity('wind', -3);
    expect(layer('wind').opacity).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('setAllEnabled updates 150 layers with a single dispatch', () => {
    const layers = [...DEFAULT_LAYERS, ...createSyntheticLayers(147)];
    const { controller, store, requests, registry } = setup(layers);
    const stateListener = vi.fn();
    store.on('@state', stateListener);
    stateListener.mockClear();

    controller.setAllEnabled(true);

    expect(stateListener).toHaveBeenCalledTimes(1);
    expect(requests).toHaveLength(150);
    expect(registry.ids.every((id) => getLayerState(store, id).enabled)).toBe(true);

    controller.setAllEnabled(false);
    expect(requests.every((r) => r.signal.aborted)).toBe(true);
  });

  it('retryFailed re-requests only failed layers', async () => {
    const { controller, layer, last, requests } = setup();
    controller.setAllEnabled(true);
    last('temperature').reject(new Error('x'));
    last('wind').reject(new Error('y'));
    last('insolation').resolve();
    await flushPromises();

    controller.retryFailed();

    expect(requests).toHaveLength(5);
    expect(layer('temperature').request.status).toBe('loading');
    expect(layer('wind').request.status).toBe('loading');
    expect(layer('insolation').request.status).toBe('success');
  });

  it('dispose aborts in-flight requests and late responses are ignored', async () => {
    const { controller, layer, last } = setup();
    controller.setEnabled('wind', true);
    controller.dispose();
    expect(last('wind').signal.aborted).toBe(true);

    last('wind').resolve();
    await flushPromises();
    expect(layer('wind').request.status).toBe('loading');
  });
});
