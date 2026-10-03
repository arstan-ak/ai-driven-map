import { memo } from 'react';
import styled from 'styled-components';
import type { LayerId } from '../domain/types';
import { useLayerSelector, useLayersController } from '../store/hooks';
import { selectEnabled } from '../store/selectors';

const Label = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
`;

interface LayerToggleProps {
  readonly id: LayerId;
  readonly title: string;
}

export const LayerToggle = memo(function LayerToggle({ id, title }: LayerToggleProps) {
  const enabled = useLayerSelector(id, selectEnabled);
  const controller = useLayersController();

  return (
    <Label>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          controller.setEnabled(id, event.currentTarget.checked);
        }}
      />
      {title}
    </Label>
  );
});
