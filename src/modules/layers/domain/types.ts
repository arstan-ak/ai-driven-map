import type { FeatureCollection, LineString, Polygon } from 'geojson';

export type LayerKind = 'temperature' | 'wind' | 'insolation';

export type LayerId = string;

/** Static, serializable description of a layer. Adding a layer = adding one of these. */
export interface LayerDefinition {
  readonly id: LayerId;
  readonly kind: LayerKind;
  readonly title: string;
  readonly defaultOpacity: number;
}

/**
 * Lifecycle of the data request for a layer. A discriminated union makes impossible
 * states unrepresentable (e.g. an error without a message, or success while loading).
 */
export type LayerRequestState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly requestId: number }
  | { readonly status: 'success'; readonly requestId: number; readonly loadedAt: number }
  | { readonly status: 'error'; readonly requestId: number; readonly message: string };

export type LayerStatus = LayerRequestState['status'];

/** Reactive UI state of a single layer. Heavy payloads (GeoJSON) deliberately live elsewhere. */
export interface LayerState {
  readonly enabled: boolean;
  readonly opacity: number;
  readonly request: LayerRequestState;
}

/**
 * Every layer is its own top-level key of the vedro store. This lets subscribers listen
 * to one layer (`store.on(id)`) instead of the whole state, so an update costs O(1)
 * notifications no matter how many layers exist.
 *
 * `Partial` because ids are dynamic strings: a lookup by an unknown id is typed as
 * possibly `undefined` instead of lying that it always exists.
 */
export type LayersState = Partial<Record<LayerId, LayerState>>;

export interface LayerFeatureProperties {
  readonly value: number;
}

export type LayerGeometry = Polygon | LineString;

export interface LayerData {
  readonly layerId: LayerId;
  readonly kind: LayerKind;
  readonly generatedAt: number;
  readonly geojson: FeatureCollection<LayerGeometry, LayerFeatureProperties>;
}
