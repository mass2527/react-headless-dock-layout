import { type CSSProperties, useEffect } from "react";

/**
 * Temporarily sets the document body cursor style.
 *
 * When the cursor value changes or the component unmounts,
 * the previous cursor style is restored.
 *
 * @param cursor - CSS cursor value to apply to the document body.
 */
export function useCursor(cursor: CSSProperties["cursor"]) {
  useEffect(() => {
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = cursor ?? "default";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [cursor]);
}
