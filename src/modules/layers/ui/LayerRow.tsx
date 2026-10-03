import { memo } from 'react';
import styled from 'styled-components';
import type { LayerDefinition } from '../domain/types';
import { LayerLegend } from './LayerLegend';
import { LayerStatus } from './LayerStatus';
import { LayerToggle } from './LayerToggle';
import { OpacitySlider } from './OpacitySlider';

const Item = styled.li`
  display: grid;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

interface LayerRowProps {
  readonly layer: LayerDefinition;
}

/**
 * The row itself subscribes to nothing, so it never re-renders after mount. Each child
 * subscribes to exactly one field of one layer: moving the opacity slider re-renders only
 * that slider.
 */
export const LayerRow = memo(function LayerRow({ layer }: LayerRowProps) {
  return (
    <Item data-layer-id={layer.id}>
      <LayerToggle id={layer.id} title={layer.title} />
      <LayerLegend kind={layer.kind} />
      <OpacitySlider id={layer.id} title={layer.title} />
      <LayerStatus id={layer.id} title={layer.title} />
    </Item>
  );
});
