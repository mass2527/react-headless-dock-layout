/**
 * Generates a unique ID for split nodes.
 * Uses a counter + random suffix for uniqueness.
 */
let counter = 0;

export function generateId(): string {
  return `split-${++counter}-${Math.random().toString(36).substring(2, 9)}`;
}
