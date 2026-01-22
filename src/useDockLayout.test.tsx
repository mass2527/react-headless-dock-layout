import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LayoutNode, PanelLayoutRect, SplitLayoutRect } from "./types";
import { useDockLayout } from "./useDockLayout";

// Mock ResizeObserver for tests
class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver =
  MockResizeObserver as unknown as typeof ResizeObserver;

describe("useDockLayout", () => {
  describe("initialization", () => {
    it("should initialize with null root", () => {
      const { result } = renderHook(() => useDockLayout<HTMLDivElement>(null));

      expect(result.current.root).toBe(null);
      expect(result.current.layoutRects).toEqual([]);
    });

    it("should initialize with a panel node", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      expect(result.current.root).toEqual(initialRoot);
    });

    it("should initialize with a function returning layout", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(() => initialRoot),
      );

      expect(result.current.root).toEqual(initialRoot);
    });

    it("should initialize with a split node", () => {
      const initialRoot: LayoutNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "panel-1", type: "panel" },
        right: { id: "panel-2", type: "panel" },
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      expect(result.current.root).toEqual(initialRoot);
    });
  });

  describe("addPanel", () => {
    it("should add a panel to null root", () => {
      const { result } = renderHook(() => useDockLayout<HTMLDivElement>(null));

      act(() => {
        result.current.addPanel("new-panel");
      });

      expect(result.current.root).toEqual({
        id: "new-panel",
        type: "panel",
      });
    });

    it("should add a panel to existing panel", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      act(() => {
        result.current.addPanel("new-panel");
      });

      expect(result.current.root?.type).toBe("split");
      if (result.current.root?.type === "split") {
        expect(result.current.root.orientation).toBe("horizontal");
        expect(result.current.root.ratio).toBe(0.5);
      }
    });
  });

  describe("removePanel", () => {
    it("should remove the only panel and set root to null", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      act(() => {
        result.current.removePanel("panel-1");
      });

      expect(result.current.root).toBe(null);
    });

    it("should remove a panel from split and promote sibling", () => {
      const initialRoot: LayoutNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "panel-1", type: "panel" },
        right: { id: "panel-2", type: "panel" },
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      act(() => {
        result.current.removePanel("panel-1");
      });

      expect(result.current.root).toEqual({
        id: "panel-2",
        type: "panel",
      });
    });
  });

  describe("getRectProps", () => {
    it("should return correct props for panel rect", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const props = result.current.getRectProps(panelRect);

      expect(props).toBeDefined();
      expect(props?.style).toEqual({
        position: "absolute",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
      });
      expect(typeof props?.onPointerMove).toBe("function");
      expect(typeof props?.onPointerUp).toBe("function");
    });

    it("should return correct props for split rect", () => {
      const initialRoot: LayoutNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "panel-1", type: "panel" },
        right: { id: "panel-2", type: "panel" },
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      const splitRect: SplitLayoutRect = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        x: 45,
        y: 0,
        width: 10,
        height: 100,
      };

      const props = result.current.getRectProps(splitRect);

      expect(props).toBeDefined();
      expect(props?.style).toEqual({
        position: "absolute",
        left: 45,
        top: 0,
        width: 10,
        height: 100,
        cursor: "col-resize",
        touchAction: "none",
      });
      expect(typeof props?.onPointerDown).toBe("function");
      expect(typeof props?.onPointerMove).toBe("function");
      expect(typeof props?.onPointerUp).toBe("function");
    });

    it("should return vertical cursor for vertical split", () => {
      const initialRoot: LayoutNode = {
        id: "split-1",
        type: "split",
        orientation: "vertical",
        ratio: 0.5,
        left: { id: "panel-1", type: "panel" },
        right: { id: "panel-2", type: "panel" },
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      const splitRect: SplitLayoutRect = {
        id: "split-1",
        type: "split",
        orientation: "vertical",
        x: 0,
        y: 45,
        width: 100,
        height: 10,
      };

      const props = result.current.getRectProps(splitRect);

      expect(props?.style?.cursor).toBe("row-resize");
    });
  });

  describe("getDragHandleProps", () => {
    it("should return props with touchAction and onPointerDown", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const props = result.current.getDragHandleProps(panelRect);

      expect(props.style).toEqual({ touchAction: "none" });
      expect(typeof props.onPointerDown).toBe("function");
    });
  });

  describe("getDropIndicatorProps", () => {
    it("should return null when no panel is being dragged", () => {
      const initialRoot: LayoutNode = {
        id: "panel-1",
        type: "panel",
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      const panelRect: PanelLayoutRect = {
        id: "panel-1",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      const props = result.current.getDropIndicatorProps(panelRect);

      expect(props).toBe(null);
    });
  });

  describe("draggingRect", () => {
    it("should be null initially", () => {
      const { result } = renderHook(() => useDockLayout<HTMLDivElement>(null));

      expect(result.current.draggingRect).toBe(null);
    });
  });

  describe("containerRef", () => {
    it("should return a ref callback", () => {
      const { result } = renderHook(() => useDockLayout<HTMLDivElement>(null));

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBe(null);
    });
  });

  describe("ratio validation", () => {
    it("should clamp invalid ratios to valid bounds", () => {
      const initialRoot: LayoutNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: 2.5, // Invalid: > 1
        left: { id: "panel-1", type: "panel" },
        right: { id: "panel-2", type: "panel" },
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      // The ratio should be clamped to 1
      expect(result.current.root?.type).toBe("split");
      if (result.current.root?.type === "split") {
        expect(result.current.root.ratio).toBe(1);
      }
    });

    it("should clamp negative ratios to 0", () => {
      const initialRoot: LayoutNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: -0.5, // Invalid: < 0
        left: { id: "panel-1", type: "panel" },
        right: { id: "panel-2", type: "panel" },
      };

      const { result } = renderHook(() =>
        useDockLayout<HTMLDivElement>(initialRoot),
      );

      // The ratio should be clamped to 0
      expect(result.current.root?.type).toBe("split");
      if (result.current.root?.type === "split") {
        expect(result.current.root.ratio).toBe(0);
      }
    });
  });
});
