/**
 * Asserts that a value is never reached (exhaustiveness check).
 *
 * Use this in switch/if-else statements with discriminated unions to ensure
 * all cases are handled. TypeScript will error at compile time if a case is missed.
 *
 * @param value - The value that should never be reached.
 * @throws {Error} Always throws with a message containing the unexpected value.
 *
 * @example
 * ```ts
 * type Shape = { type: 'circle' } | { type: 'square' };
 *
 * function getArea(shape: Shape) {
 *   if (shape.type === 'circle') return Math.PI;
 *   if (shape.type === 'square') return 1;
 *   assertNever(shape); // TypeScript error if we add a new shape type
 * }
 * ```
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}
