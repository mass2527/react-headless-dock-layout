import { useEffect, useRef } from "react";
import { useStableCallback } from "./useStableCallback";

/**
 * Observes element size changes using ResizeObserver.
 *
 * Returns a ref that should be attached to the element you want to observe.
 * The callback is invoked whenever the element's size changes.
 *
 * @param onResize - Callback fired when the observed element resizes.
 * @returns A ref to attach to the element to observe.
 * @throws {Error} If the ref is not attached to an element when the effect runs.
 */
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
