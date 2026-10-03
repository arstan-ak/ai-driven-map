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
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
};

interface InitialView {
  readonly center: [lng: number, lat: number];
  readonly zoom: number;
}

export const INITIAL_VIEW: InitialView = { center: [74.8, 41.3], zoom: 5.2 };
