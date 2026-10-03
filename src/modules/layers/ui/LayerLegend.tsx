import { memo } from 'react';
import styled from 'styled-components';
import type { LayerKind } from '../domain/types';
import { LAYER_STYLES } from '../map/layerStyles';

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Ramp = styled.span<{ $gradient: string }>`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, ${({ $gradient }) => $gradient});
`;

export const LayerLegend = memo(function LayerLegend({ kind }: { readonly kind: LayerKind }) {
  const { stops, unit } = LAYER_STYLES[kind];
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) return null;

  return (
    <Legend aria-hidden="true">
      <span>{first[0]}</span>
      <Ramp $gradient={stops.map(([, color]) => color).join(', ')} />
      <span>
        {last[0]} {unit}
      </span>
    </Legend>
  );
});
