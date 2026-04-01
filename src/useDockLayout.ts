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
 * Headless hook that turns a `LayoutNode` tree into pixel-precise rectangles and
 * wires up pointer interactions for resizing and drag-and-drop.
 *
 * The hook is style-agnostic: it produces absolute-positioned `style` objects and
 * event handlers via prop-getter functions (`getRectProps`, `getDragHandleProps`,
 * `getDropIndicatorProps`). Consumers are responsible for rendering the actual
 * panel content and visual chrome.
 *
 * @typeParam T - The HTML element type of the container (e.g., `HTMLDivElement`).
 *
 * @param initialRoot - The starting layout tree. Pass `null` for an empty layout,
 *   or a function for lazy initialization (evaluated once on mount).
 * @param options - See {@link LayoutManagerOptions}.
 *
 * @example
 * ```tsx
 * const { containerRef, layoutRects, addPanel, removePanel, getRectProps, getDragHandleProps }
 *   = useDockLayout<HTMLDivElement>(null);
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
    /**
     * Attach to the element that wraps all panels. Must have `position: relative`.
     * The layout recalculates automatically when this element resizes.
     */
    containerRef,
    /**
     * Flat list of every rectangle (panels + split bars) computed from the current
     * tree and container size. Re-renders only when the layout actually changes.
     */
    layoutRects,
    /**
     * Prop getter that returns absolute-position `style` and pointer-event handlers
     * for a layout rectangle. Spread the result onto the element that represents
     * each panel or split bar.
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

            const direction = layoutManager.getDropDirection({
              panelId: rect.id,
              point: {
                x: event.clientX,
                y: event.clientY,
              },
            });
            setDropTarget({ id: rect.id, direction });
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

            const direction = layoutManager.getDropDirection({
              panelId: rect.id,
              point: {
                x: event.clientX,
                y: event.clientY,
              },
            });
            layoutManager.movePanel({
              sourceId: draggingRect.id,
              targetId: rect.id,
              direction,
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
     * Prop getter for rendering a visual drop preview on a target panel while a
     * drag is in progress. Returns positioning `style` that covers the half of the
     * panel where the drop would land, or `null` when this panel is not the
     * current drop target.
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
     * Prop getter for the element that initiates a panel drag (e.g., a title bar).
     * Spread the returned `onPointerDown` and `style` onto that element.
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
    /**
     * The panel currently being dragged, or `null` when idle.
     * Useful for applying visual feedback (e.g., reduced opacity) to the source panel.
     */
    draggingRect,
    /**
     * Inserts a panel into the layout. Placement is determined by the active
     * `PlacementStrategy`. If the layout is empty, the panel becomes the root.
     *
     * @param id - Must be unique across all existing panel ids.
     */
    addPanel: layoutManager.addPanel.bind(layoutManager),
    /**
     * Removes a panel and collapses its parent split so the sibling fills the
     * vacated space. Removing the last panel sets `root` to `null`.
     */
    removePanel: layoutManager.removePanel.bind(layoutManager),
    /**
     * The live layout tree. Serialize this (e.g., with `JSON.stringify`) to
     * persist and later restore a layout via `initialRoot`.
     */
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
