import { normalizeOpacity } from './opacity';

describe('normalizeOpacity', () => {
  it.each([
    [0.5, 0.5],
    [-1, 0],
    [2, 1],
    [0.123, 0.12],
    [Number.NaN, 1],
  ])('%s → %s', (input, expected) => {
    expect(normalizeOpacity(input)).toBe(expected);
  });
});
