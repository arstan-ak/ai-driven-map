import { lazy, Suspense, useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import {
  createMockLayersApi,
  DEFAULT_LAYERS,
  LayerPanel,
  LayersProvider,
  MockApiSettings,
} from '@/modules/layers';
import { theme } from '@/shared/ui/theme';
import { createRegistryFromUrl } from './config';
import { GlobalStyle } from './GlobalStyle';

// MapLibre is ~1 MB: load it separately so the panel is interactive immediately. This is the
// only deep import into the module — re-exporting MapView from index.ts would defeat the split.
const MapView = lazy(() => import('@/modules/layers/map/MapView'));

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 360px) 1fr;
  grid-template-rows: 100%;
  height: 100%;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    grid-template-rows: 45vh 1fr;
  }
`;

const Sidebar = styled.aside`
  overflow-y: auto;
  background: ${({ theme: t }) => t.colors.surface};
  border-right: 1px solid ${({ theme: t }) => t.colors.border};

  @media (max-width: 720px) {
    order: 2;
    border-right: none;
  }
`;

const MapArea = styled.main`
  min-height: 0;
  height: 100%;
`;

const Hint = styled.p`
  margin: 0;
  padding: 12px 16px;
  font-size: 12px;
  color: ${({ theme: t }) => t.colors.muted};

  a {
    color: ${({ theme: t }) => t.colors.accent};
  }
`;

export function App() {
  const [registry] = useState(() => createRegistryFromUrl(window.location.search));
  const [api] = useState(() => createMockLayersApi({ registry }));
  const isStress = registry.layers.length > DEFAULT_LAYERS.length;

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <LayersProvider registry={registry} api={api}>
        <Layout>
          <Sidebar>
            <LayerPanel />
            <MockApiSettings api={api} />
            <Hint>
              {isStress ? (
                <a href="?">Вернуться к 3 слоям</a>
              ) : (
                <a href="?layers=150">Стресс-режим: 150 слоёв</a>
              )}
            </Hint>
          </Sidebar>
          <MapArea>
            <Suspense fallback={null}>
              <MapView />
            </Suspense>
          </MapArea>
        </Layout>
      </LayersProvider>
    </ThemeProvider>
  );
}
