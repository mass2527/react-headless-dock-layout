/**
 * Error handling and assertion utilities.
 *
 * These utilities help ensure code correctness at runtime:
 * - assertNever: Exhaustiveness checking for discriminated unions
 * - invariant: Runtime assertion with TypeScript type narrowing
 */
export { assertNever } from "./assertNever";
export { invariant } from "./invariant";
