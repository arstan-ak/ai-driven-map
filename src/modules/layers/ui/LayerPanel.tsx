import { memo } from 'react';
import styled from 'styled-components';
import { useLayerRegistry } from '../store/hooks';
import { BulkActions } from './BulkActions';
import { LayerRow } from './LayerRow';
import { LayersSummaryBar } from './LayersSummaryBar';

const Header = styled.header`
  display: grid;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const LayerPanel = memo(function LayerPanel() {
  const { layers } = useLayerRegistry();

  return (
    <section aria-label="Слои карты">
      <Header>
        <div>
          <Title>Слои</Title>
          <LayersSummaryBar />
        </div>
        <BulkActions />
      </Header>
      <List>
        {layers.map((layer) => (
          <LayerRow key={layer.id} layer={layer} />
        ))}
      </List>
    </section>
  );
});
