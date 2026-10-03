import { isAbortError } from '@/shared/lib/abort';
import { createLayerRegistry, DEFAULT_LAYERS } from '../domain/registry';
import { createMockLayersApi } from './mockLayersApi';
import { LayerRequestError } from './types';

const registry = createLayerRegistry(DEFAULT_LAYERS);

describe('mockLayersApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with GeoJSON of the requested kind after the latency', async () => {
    const api = createMockLayersApi({
      registry,
      settings: { failureRate: 0, minLatencyMs: 100, maxLatencyMs: 100 },
    });
    const promise = api.fetchLayerData('wind', { signal: new AbortController().signal });

    await vi.advanceTimersByTimeAsync(100);
    const data = await promise;

    expect(data.kind).toBe('wind');
    expect(data.geojson.features.length).toBeGreaterThan(0);
    expect(data.geojson.features[0]?.geometry.type).toBe('LineString');
  });

  it('fails according to failureRate', async () => {
    const api = createMockLayersApi({
      registry,
      settings: { failureRate: 1, minLatencyMs: 10, maxLatencyMs: 10 },
    });
    const promise = api.fetchLayerData('temperature', { signal: new AbortController().signal });
    const assertion = expect(promise).rejects.toBeInstanceOf(LayerRequestError);
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
  });

  it('rejects with AbortError and stops the timer when aborted', async () => {
    const api = createMockLayersApi({ registry, settings: { failureRate: 0 } });
    const controller = new AbortController();
    const promise = api.fetchLayerData('insolation', { signal: controller.signal });

    controller.abort();
    const error: unknown = await promise.catch((e: unknown) => e);

    expect(isAbortError(error)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can be reconfigured at runtime', () => {
    const api = createMockLayersApi({ registry });
    api.configure({ failureRate: 0.5 });
    expect(api.getSettings().failureRate).toBe(0.5);
  });
});
