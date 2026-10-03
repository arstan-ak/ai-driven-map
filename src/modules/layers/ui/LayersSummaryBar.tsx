import styled from 'styled-components';
import { useLayersSummary } from '../store/hooks';

const Bar = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
`;

export function LayersSummaryBar() {
  const { total, enabled, loading, failed } = useLayersSummary();
  return (
    <Bar aria-live="polite" data-testid="layers-summary">
      Включено {enabled} из {total} · загружается {loading} · ошибок {failed}
    </Bar>
  );
}
