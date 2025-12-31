import { type CSSProperties, useEffect } from "react";

export function useCursor(cursor: CSSProperties["cursor"]) {
  useEffect(() => {
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = cursor ?? "default";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [cursor]);
}
