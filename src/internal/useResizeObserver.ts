import { useLayoutEffect, useRef } from "react";
import { useLatestRef } from "./useLatestRef";

export function useResizeObserver<T extends HTMLElement>(
  onResize: (entry: ResizeObserverEntry) => void,
) {
  const ref = useRef<T>(null);
  const latestOnResizeRef = useLatestRef(onResize);

  useLayoutEffect(() => {
    const element = ref.current;

    if (element === null) {
      throw new Error("Ref is not attached to an element");
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        latestOnResizeRef.current(entry);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [latestOnResizeRef]);

  return ref;
}
