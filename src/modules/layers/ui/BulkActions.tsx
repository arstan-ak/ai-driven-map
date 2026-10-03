import { memo } from 'react';
import styled from 'styled-components';
import { Button } from '@/shared/ui/Button';
import { useLayersController } from '../store/hooks';

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const BulkActions = memo(function BulkActions() {
  const controller = useLayersController();
  return (
    <Actions>
      <Button
        type="button"
        onClick={() => {
          controller.setAllEnabled(true);
        }}
      >
        Включить все
      </Button>
      <Button
        type="button"
        onClick={() => {
          controller.setAllEnabled(false);
        }}
      >
        Выключить все
      </Button>
      <Button
        type="button"
        onClick={() => {
          controller.retryFailed();
        }}
      >
        Повторить ошибки
      </Button>
    </Actions>
  );
});
