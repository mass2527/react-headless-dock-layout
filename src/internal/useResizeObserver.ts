import { type RefObject, useLayoutEffect, useRef } from "react";

export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onResize: (size: { width: number; height: number }) => void,
) {
  const onResizeRef = useRef(onResize);

  useLayoutEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    onResizeRef.current({
      width: element.clientWidth,
      height: element.clientHeight,
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onResizeRef.current({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);
}
