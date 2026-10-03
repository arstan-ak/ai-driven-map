import type {
  Feature as GeoFeature,
  FeatureCollection as GeoFeatureCollection,
  Polygon,
} from 'geojson';
import type { RandomSource } from '@/shared/lib/random';
import type { LayerFeatureProperties, LayerGeometry, LayerKind } from '../domain/types';

type Feature = GeoFeature<LayerGeometry, LayerFeatureProperties>;
type FeatureCollection = GeoFeatureCollection<LayerGeometry, LayerFeatureProperties>;

interface Bounds {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/** Central Asia around Kyrgyzstan. */
export const MOCK_BOUNDS: Bounds = { west: 68, south: 38.5, east: 82, north: 44 };

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function cellPolygon(lon: number, lat: number, size: number): Polygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lon, lat],
        [lon + size, lat],
        [lon + size, lat + size],
        [lon, lat + size],
        [lon, lat],
      ],
    ],
  };
}

function* gridCells(
  size: number,
  bounds: Bounds = MOCK_BOUNDS,
): Generator<{ lon: number; lat: number }> {
  for (let lat = bounds.south; lat < bounds.north; lat += size) {
    for (let lon = bounds.west; lon < bounds.east; lon += size) {
      yield { lon, lat };
    }
  }
}

/** Smooth pseudo-relief so neighbouring cells look related, plus a bit of noise. */
function relief(lon: number, lat: number): number {
  return Math.sin(lon * 0.9) * Math.cos(lat * 1.3) + Math.sin((lon + lat) * 0.45);
}

function temperature(random: RandomSource): FeatureCollection {
  const size = 0.5;
  const features: Feature[] = [];
  for (const { lon, lat } of gridCells(size)) {
    const value = 34 - (lat - MOCK_BOUNDS.south) * 2.2 - relief(lon, lat) * 7 + random() * 3;
    features.push({
      type: 'Feature',
      geometry: cellPolygon(lon, lat, size),
      properties: { value: round(value) },
    });
  }
  return { type: 'FeatureCollection', features };
}

function insolation(random: RandomSource): FeatureCollection {
  const size = 0.5;
  const features: Feature[] = [];
  for (const { lon, lat } of gridCells(size)) {
    const value = 6.5 - (lat - MOCK_BOUNDS.south) * 0.35 + relief(lon, lat) * 0.6 + random() * 0.4;
    features.push({
      type: 'Feature',
      geometry: cellPolygon(lon, lat, size),
      properties: { value: round(Math.max(0, value), 2) },
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Wind as short segments pointing downwind; length is proportional to speed. */
function wind(random: RandomSource): FeatureCollection {
  const step = 0.75;
  const features: Feature[] = [];
  for (const { lon, lat } of gridCells(step)) {
    const speed = 2 + Math.abs(relief(lon, lat)) * 6 + random() * 4;
    const direction = (relief(lat, lon) + 1) * Math.PI + random() * 0.6;
    const length = 0.04 * speed;
    const x = lon + step / 2;
    const y = lat + step / 2;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [x, y],
          [x + Math.cos(direction) * length, y + Math.sin(direction) * length],
        ],
      },
      properties: { value: round(speed) },
    });
  }
  return { type: 'FeatureCollection', features };
}

const GENERATORS: Readonly<Record<LayerKind, (random: RandomSource) => FeatureCollection>> = {
  temperature,
  wind,
  insolation,
};

export function generateLayerGeoJson(kind: LayerKind, random: RandomSource): FeatureCollection {
  return GENERATORS[kind](random);
}
