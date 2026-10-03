import type { LayerStatus } from '@/modules/layers';

export const theme = {
  colors: {
    background: '#f4f5f7',
    surface: '#ffffff',
    text: '#1d2330',
    muted: '#5b6475',
    border: '#e2e5eb',
    accent: '#2b6cb0',
  },
  status: {
    idle: { fg: '#5b6475', bg: '#eef0f3' },
    loading: { fg: '#8a5a00', bg: '#fff3d6' },
    success: { fg: '#1f6f43', bg: '#dcf5e7' },
    error: { fg: '#b42318', bg: '#fde4e1' },
  } satisfies Record<LayerStatus, { fg: string; bg: string }>,
} as const;

export type AppTheme = typeof theme;
