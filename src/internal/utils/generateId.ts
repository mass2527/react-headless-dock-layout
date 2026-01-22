/**
 * Generates a unique identifier string.
 *
 * Uses crypto.randomUUID() when available (modern browsers/Node.js),
 * falls back to timestamp-based ID for older environments.
 *
 * @returns A unique identifier string.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36);
}
