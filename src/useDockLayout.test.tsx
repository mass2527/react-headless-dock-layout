import { act, render } from "@testing-library/react";
import type { RefCallback } from "react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { LayoutNode, PanelLayoutRect, SplitLayoutRect } from "./types";
import { useDockLayout } from "./useDockLayout";

/**
 * Helper to render the hook with a real DOM container element.
 * This is needed because useDockLayout uses useResizeObserver which
 * requires the containerRef to be attached to a real element.
 *
 * IMPORTANT: Do not destructure `result` from the returned object.
 * Always access it via `hookResult.result.current` to get the latest value
 * after state updates.
 */
function renderDockLayoutHook(
  initialRoot: LayoutNode | null | (() => LayoutNode | null),
  options?: Parameters<typeof useDockLayout>[1],
) {
  const resultHolder: {
    current: ReturnType<typeof useDockLayout<HTMLDivElement>> | null;
  } = { current: null };

  function TestComponent() {
    const result = useDockLayout<HTMLDivElement>(initialRoot, options);
    // Update the holder on every render so we always have the latest result
    resultHolder.current = result;

    return (
      <div
        ref={result.containerRef as RefCallback<HTMLDivElement>}
        data-testid="container"
        style={{ width: 500, height: 500 }}
      />
    );
  }

  const renderResult = render(<TestComponent />);

  return {
    /**
     * Getter that returns the current hook result.
     * Call this each time you need to access the result to get the latest value.
     */
    get result() {
      return { current: resultHolder.current! };
    },
    ...renderResult,
  };
}

