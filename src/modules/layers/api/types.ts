import type { LayerData, LayerId } from '../domain/types';

export interface FetchLayerOptions {
  readonly signal: AbortSignal;
}

/** Boundary to the backend. The UI and store only know this interface, not the transport. */
export interface LayersApi {
  fetchLayerData(layerId: LayerId, options: FetchLayerOptions): Promise<LayerData>;
}

export class LayerRequestError extends Error {
  override readonly name = 'LayerRequestError';
}
