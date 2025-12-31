// biome-ignore lint/suspicious/noExplicitAny: for flexibility condition can be any type
export function invariant(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Invariant failed");
  }
}
