import { useCallback, useRef } from "react";

/**
 * Returns a stable callback that always invokes the latest version of fn.
 * Useful for avoiding stale closures in event handlers.
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(
  fn: T
): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    ((...args: Parameters<T>) => fnRef.current(...args)) as T,
    []
  );
}
