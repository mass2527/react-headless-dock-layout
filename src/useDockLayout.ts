import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
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

/** Drop target information for keyboard navigation */
export interface DropTarget {
  targetId: string;
  direction: Direction;
}

/** Props for the screen reader announcement region */
export interface AnnouncementProps {
  role: "status";
  "aria-live": "polite";
  "aria-atomic": true;
  children: string | null;
}

/** Accessibility props for panel elements */
export interface PanelA11yProps {
  role: "region";
  "aria-label": string;
  tabIndex: number;
}

/** Accessibility props for split bar elements */
export interface SplitBarA11yProps {
  role: "separator";
  "aria-orientation": "horizontal" | "vertical";
  "aria-valuenow": number;
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-label": string;
  "aria-controls": string;
  tabIndex: number;
}

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

  // Accessibility state
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [movingPanelId, setMovingPanelId] = useState<string | null>(null);
  const [keyboardDropTarget, setKeyboardDropTarget] =
    useState<DropTarget | null>(null);
  const [focusedPanelId, setFocusedPanelId] = useState<string | null>(null);

  // Auto-clear announcements after a delay
  const announcementTimeoutRef = useRef<number | null>(null);

  const announce = useCallback((message: string) => {
    if (announcementTimeoutRef.current !== null) {
      window.clearTimeout(announcementTimeoutRef.current);
    }
    setAnnouncement(message);
    announcementTimeoutRef.current = window.setTimeout(() => {
      setAnnouncement(null);
      announcementTimeoutRef.current = null;
    }, 1000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current !== null) {
        window.clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  const containerRef = useResizeObserver<T>((entry) => {
    layoutManager.setSize({
      width: entry.contentRect.width,
      height: entry.contentRect.height,
    });
  });

  useCursor(
    resizingRect === null ? "default" : CURSORS[resizingRect.orientation],
  );

  // Get all panel rects for keyboard navigation
  const getPanelRects = useCallback(() => {
    return layoutRects.filter(
      (rect): rect is PanelLayoutRect => rect.type === "panel",
    );
  }, [layoutRects]);

  // Get available drop targets for a given panel
  const getAvailableDropTargets = useCallback(
    (sourceId: string): DropTarget[] => {
      const panels = getPanelRects();
      const targets: DropTarget[] = [];

      for (const panel of panels) {
        if (panel.id !== sourceId) {
          for (const direction of DIRECTIONS) {
            targets.push({ targetId: panel.id, direction });
          }
        }
      }

      return targets;
    },
    [getPanelRects],
  );

  // Cycle through drop targets
  const cycleDropTarget = useCallback(
    (direction: "next" | "prev") => {
      if (movingPanelId === null) return;

      const targets = getAvailableDropTargets(movingPanelId);
      if (targets.length === 0) return;

      if (keyboardDropTarget === null) {
        const target = direction === "next" ? targets[0] : targets[targets.length - 1];
        if (target === undefined) return;
        setKeyboardDropTarget(target);
        announce(`Drop ${target.direction} of panel ${target.targetId}`);
        return;
      }

      const currentIndex = targets.findIndex(
        (t) =>
          t.targetId === keyboardDropTarget.targetId &&
          t.direction === keyboardDropTarget.direction,
      );

      let newIndex: number;
      if (direction === "next") {
        newIndex = (currentIndex + 1) % targets.length;
      } else {
        newIndex = (currentIndex - 1 + targets.length) % targets.length;
      }

      const newTarget = targets[newIndex];
      if (newTarget === undefined) return;
      setKeyboardDropTarget(newTarget);
      announce(`Drop ${newTarget.direction} of panel ${newTarget.targetId}`);
    },
    [movingPanelId, keyboardDropTarget, getAvailableDropTargets, announce],
  );

  // Start keyboard move mode
  const startKeyboardMove = useCallback(
    (panelId: string) => {
      setMovingPanelId(panelId);
      setKeyboardDropTarget(null);
      announce(
        `Moving panel ${panelId}. Use arrow keys to select drop position, Enter to confirm, Escape to cancel.`,
      );
    },
    [announce],
  );

  // Cancel keyboard move
  const cancelKeyboardMove = useCallback(() => {
    if (movingPanelId !== null) {
      announce("Move cancelled");
    }
    setMovingPanelId(null);
    setKeyboardDropTarget(null);
  }, [movingPanelId, announce]);

  // Confirm keyboard drop
  const confirmKeyboardDrop = useCallback(() => {
    if (movingPanelId === null || keyboardDropTarget === null) return;

    const targetRect = layoutRects.find(
      (r) => r.id === keyboardDropTarget.targetId,
    );
    if (!targetRect || targetRect.type !== "panel") return;

    // Calculate a point that represents the drop direction
    const point = getPointForDirection(targetRect, keyboardDropTarget.direction);

    layoutManager.movePanel({
      sourceId: movingPanelId,
      targetId: keyboardDropTarget.targetId,
      point,
    });

    announce(
      `Panel ${movingPanelId} moved ${keyboardDropTarget.direction} of panel ${keyboardDropTarget.targetId}`,
    );

    setFocusedPanelId(movingPanelId);
    setMovingPanelId(null);
    setKeyboardDropTarget(null);
  }, [movingPanelId, keyboardDropTarget, layoutRects, layoutManager, announce]);

  // Handle keyboard resize for split bars
  const handleSplitKeyDown = useCallback(
    (event: ReactKeyboardEvent, rect: SplitLayoutRect) => {
      const SMALL_STEP = 0.01;
      const LARGE_STEP = 0.1;

      const isHorizontal = rect.orientation === "horizontal";
      const increaseKey = isHorizontal ? "ArrowRight" : "ArrowDown";
      const decreaseKey = isHorizontal ? "ArrowLeft" : "ArrowUp";

      if (event.key === increaseKey || event.key === decreaseKey) {
        event.preventDefault();
        const step = event.shiftKey ? LARGE_STEP : SMALL_STEP;
        const delta = event.key === increaseKey ? step : -step;
        layoutManager.resizePanelByDelta(rect.id, delta);

        const ratio = layoutManager.getSplitRatio(rect.id);
        if (ratio !== null) {
          announce(`${Math.round(ratio * 100)}%`);
        }
      } else if (event.key === "Home") {
        event.preventDefault();
        layoutManager.resizePanelByDelta(rect.id, -1); // Will be clamped to min
        announce("Minimum size");
      } else if (event.key === "End") {
        event.preventDefault();
        layoutManager.resizePanelByDelta(rect.id, 1); // Will be clamped to max
        announce("Maximum size");
      }
    },
    [layoutManager, announce],
  );

  // Enhanced addPanel with announcement
  const addPanel = useCallback(
    (id: string) => {
      layoutManager.addPanel(id);
      setFocusedPanelId(id);
      announce(`Panel ${id} added`);
    },
    [layoutManager, announce],
  );

  // Enhanced removePanel with announcement and focus management
  const removePanel = useCallback(
    (id: string) => {
      const panels = getPanelRects();
      const currentIndex = panels.findIndex((p) => p.id === id);

      layoutManager.removePanel(id);
      announce(`Panel ${id} removed`);

      // Move focus to nearest panel
      const remainingPanels = panels.filter((p) => p.id !== id);
      if (remainingPanels.length > 0) {
        const newIndex = Math.min(currentIndex, remainingPanels.length - 1);
        const nextPanel = remainingPanels[newIndex];
        if (nextPanel !== undefined) {
          setFocusedPanelId(nextPanel.id);
        }
      } else {
        setFocusedPanelId(null);
      }
    },
    [layoutManager, getPanelRects, announce],
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
          tabIndex: 0,
          onKeyDown: (event: ReactKeyboardEvent) => {
            handleSplitKeyDown(event, rect);
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

            const containerRect = container.getBoundingClientRect();
            layoutManager.resizePanel(resizingRect.id, {
              x: event.clientX - containerRect.left,
              y: event.clientY - containerRect.top,
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

            const target = layoutManager.calculateDropTarget({
              draggedPanelId: draggingRect.id,
              targetPanelId: rect.id,
              point: {
                x: event.clientX,
                y: event.clientY,
              },
            });
            setDropTarget(target);
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
      // Check pointer-based dragging
      if (draggingRect !== null && rect.id === dropTarget?.id) {
        return {
          style: getDropIndicatorStyle(dropTarget.direction),
        };
      }

      // Check keyboard-based moving
      if (movingPanelId !== null && rect.id === keyboardDropTarget?.targetId) {
        return {
          style: getDropIndicatorStyle(keyboardDropTarget.direction),
        };
      }

      return null;
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
        onKeyDown: (event: ReactKeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (movingPanelId === rect.id) {
              // Already moving this panel - confirm drop
              confirmKeyboardDrop();
            } else if (movingPanelId !== null) {
              // Moving a different panel - cancel and start new
              cancelKeyboardMove();
              startKeyboardMove(rect.id);
            } else {
              // Start moving
              startKeyboardMove(rect.id);
            }
          } else if (event.key === "Escape" && movingPanelId !== null) {
            event.preventDefault();
            cancelKeyboardMove();
          } else if (movingPanelId !== null) {
            // Navigate drop targets with arrow keys
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              event.preventDefault();
              cycleDropTarget("next");
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              event.preventDefault();
              cycleDropTarget("prev");
            }
          }
        },
        style: {
          touchAction: "none",
        },
        "aria-pressed": movingPanelId === rect.id,
        "aria-describedby": `drag-instructions-${rect.id}`,
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
    addPanel,
    /**
     * Removes a panel from the layout.
     * If it's the last panel, the layout becomes empty (root becomes `null`).
     * The layout tree is automatically restructured to remove empty splits.
     *
     * @param id - The ID of the panel to remove.
     * @throws {Error} If the panel is not found or if the root is null.
     */
    removePanel,
    /**
     * The current root node of the layout tree.
     * Use this to serialize the layout state (e.g., `JSON.stringify(root)`).
     * Can be `null` if the layout is empty.
     */
    root: layoutManager.root,

    // ===== Accessibility APIs =====

    /**
     * Current announcement message for screen readers.
     * Renders in an aria-live region.
     */
    announcement,
    /**
     * Returns props for an aria-live announcement region.
     * Include this in your component to announce layout changes to screen readers.
     */
    getAnnouncementProps: (): AnnouncementProps => ({
      role: "status",
      "aria-live": "polite",
      "aria-atomic": true,
      children: announcement,
    }),
    /**
     * ID of the panel currently being moved via keyboard, or null.
     */
    movingPanelId,
    /**
     * Start keyboard-based panel move mode.
     * @param panelId - The ID of the panel to move
     */
    startKeyboardMove,
    /**
     * Cancel the current keyboard move operation.
     */
    cancelKeyboardMove,
    /**
     * Confirm and execute the keyboard drop operation.
     */
    confirmKeyboardDrop,
    /**
     * The current drop target during keyboard navigation.
     */
    currentDropTarget: keyboardDropTarget,
    /**
     * Cycle through available drop targets.
     * @param direction - 'next' or 'prev'
     */
    cycleDropTarget,
    /**
     * ID of the panel that should receive focus, or null.
     * Use this to manage focus after layout operations.
     */
    focusedPanelId,
    /**
     * Set which panel should receive focus.
     * @param id - Panel ID or null
     */
    setFocusedPanelId,
    /**
     * Returns accessibility props for a panel element.
     * @param rect - The panel layout rectangle
     * @param label - Optional custom label (defaults to panel ID)
     */
    getPanelA11yProps: (rect: PanelLayoutRect, label?: string): PanelA11yProps => ({
      role: "region",
      "aria-label": label ?? `Panel ${rect.id}`,
      tabIndex: -1,
    }),
    /**
     * Returns accessibility props for a split bar element.
     * @param rect - The split bar layout rectangle
     * @param label - Optional custom label
     */
    getSplitBarA11yProps: (
      rect: SplitLayoutRect,
      label?: string,
    ): SplitBarA11yProps => {
      const ratio = layoutManager.getSplitRatio(rect.id) ?? 0.5;
      const adjacentPanels = layoutManager.getAdjacentPanelIds(rect.id);
      const defaultLabel = adjacentPanels
        ? `Resize between panel ${adjacentPanels.leftId} and panel ${adjacentPanels.rightId}`
        : "Resize panels";

      return {
        role: "separator",
        "aria-orientation": rect.orientation === "horizontal" ? "vertical" : "horizontal",
        "aria-valuenow": Math.round(ratio * 100),
        "aria-valuemin": 10,
        "aria-valuemax": 90,
        "aria-label": label ?? defaultLabel,
        "aria-controls": adjacentPanels
          ? `${adjacentPanels.leftId} ${adjacentPanels.rightId}`
          : "",
        tabIndex: 0,
      };
    },
    /**
     * Programmatically announce a message to screen readers.
     * @param message - The message to announce
     */
    announce,
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

function getPointForDirection(
  rect: PanelLayoutRect,
  direction: Direction,
): { x: number; y: number } {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  switch (direction) {
    case "top":
      return { x: centerX, y: rect.y + rect.height * 0.25 };
    case "bottom":
      return { x: centerX, y: rect.y + rect.height * 0.75 };
    case "left":
      return { x: rect.x + rect.width * 0.25, y: centerY };
    case "right":
      return { x: rect.x + rect.width * 0.75, y: centerY };
    default:
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

const DIRECTIONS: Direction[] = ["top", "right", "bottom", "left"];
