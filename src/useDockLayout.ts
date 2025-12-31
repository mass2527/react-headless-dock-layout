import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { assertNever } from "./internal/assertNever";
import { LayoutManager } from "./internal/LayoutManager/LayoutManager";
import type { Direction } from "./internal/LayoutManager/types";
import { useCursor } from "./internal/useCursor";
import { useEventListener } from "./internal/useEventListener";
import { useResizeObserver } from "./internal/useResizeObserver";
import type {
  LayoutManagerOptions,
  LayoutNode,
  LayoutRect,
  PanelLayoutRect,
  SplitLayoutRect,
} from "./types";

export function useDockLayout<T extends HTMLElement>(
  initialRoot: LayoutNode | null,
  options?: LayoutManagerOptions,
) {
  const [layoutManager] = useState(() => {
    return new LayoutManager(initialRoot, options);
  });
  const containerRef = useRef<T>(null);
  const layoutRects = useSyncExternalStore(
    layoutManager.subscribe,
    () => layoutManager.layoutRects,
  );
  const [resizingRect, setResizingRect] = useState<SplitLayoutRect | null>(
    null,
  );
  const [draggingRect, setDraggingRect] = useState<PanelLayoutRect | null>(
    null,
  );
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    direction: Direction;
  } | null>(null);

  useResizeObserver(containerRef, (size) => {
    layoutManager.setSize(size);
  });

  useEventListener(document, "mousemove", (event) => {
    if (resizingRect === null) return;

    layoutManager.resizePanel(resizingRect.id, {
      x: event.clientX,
      y: event.clientY,
    });
  });

  useEventListener(document, "mouseup", () => {
    if (resizingRect === null) return;
    setResizingRect(null);
  });

  useCursor(
    resizingRect === null ? "default" : CURSORS[resizingRect.orientation],
  );

  return {
    containerRef,
    layoutRects,
    getRectProps: (rect: LayoutRect) => {
      if (rect.type === "split") {
        return {
          style: {
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            cursor: CURSORS[rect.orientation],
          },
          onMouseDown: () => {
            setResizingRect(rect);
          },
        } as const;
      } else if (rect.type === "panel") {
        return {
          style: {
            position: "absolute",
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          } as const,
          onMouseMove: (event: ReactMouseEvent<T>) => {
            if (draggingRect === null) {
              return;
            }

            if (draggingRect.id === rect.id) {
              setDropTarget(null);
              return;
            }

            const dropTarget = layoutManager.calculateDropTarget({
              draggedPanelId: draggingRect.id,
              targetPanelId: rect.id,
              point: {
                x: event.clientX,
                y: event.clientY,
              },
            });
            setDropTarget(dropTarget);
          },
          onMouseUp: (event: ReactMouseEvent<T>) => {
            if (draggingRect === null) {
              return;
            }

            if (draggingRect.id === rect.id) {
              setDraggingRect(null);
              setDropTarget(null);
              return;
            }

            layoutManager.movePanel({
              sourceId: draggingRect.id,
              targetId: rect.id,
              point: {
                x: event.clientX,
                y: event.clientY,
              },
            });
            setDraggingRect(null);
            setDropTarget(null);
          },
        } as const;
      } else {
        assertNever(rect);
      }
    },
    getDropZoneProps: (rect: PanelLayoutRect) => {
      if (draggingRect === null) {
        return null;
      }

      const isDropTargetRect = rect.id === dropTarget?.id;
      if (!isDropTargetRect) {
        return null;
      }

      return {
        style: getDropZoneStyle(dropTarget.direction),
      };
    },
    getDragHandleProps: (rect: PanelLayoutRect) => {
      return {
        onMouseDown: () => {
          setDraggingRect(rect);
        },
      };
    },
    draggingRect,
    addPanel: layoutManager.addPanel.bind(layoutManager),
    removePanel: layoutManager.removePanel.bind(layoutManager),
    serialize: layoutManager.serialize.bind(layoutManager),
  };
}

function getDropZoneStyle(direction: Direction) {
  if (direction === "top") {
    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "50%",
    } as const;
  } else if (direction === "bottom") {
    return {
      position: "absolute",
      left: 0,
      top: "50%",
      width: "100%",
      height: "50%",
    } as const;
  } else if (direction === "left") {
    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: "50%",
      height: "100%",
    } as const;
  } else if (direction === "right") {
    return {
      position: "absolute",
      left: "50%",
      top: 0,
      width: "50%",
      height: "100%",
    } as const;
  } else {
    assertNever(direction);
  }
}

const CURSORS: Record<
  SplitLayoutRect["orientation"],
  NonNullable<CSSProperties["cursor"]>
> = {
  horizontal: "col-resize",
  vertical: "row-resize",
};
