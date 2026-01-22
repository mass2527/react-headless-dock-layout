/**
 * Runtime assertion for impossible states.
 * Throws an error if condition is false.
 */
export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violation: ${message}`);
  }
}
