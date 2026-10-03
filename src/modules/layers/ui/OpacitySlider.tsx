import { memo } from 'react';
import styled from 'styled-components';
import type { LayerId } from '../domain/types';
import { useLayerSelector, useLayersController } from '../store/hooks';
import { selectOpacity } from '../store/selectors';

const Wrapper = styled.label`
  display: grid;
  grid-template-columns: auto 1fr 3.5ch;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Value = styled.output`
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

interface OpacitySliderProps {
  readonly id: LayerId;
  readonly title: string;
}

export const OpacitySlider = memo(function OpacitySlider({ id, title }: OpacitySliderProps) {
  const opacity = useLayerSelector(id, selectOpacity);
  const controller = useLayersController();
  const percent = Math.round(opacity * 100);

  return (
    <Wrapper>
      Прозрачность
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        aria-label={`Непрозрачность слоя «${title}»`}
        onChange={(event) => {
          controller.setOpacity(id, event.currentTarget.valueAsNumber / 100);
        }}
      />
      <Value>{percent}%</Value>
    </Wrapper>
  );
});
