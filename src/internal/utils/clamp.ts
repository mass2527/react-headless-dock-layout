/**
 * Clamps a number within the inclusive range [min, max].
 *
 * @param value - The value to clamp.
 * @param min - The minimum allowed value.
 * @param max - The maximum allowed value.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
