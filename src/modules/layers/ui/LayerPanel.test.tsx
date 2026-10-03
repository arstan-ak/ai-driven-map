import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler, type ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/shared/ui/theme';
import { createDeferredApi, flushPromises } from '@/test/deferredApi';
import {
  createLayerRegistry,
  createSyntheticLayers,
  DEFAULT_LAYERS,
  type LayerRegistry,
} from '../domain/registry';
import { LayersProvider } from '../store/LayersProvider';
import { LayerPanel } from './LayerPanel';
import { LayerRow } from './LayerRow';

function renderWithProviders(ui: ReactNode, registry: LayerRegistry) {
  const deferred = createDeferredApi();
  const result = render(
    <ThemeProvider theme={theme}>
      <LayersProvider registry={registry} api={deferred.api}>
        {ui}
      </LayersProvider>
    </ThemeProvider>,
  );
  return { ...result, ...deferred };
}

const statusOf = (title: string) => screen.getByRole('status', { name: `Статус слоя «${title}»` });

describe('LayerPanel', () => {
  it('toggles a layer, shows loading and then success', async () => {
    const user = userEvent.setup();
    const { last } = renderWithProviders(<LayerPanel />, createLayerRegistry(DEFAULT_LAYERS));

    await user.click(screen.getByRole('checkbox', { name: 'Температура' }));
    expect(statusOf('Температура')).toHaveTextContent('загрузка');
    expect(screen.getByTestId('layers-summary')).toHaveTextContent('Включено 1 из 3');

    await act(async () => {
      last('temperature').resolve();
      await flushPromises();
    });
    expect(statusOf('Температура')).toHaveTextContent('загружен');
  });

  it('shows the error and lets the user retry', async () => {
    const user = userEvent.setup();
    const { last, requests } = renderWithProviders(
      <LayerPanel />,
      createLayerRegistry(DEFAULT_LAYERS),
    );

    await user.click(screen.getByRole('checkbox', { name: 'Ветер' }));
    await act(async () => {
      last('wind').reject(new Error('Сервер недоступен'));
      await flushPromises();
    });

    const status = statusOf('Ветер');
    expect(status).toHaveTextContent('ошибка');
    expect(status).toHaveTextContent('Сервер недоступен');

    await user.click(within(status).getByRole('button', { name: 'Повторить' }));
    expect(requests).toHaveLength(2);
    expect(statusOf('Ветер')).toHaveTextContent('загрузка');
  });

  it('changes opacity through the slider', async () => {
    renderWithProviders(<LayerPanel />, createLayerRegistry(DEFAULT_LAYERS));
    const slider = screen.getByRole('slider', { name: 'Непрозрачность слоя «Инсоляция»' });

    // jsdom has no layout for range inputs, so set the value directly.
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(slider, '25');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      await flushPromises();
    });

    expect(slider).toHaveValue('25');
    expect(within(slider.parentElement ?? document.body).getByText('25%')).toBeInTheDocument();
  });
});

describe('re-render isolation', () => {
  it('with 150 layers, toggling one layer re-renders only that row', async () => {
    const user = userEvent.setup();
    const registry = createLayerRegistry([...DEFAULT_LAYERS, ...createSyntheticLayers(147)]);
    const commits = new Map<string, number>();
    const onRender = (id: string) => {
      commits.set(id, (commits.get(id) ?? 0) + 1);
    };

    const { last } = renderWithProviders(
      <ul>
        {registry.layers.map((layer) => (
          <Profiler key={layer.id} id={layer.id} onRender={onRender}>
            <LayerRow layer={layer} />
          </Profiler>
        ))}
      </ul>,
      registry,
    );
    commits.clear();

    await user.click(screen.getByRole('checkbox', { name: 'Ветер' }));
    await act(async () => {
      last('wind').resolve();
      await flushPromises();
    });

    expect([...commits.keys()]).toEqual(['wind']);
  });

  it('moving the opacity slider does not re-render the toggle or the status', async () => {
    const registry = createLayerRegistry(DEFAULT_LAYERS);
    const commits: string[] = [];
    const track = (id: string) => {
      commits.push(id);
    };
    const { OpacitySlider } = await import('./OpacitySlider');
    const { LayerToggle } = await import('./LayerToggle');
    const { LayerStatus } = await import('./LayerStatus');

    renderWithProviders(
      <>
        <Profiler id="toggle" onRender={track}>
          <LayerToggle id="wind" title="Ветер" />
        </Profiler>
        <Profiler id="slider" onRender={track}>
          <OpacitySlider id="wind" title="Ветер" />
        </Profiler>
        <Profiler id="status" onRender={track}>
          <LayerStatus id="wind" title="Ветер" />
        </Profiler>
      </>,
      registry,
    );
    commits.length = 0;

    const slider = screen.getByRole('slider');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(slider, '10');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      await flushPromises();
    });

    expect(commits).toEqual(['slider']);
  });
});
