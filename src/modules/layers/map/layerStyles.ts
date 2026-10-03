import type { AddLayerObject } from 'maplibre-gl';
import type { LayerKind } from '../domain/types';

type OpacityProperty = 'fill-opacity' | 'line-opacity';

interface LayerStyle {
  readonly opacityProperty: OpacityProperty;
  /** Legend stops: [value, color]. Also used to build the MapLibre color ramp. */
  readonly stops: readonly (readonly [number, string])[];
  readonly unit: string;
  create(params: { id: string; source: string; opacity: number }): AddLayerObject;
}

type ColorRamp = ['interpolate', ['linear'], ['get', string], ...(number | string)[]];

const colorRamp = (stops: LayerStyle['stops']): ColorRamp => [
  'interpolate',
  ['linear'],
  ['get', 'value'],
  ...stops.flat(),
];

const TEMPERATURE_STOPS = [
  [-10, '#313695'],
  [0, '#74add1'],
  [10, '#fee090'],
  [20, '#f46d43'],
  [30, '#a50026'],
] as const;

const WIND_STOPS = [
  [0, '#9ecae1'],
  [6, '#4292c6'],
  [12, '#08519c'],
  [18, '#08306b'],
] as const;

const INSOLATION_STOPS = [
  [3, '#fff7bc'],
  [4.5, '#fec44f'],
  [6, '#d95f0e'],
  [7.5, '#7f2704'],
] as const;

/** Strategy per layer kind: a new kind needs one entry here and a mock generator. */
export const LAYER_STYLES: Readonly<Record<LayerKind, LayerStyle>> = {
  temperature: {
    opacityProperty: 'fill-opacity',
    stops: TEMPERATURE_STOPS,
    unit: '°C',
    create: ({ id, source, opacity }) => ({
      id,
      source,
      type: 'fill',
      paint: {
        'fill-color': colorRamp(TEMPERATURE_STOPS),
        'fill-opacity': opacity,
        'fill-outline-color': 'rgba(0,0,0,0)',
      },
    }),
  },
  wind: {
    opacityProperty: 'line-opacity',
    stops: WIND_STOPS,
    unit: 'м/с',
    create: ({ id, source, opacity }) => ({
      id,
      source,
      type: 'line',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': colorRamp(WIND_STOPS),
        'line-width': 2,
        'line-opacity': opacity,
      },
    }),
  },
  insolation: {
    opacityProperty: 'fill-opacity',
    stops: INSOLATION_STOPS,
    unit: 'кВт·ч/м²',
    create: ({ id, source, opacity }) => ({
      id,
      source,
      type: 'fill',
      paint: {
        'fill-color': colorRamp(INSOLATION_STOPS),
        'fill-opacity': opacity,
        'fill-outline-color': 'rgba(0,0,0,0)',
      },
    }),
  },
};
