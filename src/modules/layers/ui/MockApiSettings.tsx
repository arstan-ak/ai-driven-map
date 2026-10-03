import { memo, useState } from 'react';
import styled from 'styled-components';
import type { MockLayersApi } from '../api/mockLayersApi';

const Details = styled.details`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;

  summary {
    cursor: pointer;
    font-weight: 600;
  }
`;

const Field = styled.label`
  display: grid;
  grid-template-columns: 11ch 1fr 5ch;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.muted};
`;

/** Dev panel to provoke errors and slow responses. Local state: it is not app state. */
export const MockApiSettings = memo(function MockApiSettings({
  api,
}: {
  readonly api: MockLayersApi;
}) {
  const [settings, setSettings] = useState(() => api.getSettings());

  const update = (patch: Parameters<MockLayersApi['configure']>[0]) => {
    api.configure(patch);
    setSettings(api.getSettings());
  };

  return (
    <Details>
      <summary>Mock API</summary>
      <Field>
        Ошибки
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(settings.failureRate * 100)}
          onChange={(event) => {
            update({ failureRate: event.currentTarget.valueAsNumber / 100 });
          }}
        />
        <output>{Math.round(settings.failureRate * 100)}%</output>
      </Field>
      <Field>
        Макс. задержка
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={settings.maxLatencyMs}
          onChange={(event) => {
            const maxLatencyMs = event.currentTarget.valueAsNumber;
            update({ maxLatencyMs, minLatencyMs: Math.min(settings.minLatencyMs, maxLatencyMs) });
          }}
        />
        <output>{(settings.maxLatencyMs / 1000).toFixed(1)}с</output>
      </Field>
    </Details>
  );
});
