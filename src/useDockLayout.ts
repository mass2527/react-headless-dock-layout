import {
  useSyncExternalStore,
  useRef,
  useCallback,
  useState,
  type RefCallback,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
} from "react";
import type {
  LayoutNode,
  LayoutRect,
  PanelLayoutRect,
  SplitLayoutRect,
  LayoutManagerOptions,
  DropDirection,
  MinSize,
} from "./types";
import { LayoutManager } from "./internal/LayoutManager/LayoutManager";
import { useResizeObserver } from "./internal/useResizeObserver";
import { useStableCallback } from "./internal/useStableCallback";
import { useCursor } from "./internal/useCursor";
import {
  findClosestDirection,
  getDropIndicatorRect,
} from "./internal/LayoutManager/findClosestDirection";

// === Types ===

interface RectProps {
  style: CSSProperties;
  onPointerDown?: (e: ReactPointerEvent) => void;
  onPointerMove?: (e: ReactPointerEvent) => void;
  onPointerUp?: (e: ReactPointerEvent) => void;
  "data-dock-rect"?: string;
}

interface DragHandleProps {
  onPointerDown: (e: ReactPointerEvent) => void;
  style: { touchAction: "none" };
}

interface DropIndicatorProps {
  style: CSSProperties;
  "data-direction": DropDirection;
}

export interface UseDockLayoutReturn<T extends HTMLElement> {
  /** Ref callback to attach to the container element */
  containerRef: RefCallback<T>;
  /** Array of rectangles for all panels and split bars */
  layoutRects: LayoutRect[];
  /** Currently dragged panel rect, or null */
  draggingRect: PanelLayoutRect | null;
  /** Current layout tree (for persistence) */
  root: LayoutNode | null;
  /** Get props for a rect element (panel or split bar) */
  getRectProps: (rect: LayoutRect) => RectProps;
  /** Get props for a drag handle within a panel */
  getDragHandleProps: (rect: PanelLayoutRect) => DragHandleProps;
  /** Get props for a drop indicator (returns null if not applicable) */
  getDropIndicatorProps: (rect: PanelLayoutRect) => DropIndicatorProps | null;
  /** Add a new panel to the layout */
  addPanel: (id: string, minSize?: MinSize) => void;
  /** Remove a panel from the layout */
  removePanel: (id: string) => void;
}

/**
 * Main hook for creating a dock layout.
 *
 * @param initialRoot - Initial layout tree (or null for empty, or function)
 * @param options - Configuration options
 * @returns Object with layout state and interaction handlers
 */
