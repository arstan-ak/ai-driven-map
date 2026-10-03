import { memo } from 'react';
import styled from 'styled-components';
import type { LayerId, LayerStatus as Status } from '../domain/types';
import { useLayerSelector, useLayersController } from '../store/hooks';
import { selectRequest } from '../store/selectors';

const STATUS_LABELS: Readonly<Record<Status, string>> = {
  idle: 'выключен',
  loading: 'загрузка…',
  success: 'загружен',
  error: 'ошибка',
};

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  font-size: 13px;
`;

const Badge = styled.span<{ $status: Status }>`
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  color: ${({ theme, $status }) => theme.status[$status].fg};
  background: ${({ theme, $status }) => theme.status[$status].bg};
`;

const ErrorText = styled.span`
  flex-basis: 100%;
  color: ${({ theme }) => theme.status.error.fg};
`;

const RetryButton = styled.button`
  padding: 2px 10px;
  border: 1px solid currentColor;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  font: inherit;
  cursor: pointer;
`;

interface LayerStatusProps {
  readonly id: LayerId;
  readonly title: string;
}

export const LayerStatus = memo(function LayerStatus({ id, title }: LayerStatusProps) {
  const request = useLayerSelector(id, selectRequest);
  const controller = useLayersController();

  return (
    <Row role="status" aria-live="polite" aria-label={`Статус слоя «${title}»`}>
      <Badge $status={request.status}>{STATUS_LABELS[request.status]}</Badge>
      {request.status === 'error' && (
        <>
          <RetryButton
            type="button"
            onClick={() => {
              controller.retry(id);
            }}
          >
            Повторить
          </RetryButton>
          <ErrorText>{request.message}</ErrorText>
        </>
      )}
    </Row>
  );
});
