import { useEffect, useRef } from "react";
import { invariant } from "./invariant";
import { useStableCallback } from "./useStableCallback";

export function useResizeObserver<T extends HTMLElement>(
  onResize: (entry: ResizeObserverEntry) => void,
) {
  const ref = useRef<T>(null);
  const stableOnResize = useStableCallback(onResize);

  useEffect(() => {
    const element = ref.current;
    invariant(
      element !== null,
      "useResizeObserver ref must be attached to an element before effect runs.",
    );

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        stableOnResize(entry);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [stableOnResize]);

  return ref;
}
