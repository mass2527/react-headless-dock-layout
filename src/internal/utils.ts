export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

// biome-ignore lint/suspicious/noExplicitAny: for flexibility condition can be any type
export function invariant(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Invariant failed");
  }
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36);
}
