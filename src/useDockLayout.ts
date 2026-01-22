import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useState,
  useSyncExternalStore,
} from "react";
import { assertNever } from "./internal/assertNever";
import { LayoutManager } from "./internal/LayoutManager/LayoutManager";
import type { Direction } from "./internal/LayoutManager/types";
import { useCursor } from "./internal/useCursor";
import { useResizeObserver } from "./internal/useResizeObserver";
import type {
  LayoutManagerOptions,
  LayoutNode,
  LayoutRect,
  PanelLayoutRect,
  SplitLayoutRect,
} from "./types";

/**
 * Hook for managing a resizable, draggable dock layout.
 *
 * @param initialRoot - Initial layout tree (`null`, `LayoutNode`, or `() => LayoutNode | null`).
 * @param options - Configuration options (gap, placementStrategy).
 * @returns Layout state and interaction handlers.
 *
 * @example
 * ```tsx
 * const { containerRef, layoutRects, addPanel, removePanel, getRectProps, getDragHandleProps } =
 *   useDockLayout<HTMLDivElement>(null);
 * ```
 */
export function useDockLayout<T extends HTMLElement>(
  initialRoot: LayoutNode | null | (() => LayoutNode | null),
  options?: LayoutManagerOptions,
) {
  const [layoutManager] = useState(() => {
    const root =
      typeof initialRoot === "function" ? initialRoot() : initialRoot;
    return new LayoutManager(root, options);
  });
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

  const containerRef = useResizeObserver<T>((entry) => {
    layoutManager.setSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    });
  });

  useCursor(
    resizingRect === null ? "default" : CURSORS[resizingRect.orientation],
  );

  return {
    /** Ref callback for the container element. Container should have `position: relative`. */
    containerRef,
    /** Array of panel and split bar rectangles with position/size info for rendering. */
    layoutRects,
    /**
     * Returns style and event handlers for a layout rectangle.
     * @param rect - Panel or split bar rectangle.
     */
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
            touchAction: "none",
          },
          onPointerDown: (event: ReactPointerEvent) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setResizingRect(rect);
          },
          onPointerMove: (event: ReactPointerEvent) => {
            if (resizingRect === null) {
              return;
            }

            const container = containerRef.current;

            if (container === null) {
              throw new Error("containerRef is not attached to an element");
            }

            const rect = container.getBoundingClientRect();
            layoutManager.resizePanel(resizingRect.id, {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          },
          onPointerUp: (event: ReactPointerEvent) => {
            if (resizingRect === null) {
              return;
            }

            event.currentTarget.releasePointerCapture(event.pointerId);
            setResizingRect(null);
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
          onPointerMove: (event: ReactPointerEvent<T>) => {
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
          onPointerUp: (event: ReactPointerEvent<T>) => {
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
    /**
     * Returns drop indicator style for a panel during drag. Returns `null` if not a drop target.
     * @param rect - Panel rectangle.
     */
    getDropIndicatorProps: (rect: PanelLayoutRect) => {
      if (draggingRect === null) {
        return null;
      }

      const isDropTargetRect = rect.id === dropTarget?.id;
      if (!isDropTargetRect) {
        return null;
      }

      return {
        style: getDropIndicatorStyle(dropTarget.direction),
      };
    },
    /**
     * Returns props for a drag handle element to initiate panel dragging.
     * @param rect - Panel rectangle.
     */
    getDragHandleProps: (rect: PanelLayoutRect) => {
      return {
        onPointerDown: (event: ReactPointerEvent) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDraggingRect(rect);
        },
        style: {
          touchAction: "none",
        },
      };
    },
    /** Currently dragging panel, or `null`. Use for visual feedback during drag. */
    draggingRect,
    /**
     * Adds a panel using the configured placement strategy.
     * @param id - Unique panel identifier.
     * @throws If target node from strategy is not found.
     */
    addPanel: layoutManager.addPanel.bind(layoutManager),
    /**
     * Removes a panel. Layout tree auto-restructures; becomes `null` if last panel.
     * @param id - Panel ID to remove.
     * @throws If panel not found or root is null.
     */
    removePanel: layoutManager.removePanel.bind(layoutManager),
    /** Current layout tree root. Serialize with `JSON.stringify(root)`. `null` if empty. */
    root: layoutManager.root,
  };
}

function getDropIndicatorStyle(direction: Direction) {
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
