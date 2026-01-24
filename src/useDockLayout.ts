import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useState,
  useSyncExternalStore,
} from "react";
import { assertNever } from "./internal/assertNever";
import { invariant } from "./internal/invariant";
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
 * Main hook for managing a dock layout.
 *
 * This hook provides all the necessary state and functions to create and manage
 * a resizable, draggable dock layout system. It handles panel addition/removal,
 * drag-and-drop, and resize operations.
 *
 * @param initialRoot - Initial layout tree root node. Can be:
 *   - `null` for an empty layout
 *   - A `LayoutNode` object
 *   - A function that returns `LayoutNode | null` (useful for lazy initialization)
 * @param options - Optional configuration for the layout manager.
 * @returns An object containing layout state and helper functions.
 *
 * @example
 * ```tsx
 * // Start with an empty layout
 * const {
 *   containerRef,
 *   layoutRects,
 *   addPanel,
 *   removePanel,
 *   getRectProps,
 *   getDragHandleProps,
 * } = useDockLayout<HTMLDivElement>(null);
 * ```
 *
 * @example
 * ```tsx
 * // Load initial layout from localStorage
 * const {
 *   containerRef,
 *   layoutRects,
 *   addPanel,
 *   removePanel,
 *   getRectProps,
 *   getDragHandleProps,
 * } = useDockLayout<HTMLDivElement>(() => {
 *   const saved = localStorage.getItem("layout");
 *   if (saved === null) {
 *     return null;
 *   }
 *   return JSON.parse(saved);
 * });
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
     * Ref callback that must be attached to the container element.
     * The container should have `position: relative` styling.
     * The layout will automatically resize when the container size changes.
     */
    containerRef,
    /**
     * Array of layout rectangles representing all panels and split bars.
     * Each rectangle contains position, size, and type information.
     * Use this to render your panels and split bars.
     */
    layoutRects,
    /**
     * Returns props (style and event handlers) for a given layout rectangle.
     * For split bars, returns style with cursor and pointer event handlers for resizing.
     * For panels, returns style and pointer event handlers for drag-and-drop.
     *
     * @param rect - The layout rectangle to get props for.
     * @returns An object with `style` and event handler props.
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
            invariant(
              container !== null,
              "containerRef must be attached to a DOM element to handle pointer events.",
            );

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
     * Returns props for rendering a drop indicator overlay on a panel.
     * The drop indicator shows where a dragged panel will be placed.
     * Returns `null` if no panel is being dragged or if this panel is not the drop target.
     *
     * @param rect - The panel layout rectangle to get drop indicator props for.
     * @returns An object with `style` for the drop indicator, or `null` if not applicable.
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
     * Returns props for a drag handle element.
     * Attach these props to a button or element that users can drag to move panels.
     *
     * @param rect - The panel layout rectangle to get drag handle props for.
     * @returns An object with `onPointerDown` handler and `style` that initiates dragging.
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
     * The currently dragging panel rectangle, or `null` if no panel is being dragged.
     * Use this to apply visual feedback (e.g., reduce opacity) to the dragging panel.
     */
    draggingRect,
    /**
     * Adds a new panel to the layout.
     * The panel will be placed according to the configured placement strategy.
     *
     * @param id - Unique identifier for the new panel.
     * @throws {Error} If the target node with the ID returned by the placement strategy is not found in the layout tree.
     */
    addPanel: layoutManager.addPanel.bind(layoutManager),
    /**
     * Removes a panel from the layout.
     * If it's the last panel, the layout becomes empty (root becomes `null`).
     * The layout tree is automatically restructured to remove empty splits.
     *
     * @param id - The ID of the panel to remove.
     * @throws {Error} If the panel is not found or if the root is null.
     */
    removePanel: layoutManager.removePanel.bind(layoutManager),
    /**
     * The current root node of the layout tree.
     * Use this to serialize the layout state (e.g., `JSON.stringify(root)`).
     * Can be `null` if the layout is empty.
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
