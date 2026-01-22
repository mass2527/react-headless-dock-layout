import { useCallback, useRef } from "react";

interface Size {
  width: number;
  height: number;
}

/**
 * Hook that observes an element's size and calls a callback on changes.
 * Returns a ref callback to attach to the target element.
 */
export function useResizeObserver(
  onResize: (size: Size) => void
): (element: HTMLElement | null) => void {
  const observerRef = useRef<ResizeObserver | null>(null);

  const refCallback = useCallback(
    (element: HTMLElement | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!element) return;

      // Create new observer
      observerRef.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          onResize({ width, height });
        }
      });

      observerRef.current.observe(element);

      // Immediate size report
      const rect = element.getBoundingClientRect();
      onResize({ width: rect.width, height: rect.height });
    },
    [onResize]
  );

  return refCallback;
}
