/**
 * Asserts that a condition is truthy, throwing an error if not.
 *
 * Use this for runtime invariant checking to catch impossible states early.
 * The TypeScript assertion signature narrows the type after the call.
 *
 * @param condition - The condition to check.
 * @param message - Optional error message if the invariant fails.
 * @throws {Error} If the condition is falsy.
 *
 * @example
 * ```ts
 * function getUser(id: string): User | null { ... }
 *
 * const user = getUser(id);
 * invariant(user !== null, `User ${id} not found`);
 * // TypeScript now knows `user` is `User`, not `User | null`
 * user.name; // OK
 * ```
 */
// biome-ignore lint/suspicious/noExplicitAny: for flexibility condition can be any type
export function invariant(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Invariant failed");
  }
}
