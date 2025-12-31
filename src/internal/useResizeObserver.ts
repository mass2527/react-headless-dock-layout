import { type RefObject, useLayoutEffect } from "react";
import { useLatestRef } from "./useLatestRef";

export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onResize: (size: { width: number; height: number }) => void,
) {
  const latestOnResizeRef = useLatestRef(onResize);

  useLayoutEffect(() => {
    const element = ref.current;

    if (element === null) {
      throw new Error("Ref is not attached to an element");
    }

    latestOnResizeRef.current({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        latestOnResizeRef.current({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref, latestOnResizeRef]);
}
