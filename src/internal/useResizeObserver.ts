import { useEffect, useRef } from "react";
import { useStableCallback } from "./useStableCallback";

export function useResizeObserver<T extends HTMLElement>(
  onResize: (entry: ResizeObserverEntry) => void,
) {
  const ref = useRef<T>(null);
  const stableOnResize = useStableCallback(onResize);

  useEffect(() => {
    const element = ref.current;

    if (element === null) {
      throw new Error("Ref is not attached to an element");
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