export function useDockLayout<T extends HTMLElement = HTMLDivElement>(
  initialRoot: LayoutNode | null | (() => LayoutNode | null),
  options: LayoutManagerOptions = {}
): UseDockLayoutReturn<T> {
  // Initialize manager once
  const managerRef = useRef<LayoutManager | null>(null);
  if (!managerRef.current) {
    const root =
      typeof initialRoot === "function" ? initialRoot() : initialRoot;
    managerRef.current = new LayoutManager(root, options);
  }
  const manager = managerRef.current;

  // Subscribe to manager state
  const layoutRects = useSyncExternalStore(
    useCallback((callback) => manager.subscribe(callback), [manager]),
    useCallback(() => manager.getLayoutRects(), [manager]),
    useCallback(() => manager.getLayoutRects(), [manager])
  );

  const root = useSyncExternalStore(
    useCallback((callback) => manager.subscribe(callback), [manager]),
    useCallback(() => manager.getRoot(), [manager]),
    useCallback(() => manager.getRoot(), [manager])
  );

  const draggingRect = useSyncExternalStore(
    useCallback((callback) => manager.subscribe(callback), [manager]),
    useCallback(() => manager.getDraggingRect(), [manager]),
    useCallback(() => manager.getDraggingRect(), [manager])
  );

  // Cursor management
  const { setCursor } = useCursor();

  // Track pointer position for drop indicator
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });

  // Container element reference
  const containerElementRef = useRef<T | null>(null);

  // Resize observer
  const handleResize = useStableCallback(
    (size: { width: number; height: number }) => {
      manager.setSize(size);
    }
  );

  const resizeRef = useResizeObserver(handleResize);

  // Active resize/drag state
  const activeResizeRef = useRef<string | null>(null);

  // Container ref callback
  const containerRef: RefCallback<T> = useCallback(
    (element) => {
      containerElementRef.current = element;
      resizeRef(element);
    },
    [resizeRef]
  );

  // === getRectProps ===

  const getRectProps = useCallback(
    (rect: LayoutRect): RectProps => {
      const baseStyle: CSSProperties = {
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        boxSizing: "border-box",
      };

      if (rect.type === "panel") {
        return {
          style: baseStyle,
          "data-dock-rect": "panel",
        };
      }

      // Split bar props
      const splitRect = rect as SplitLayoutRect;

      return {
        style: {
          ...baseStyle,
          cursor:
            splitRect.orientation === "horizontal" ? "col-resize" : "row-resize",
          touchAction: "none",
        },
        "data-dock-rect": "split",
        onPointerDown: (e: ReactPointerEvent) => {
          e.preventDefault();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          activeResizeRef.current = splitRect.id;
          setCursor(
            splitRect.orientation === "horizontal" ? "col-resize" : "row-resize"
          );
        },
        onPointerMove: (e: ReactPointerEvent) => {
          if (activeResizeRef.current !== splitRect.id) return;

          const container = containerElementRef.current;
          if (!container) return;

          const containerRect = container.getBoundingClientRect();
          const adjustedPosition =
            splitRect.orientation === "horizontal"
              ? e.clientX - containerRect.left
              : e.clientY - containerRect.top;

          manager.resizePanel(splitRect.id, adjustedPosition);
        },
        onPointerUp: (e: ReactPointerEvent) => {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
          activeResizeRef.current = null;
          setCursor(null);
        },
      };
    },
    [manager, setCursor]
  );

  // === getDragHandleProps ===

  const getDragHandleProps = useCallback(
    (rect: PanelLayoutRect): DragHandleProps => {
      return {
        style: { touchAction: "none" },
        onPointerDown: (e: ReactPointerEvent) => {
          e.preventDefault();
          manager.setDraggingPanel(rect.id);
          setCursor("grabbing");

          // Set up document-level move/up handlers
          const handleMove = (moveEvent: PointerEvent) => {
            setPointerPosition({
              x: moveEvent.clientX,
              y: moveEvent.clientY,
            });
          };

          const handleUp = (upEvent: PointerEvent) => {
            document.removeEventListener("pointermove", handleMove);
            document.removeEventListener("pointerup", handleUp);

            const sourceId = manager.getDraggingPanelId();
            manager.setDraggingPanel(null);
            setCursor(null);

            if (!sourceId) return;

            // Find drop target
            const container = containerElementRef.current;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const relativePointer = {
              x: upEvent.clientX - containerRect.left,
              y: upEvent.clientY - containerRect.top,
            };

            // Find which panel we dropped on
            const panelRects = layoutRects.filter(
              (r): r is PanelLayoutRect =>
                r.type === "panel" && r.id !== sourceId
            );

            for (const panelRect of panelRects) {
              if (
                relativePointer.x >= panelRect.x &&
                relativePointer.x <= panelRect.x + panelRect.width &&
                relativePointer.y >= panelRect.y &&
                relativePointer.y <= panelRect.y + panelRect.height
              ) {
                const direction = findClosestDirection(panelRect, relativePointer);
                manager.movePanel(sourceId, panelRect.id, direction);
                break;
              }
            }
          };

          document.addEventListener("pointermove", handleMove);
          document.addEventListener("pointerup", handleUp);
        },
      };
    },
    [layoutRects, manager, setCursor]
  );

  // === getDropIndicatorProps ===

  const getDropIndicatorProps = useCallback(
    (rect: PanelLayoutRect): DropIndicatorProps | null => {
      if (!draggingRect || draggingRect.id === rect.id) {
        return null;
      }

      const container = containerElementRef.current;
      if (!container) return null;

      const containerRect = container.getBoundingClientRect();
      const relativePointer = {
        x: pointerPosition.x - containerRect.left,
        y: pointerPosition.y - containerRect.top,
      };

      // Check if pointer is within this panel
      if (
        relativePointer.x < rect.x ||
        relativePointer.x > rect.x + rect.width ||
        relativePointer.y < rect.y ||
        relativePointer.y > rect.y + rect.height
      ) {
        return null;
      }

      const direction = findClosestDirection(rect, relativePointer);
      const indicatorRect = getDropIndicatorRect(rect, direction);

      return {
        style: {
          position: "absolute",
          left: indicatorRect.x,
          top: indicatorRect.y,
          width: indicatorRect.width,
          height: indicatorRect.height,
          pointerEvents: "none",
        },
        "data-direction": direction,
      };
    },
    [draggingRect, pointerPosition]
  );

  // === Panel Operations ===

  const addPanel = useCallback(
    (id: string, minSize?: MinSize) => {
      manager.addPanel(id, minSize);
    },
    [manager]
  );

  const removePanel = useCallback(
    (id: string) => {
      manager.removePanel(id);
    },
    [manager]
  );

  return {
    containerRef,
    layoutRects,
    draggingRect,
    root,
    getRectProps,
    getDragHandleProps,
    getDropIndicatorProps,
    addPanel,
    removePanel,
  };
}