describe("useDockLayout", () => {
  describe("initialization", () => {
    it("should initialize with null root", () => {
      const hookResult = renderDockLayoutHook(null);

      expect(hookResult.result.current.root).toBe(null);
      expect(hookResult.result.current.layoutRects).toEqual([]);
    });

    it("should initialize with a panel node", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const hookResult = renderDockLayoutHook(initialRoot);

      expect(hookResult.result.current.root).toEqual(initialRoot);
    });

    it("should initialize with a lazy initializer function", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };
      const initializer = vi.fn(() => initialRoot);

      const hookResult = renderDockLayoutHook(initializer);

      expect(initializer).toHaveBeenCalledTimes(1);
      expect(hookResult.result.current.root).toEqual(initialRoot);
    });

    it("should initialize with options", () => {
      const initialRoot: LayoutNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };

      const hookResult = renderDockLayoutHook(initialRoot, { gap: 20 });

      expect(hookResult.result.current.root).toEqual(initialRoot);
    });
  });

  describe("addPanel", () => {
    it("should add a panel to null root", () => {
      const hookResult = renderDockLayoutHook(null);

      act(() => {
        hookResult.result.current.addPanel("new-panel");
      });

      expect(hookResult.result.current.root).toEqual({
        id: "new-panel",
        type: "panel",
      });
    });

    it("should add a panel to existing panel root", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const hookResult = renderDockLayoutHook(initialRoot);

      act(() => {
        hookResult.result.current.addPanel("panel-2");
      });

      expect(hookResult.result.current.root).toMatchObject({
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "panel-1", type: "panel" },
        right: { id: "panel-2", type: "panel" },
      });
    });

    it("should add multiple panels with equal width ratio strategy", () => {
      const hookResult = renderDockLayoutHook(null);

      act(() => {
        hookResult.result.current.addPanel("panel-1");
      });
      act(() => {
        hookResult.result.current.addPanel("panel-2");
      });
      act(() => {
        hookResult.result.current.addPanel("panel-3");
      });

      // After 3 panels: ratio should be 2/3 for the outer split
      const root = hookResult.result.current.root;
      expect(root).not.toBe(null);
      expect(root?.type).toBe("split");
      if (root?.type === "split") {
        expect(root.ratio).toBe(2 / 3);
        expect(root.right).toEqual({ id: "panel-3", type: "panel" });
      }
    });
  });

  describe("removePanel", () => {
    it("should remove the only panel and set root to null", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const hookResult = renderDockLayoutHook(initialRoot);

      act(() => {
        hookResult.result.current.removePanel("panel-1");
      });

      expect(hookResult.result.current.root).toBe(null);
      expect(hookResult.result.current.layoutRects).toEqual([]);
    });

    it("should remove a panel from a split and promote sibling", () => {
      const initialRoot: LayoutNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };

      const hookResult = renderDockLayoutHook(initialRoot);

      act(() => {
        hookResult.result.current.removePanel("left");
      });

      expect(hookResult.result.current.root).toEqual({
        id: "right",
        type: "panel",
      });
    });

    it("should throw error when removing non-existent panel", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const hookResult = renderDockLayoutHook(initialRoot);

      expect(() => {
        hookResult.result.current.removePanel("non-existent");
      }).toThrow("Node with id non-existent not found");
    });

    it("should throw error when root is null", () => {
      const hookResult = renderDockLayoutHook(null);

      expect(() => {
        hookResult.result.current.removePanel("any-id");
      }).toThrow("Root node is null");
    });
  });

  describe("getRectProps", () => {
    describe("for panel rect", () => {
      it("should return correct style for panel", () => {
        const panelRect: PanelLayoutRect = {
          id: "panel-1",
          type: "panel",
          x: 10,
          y: 20,
          width: 100,
          height: 200,
        };

        const hookResult = renderDockLayoutHook(null);
        const props = hookResult.result.current.getRectProps(panelRect);

        expect(props.style).toEqual({
          position: "absolute",
          left: 10,
          top: 20,
          width: 100,
          height: 200,
        });
      });

      it("should include onPointerMove handler", () => {
        const panelRect: PanelLayoutRect = {
          id: "panel-1",
          type: "panel",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        };

        const hookResult = renderDockLayoutHook(null);
        const props = hookResult.result.current.getRectProps(panelRect);

        expect(typeof props.onPointerMove).toBe("function");
      });

      it("should include onPointerUp handler", () => {
        const panelRect: PanelLayoutRect = {
          id: "panel-1",
          type: "panel",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        };

        const hookResult = renderDockLayoutHook(null);
        const props = hookResult.result.current.getRectProps(panelRect);

        expect(typeof props.onPointerUp).toBe("function");
      });
    });

    describe("for split rect", () => {
      it("should return correct style with horizontal cursor for horizontal split", () => {
        const splitRect: SplitLayoutRect = {
          id: "split-1",
          type: "split",
          orientation: "horizontal",
          x: 50,
          y: 0,
          width: 10,
          height: 100,
        };

        const hookResult = renderDockLayoutHook(null);
        const props = hookResult.result.current.getRectProps(splitRect);

        expect(props.style).toEqual({
          position: "absolute",
          left: 50,
          top: 0,
          width: 10,
          height: 100,
          cursor: "col-resize",
          touchAction: "none",
        });
      });

      it("should return correct style with vertical cursor for vertical split", () => {
        const splitRect: SplitLayoutRect = {
          id: "split-1",
          type: "split",
          orientation: "vertical",
          x: 0,
          y: 50,
          width: 100,
          height: 10,
        };

        const hookResult = renderDockLayoutHook(null);
        const props = hookResult.result.current.getRectProps(splitRect);

        expect(props.style).toEqual({
          position: "absolute",
          left: 0,
          top: 50,
          width: 100,
          height: 10,
          cursor: "row-resize",
          touchAction: "none",
        });
      });

      it("should include pointer event handlers", () => {
        const splitRect: SplitLayoutRect = {
          id: "split-1",
          type: "split",
          orientation: "horizontal",
          x: 50,
          y: 0,
          width: 10,
          height: 100,
        };

        const hookResult = renderDockLayoutHook(null);
        const props = hookResult.result.current.getRectProps(splitRect);

        expect(typeof props.onPointerDown).toBe("function");
        expect(typeof props.onPointerMove).toBe("function");
        expect(typeof props.onPointerUp).toBe("function");
      });
    });
  });

  describe("getDragHandleProps", () => {
    it("should return onPointerDown handler and style", () => {
      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const hookResult = renderDockLayoutHook(null);
      const props = hookResult.result.current.getDragHandleProps(panelRect);

      expect(typeof props.onPointerDown).toBe("function");
      expect(props.style).toEqual({ touchAction: "none" });
    });

    it("should set draggingRect when onPointerDown is triggered", () => {
      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const hookResult = renderDockLayoutHook(null);

      expect(hookResult.result.current.draggingRect).toBe(null);

      const props = hookResult.result.current.getDragHandleProps(panelRect);

      act(() => {
        const mockEvent = {
          currentTarget: {
            releasePointerCapture: vi.fn(),
          },
          pointerId: 1,
        } as unknown as React.PointerEvent;
        props.onPointerDown(mockEvent);
      });

      expect(hookResult.result.current.draggingRect).toEqual(panelRect);
    });
  });

  describe("getDropIndicatorProps", () => {
    it("should return null when no panel is being dragged", () => {
      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const hookResult = renderDockLayoutHook(null);
      const props = hookResult.result.current.getDropIndicatorProps(panelRect);

      expect(props).toBe(null);
    });

    it("should return null for non-target panel when dragging", () => {
      const initialRoot: LayoutNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };

      const draggingRect: PanelLayoutRect = {
        id: "left",
        type: "panel",
        x: 0,
        y: 0,
        width: 50,
        height: 100,
      };

      const targetRect: PanelLayoutRect = {
        id: "right",
        type: "panel",
        x: 60,
        y: 0,
        width: 50,
        height: 100,
      };

      const hookResult = renderDockLayoutHook(initialRoot);

      // Start dragging
      const dragProps =
        hookResult.result.current.getDragHandleProps(draggingRect);
      act(() => {
        const mockEvent = {
          currentTarget: { releasePointerCapture: vi.fn() },
          pointerId: 1,
        } as unknown as React.PointerEvent;
        dragProps.onPointerDown(mockEvent);
      });

      // Without triggering onPointerMove on target, dropTarget is not set
      const dropIndicatorProps =
        hookResult.result.current.getDropIndicatorProps(targetRect);
      expect(dropIndicatorProps).toBe(null);
    });
  });

  describe("draggingRect", () => {
    it("should be null initially", () => {
      const hookResult = renderDockLayoutHook(null);
      expect(hookResult.result.current.draggingRect).toBe(null);
    });

    it("should be set when drag starts", () => {
      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const hookResult = renderDockLayoutHook(null);
      const props = hookResult.result.current.getDragHandleProps(panelRect);

      act(() => {
        const mockEvent = {
          currentTarget: { releasePointerCapture: vi.fn() },
          pointerId: 1,
        } as unknown as React.PointerEvent;
        props.onPointerDown(mockEvent);
      });

      expect(hookResult.result.current.draggingRect).toEqual(panelRect);
    });

    it("should be cleared when dropped on same panel", () => {
      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const hookResult = renderDockLayoutHook(null);

      // Start dragging
      const dragProps = hookResult.result.current.getDragHandleProps(panelRect);
      act(() => {
        const mockEvent = {
          currentTarget: { releasePointerCapture: vi.fn() },
          pointerId: 1,
        } as unknown as React.PointerEvent;
        dragProps.onPointerDown(mockEvent);
      });

      expect(hookResult.result.current.draggingRect).toEqual(panelRect);

      // Drop on same panel (via panel's onPointerUp)
      const rectProps = hookResult.result.current.getRectProps(panelRect);
      act(() => {
        const mockEvent = {
          clientX: 50,
          clientY: 50,
        } as unknown as React.PointerEvent<HTMLDivElement>;
        rectProps.onPointerUp(mockEvent);
      });

      expect(hookResult.result.current.draggingRect).toBe(null);
    });
  });

  describe("layoutRects reactivity", () => {
    it("should update layoutRects when addPanel is called", () => {
      const hookResult = renderDockLayoutHook(null);

      expect(hookResult.result.current.layoutRects).toEqual([]);

      act(() => {
        hookResult.result.current.addPanel("panel-1");
      });

      // Panel was added
      expect(hookResult.result.current.root).toEqual({
        id: "panel-1",
        type: "panel",
      });
    });

    it("should update layoutRects when removePanel is called", () => {
      const initialRoot: LayoutNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };

      const hookResult = renderDockLayoutHook(initialRoot);

      act(() => {
        hookResult.result.current.removePanel("left");
      });

      expect(hookResult.result.current.root).toEqual({
        id: "right",
        type: "panel",
      });
    });
  });

  describe("custom placement strategy", () => {
    it("should use custom placement strategy when adding panels", () => {
      const customStrategy = {
        getPlacementOnAdd: vi.fn((root: LayoutNode) => ({
          targetId: root.id,
          direction: "bottom" as const,
          ratio: 0.7,
        })),
      };

      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const hookResult = renderDockLayoutHook(initialRoot, {
        placementStrategy: customStrategy,
      });

      act(() => {
        hookResult.result.current.addPanel("panel-2");
      });

      expect(customStrategy.getPlacementOnAdd).toHaveBeenCalled();
      expect(hookResult.result.current.root).toMatchObject({
        type: "split",
        orientation: "vertical",
        ratio: 0.7,
      });
    });
  });

  describe("containerRef", () => {
    it("should provide a ref callback", () => {
      const hookResult = renderDockLayoutHook(null);
      expect(hookResult.result.current.containerRef).toBeDefined();
    });
  });
});
