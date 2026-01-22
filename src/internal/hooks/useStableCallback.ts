import { useCallback, useEffect, useRef } from "react";

/**
 * Creates a stable callback reference that always calls the latest version.
 *
 * This hook is useful when you need to pass a callback to a dependency array
 * but want to avoid unnecessary re-renders when the callback changes.
 * The returned function maintains a stable identity while always executing
 * the most recent callback.
 *
 * @param callback - The callback function to stabilize.
 * @returns A stable callback that always invokes the latest version.
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function type requires any for flexible argument types
export function useStableCallback<T extends (...args: any[]) => unknown>(
  callback: T,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args) as ReturnType<T>;
  }, []);
}
