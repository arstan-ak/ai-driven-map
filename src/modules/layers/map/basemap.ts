import type { StyleSpecification } from 'maplibre-gl';

/**
 * Inline raster style: no API key, and the map's `load` event fires even if basemap
 * tiles fail to download, so data layers still work offline.
 */
export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      // Public OSM tiles: no API key needed (CARTO basemaps now require one).
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'basemap',
      type: 'raster',
      source: 'basemap',
      // Muted basemap so the coloured data layers stay readable on top of it.
      paint: { 'raster-saturation': -0.8, 'raster-brightness-min': 0.15 },
    },
  ],
};

interface InitialView {
  readonly center: [lng: number, lat: number];
  readonly zoom: number;
}

export const INITIAL_VIEW: InitialView = { center: [74.8, 41.3], zoom: 5.2 };
