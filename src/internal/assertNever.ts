/**
 * Ensures exhaustive handling of all union members.
 * If TypeScript complains, you've missed a case.
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
