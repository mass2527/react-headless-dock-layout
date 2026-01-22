import { useEffect, useRef } from "react";
import { useStableCallback } from "./useStableCallback";

export function useResizeObserver<T extends HTMLElement>(
  onResize: (entry: ResizeObserverEntry) => void,
) {
  const ref = useRef<T>(null);
  const stableOnResize = useStableCallback(onResize);

  useEffect(() => {
    const element = ref.current;

    // Gracefully handle case where ref is not yet attached
    // This can happen during testing or when the element is conditionally rendered
    if (element === null) {
      return;
    }

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
