import { useCallback, useEffect, useRef } from "react";

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
