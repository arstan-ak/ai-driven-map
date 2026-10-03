import 'maplibre-gl/dist/maplibre-gl.css';
import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl';
// MapLibre v6 resolves its worker relative to its own module, which breaks after bundling.
// Let Vite bundle the worker (with its shared chunk) and hand MapLibre the final URL.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useLayersRuntime } from '../store/hooks';
import { BASEMAP_STYLE, INITIAL_VIEW } from './basemap';
import { bindLayersToMap } from './bindLayersToMap';

setWorkerUrl(maplibreWorkerUrl);

// Sized explicitly: maplibre-gl.css sets `position: relative` on the container.
const Container = styled.div`
  width: 100%;
  height: 100%;
`;

/**
 * Renders exactly once. All further updates flow store → map imperatively through
 * `bindLayersToMap`, bypassing React reconciliation.
 */
export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { store, registry, cache } = useLayersRuntime();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MapLibreMap({
      container,
      style: BASEMAP_STYLE,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    let unbind: (() => void) | undefined;
    map.once('load', () => {
      unbind = bindLayersToMap({ map, store, registry, cache });
    });

    return () => {
      unbind?.();
      map.remove();
    };
  }, [store, registry, cache]);

  return <Container ref={containerRef} data-testid="map" />;
}
