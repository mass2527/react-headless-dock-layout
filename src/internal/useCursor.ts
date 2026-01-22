import { useEffect, useRef } from "react";

type CursorType = "col-resize" | "row-resize" | "grabbing" | null;

/**
 * Hook that manages document cursor style during drag operations.
 */
export function useCursor(): {
  setCursor: (cursor: CursorType) => void;
} {
  const previousCursorRef = useRef<string>("");

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (previousCursorRef.current) {
        document.body.style.cursor = previousCursorRef.current;
      }
    };
  }, []);

  const setCursor = (cursor: CursorType) => {
    if (cursor) {
      if (!previousCursorRef.current) {
        previousCursorRef.current = document.body.style.cursor;
      }
      document.body.style.cursor = cursor;
    } else {
      document.body.style.cursor = previousCursorRef.current;
      previousCursorRef.current = "";
    }
  };

  return { setCursor };
}
