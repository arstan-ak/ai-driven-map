export const MIN_OPACITY = 0;
export const MAX_OPACITY = 1;

/** Clamps to [0, 1] and rounds to 2 decimals so equal visual values compare equal. */
export function normalizeOpacity(value: number): number {
  if (Number.isNaN(value)) return MAX_OPACITY;
  const clamped = Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, value));
  return Math.round(clamped * 100) / 100;
}
