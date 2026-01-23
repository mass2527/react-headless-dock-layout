import { describe, expect, it } from "vitest";
import type { LayoutRect, PanelNode, SplitNode } from "../../types";
import { calculateLayoutRects } from "./calculateLayoutRects";

describe("calculateLayoutRects", () => {
  describe("edge cases", () => {
    it("should handle zero width container", () => {
      const root: PanelNode = {
        id: "root",
        type: "panel",
      };
      const options = {
        gap: 10,
        size: { width: 0, height: 100 },
      };
      const result = calculateLayoutRects(root, options);
      expect(result).toEqual([
        {
          id: "root",
          type: "panel",
          x: 0,
          y: 0,
          width: 0,
          height: 100,
        },
      ]);
    });

    it("should handle zero height container", () => {
      const root: PanelNode = {
        id: "root",
        type: "panel",
      };
      const options = {
        gap: 10,
        size: { width: 100, height: 0 },
      };
      const result = calculateLayoutRects(root, options);
      expect(result).toEqual([
        {
          id: "root",
          type: "panel",
          x: 0,
          y: 0,
          width: 100,
          height: 0,
        },
      ]);
    });

    it("should handle zero gap", () => {
      const root: SplitNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };
      const options = {
        gap: 0,
        size: { width: 100, height: 100 },
      };
      const result = calculateLayoutRects(root, options);
      expect(result).toEqual<LayoutRect[]>([
        {
          id: "root",
          type: "split",
          orientation: "horizontal",
          x: 50,
          y: 0,
          width: 0,
          height: 100,
        },
        {
          id: "left",
          type: "panel",
          x: 0,
          y: 0,
          width: 50,
          height: 100,
        },
        {
          id: "right",
          type: "panel",
          x: 50,
          y: 0,
          width: 50,
          height: 100,
        },
      ]);
    });

    it("should handle extreme ratio (0.1)", () => {
      const root: SplitNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.1,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };
      const options = {
        gap: 10,
        size: { width: 100, height: 100 },
      };
      const result = calculateLayoutRects(root, options);

      const leftPanel = result.find((r) => r.id === "left");
      const rightPanel = result.find((r) => r.id === "right");

      expect(leftPanel?.width).toBe(5); // 100 * 0.1 - 5 = 5
      expect(rightPanel?.width).toBe(85); // 100 * 0.9 - 5 = 85
    });

    it("should handle extreme ratio (0.9)", () => {
      const root: SplitNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.9,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };
      const options = {
        gap: 10,
        size: { width: 100, height: 100 },
      };
      const result = calculateLayoutRects(root, options);

      const leftPanel = result.find((r) => r.id === "left");
      const rightPanel = result.find((r) => r.id === "right");

      expect(leftPanel?.width).toBe(85); // 100 * 0.9 - 5 = 85
      expect(rightPanel?.width).toBe(5); // 100 * 0.1 - 5 = 5
    });

    it("should handle large gap relative to container", () => {
      const root: SplitNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };
      const options = {
        gap: 50,
        size: { width: 100, height: 100 },
      };
      const result = calculateLayoutRects(root, options);

      const leftPanel = result.find((r) => r.id === "left");
      const rightPanel = result.find((r) => r.id === "right");

      expect(leftPanel?.width).toBe(25); // 100 * 0.5 - 25 = 25
      expect(rightPanel?.width).toBe(25); // 100 * 0.5 - 25 = 25
    });

    it("should handle deeply nested layout (4 levels)", () => {
      const root: SplitNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "split-2",
          type: "split",
          orientation: "vertical",
          ratio: 0.5,
          left: {
            id: "split-3",
            type: "split",
            orientation: "horizontal",
            ratio: 0.5,
            left: {
              id: "split-4",
              type: "split",
              orientation: "vertical",
              ratio: 0.5,
              left: { id: "panel-1", type: "panel" },
              right: { id: "panel-2", type: "panel" },
            },
            right: { id: "panel-3", type: "panel" },
          },
          right: { id: "panel-4", type: "panel" },
        },
        right: { id: "panel-5", type: "panel" },
      };
      const options = {
        gap: 10,
        size: { width: 200, height: 200 },
      };
      const result = calculateLayoutRects(root, options);

      // Should have 5 panels and 4 splits = 9 total rects
      expect(result).toHaveLength(9);

      const panels = result.filter((r) => r.type === "panel");
      const splits = result.filter((r) => r.type === "split");

      expect(panels).toHaveLength(5);
      expect(splits).toHaveLength(4);

      // All panels should have positive dimensions
      for (const panel of panels) {
        expect(panel.width).toBeGreaterThan(0);
        expect(panel.height).toBeGreaterThan(0);
      }
    });

    it("should handle non-integer container dimensions", () => {
      const root: SplitNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.33,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };
      const options = {
        gap: 10,
        size: { width: 333, height: 333 },
      };
      const result = calculateLayoutRects(root, options);

      // All values should be rounded integers
      for (const rect of result) {
        expect(Number.isInteger(rect.x)).toBe(true);
        expect(Number.isInteger(rect.y)).toBe(true);
        expect(Number.isInteger(rect.width)).toBe(true);
        expect(Number.isInteger(rect.height)).toBe(true);
      }
    });

    it("should handle very large container dimensions", () => {
      const root: SplitNode = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "left", type: "panel" },
        right: { id: "right", type: "panel" },
      };
      const options = {
        gap: 10,
        size: { width: 10000, height: 10000 },
      };
      const result = calculateLayoutRects(root, options);

      const leftPanel = result.find((r) => r.id === "left");
      const rightPanel = result.find((r) => r.id === "right");

      expect(leftPanel?.width).toBe(4995);
      expect(rightPanel?.width).toBe(4995);
    });
  });


  it("should return an empty array when the root is null", () => {
    const root = null;
    const options = {
      gap: 10,
      size: { width: 100, height: 100 },
    };
    const result = calculateLayoutRects(root, options);
    expect(result).toEqual([]);
  });

  it("should return correct layout rects when the root is panel node", () => {
    const root: PanelNode = {
      id: "root",
      type: "panel",
    };
    const options = {
      gap: 10,
      size: { width: 100, height: 100 },
    };
    const result = calculateLayoutRects(root, options);
    expect(result).toEqual([
      {
        id: "root",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
    ]);
  });

  it("should return correct layout rects when the root is split node with horizontal orientation", () => {
    const root: SplitNode = {
      id: "root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "left",
        type: "panel",
      },
      right: {
        id: "right",
        type: "panel",
      },
    };
    const options = {
      gap: 10,
      size: { width: 100, height: 100 },
    };
    const result = calculateLayoutRects(root, options);
    expect(result).toEqual<LayoutRect[]>([
      {
        id: "root",
        type: "split",
        orientation: "horizontal",
        x: 45,
        y: 0,
        width: 10,
        height: 100,
      },
      {
        id: "left",
        type: "panel",
        x: 0,
        y: 0,
        width: 45,
        height: 100,
      },
      {
        id: "right",
        type: "panel",
        x: 55,
        y: 0,
        width: 45,
        height: 100,
      },
    ]);
  });

  it("should return correct layout rects when the root is split node with vertical orientation", () => {
    const root: SplitNode = {
      id: "root",
      type: "split",
      orientation: "vertical",
      ratio: 0.5,
      left: {
        id: "left",
        type: "panel",
      },
      right: {
        id: "right",
        type: "panel",
      },
    };
    const options = {
      gap: 10,
      size: { width: 100, height: 100 },
    };
    const result = calculateLayoutRects(root, options);
    expect(result).toEqual<LayoutRect[]>([
      {
        id: "root",
        type: "split",
        orientation: "vertical",
        x: 0,
        y: 45,
        width: 100,
        height: 10,
      },
      {
        id: "left",
        type: "panel",
        x: 0,
        y: 0,
        width: 100,
        height: 45,
      },
      {
        id: "right",
        type: "panel",
        x: 0,
        y: 55,
        width: 100,
        height: 45,
      },
    ]);
  });

  it("should return correct layout rects when the root is nested split node", () => {
    const root: SplitNode = {
      id: "root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "left",
        type: "split",
        orientation: "vertical",
        ratio: 0.5,
        left: {
          id: "left-left",
          type: "panel",
        },
        right: {
          id: "left-right",
          type: "panel",
        },
      },
      right: {
        id: "right",
        type: "panel",
      },
    };
    const options = {
      gap: 10,
      size: { width: 100, height: 100 },
    };
    const result = calculateLayoutRects(root, options);
    expect(result).toEqual<LayoutRect[]>([
      {
        id: "root",
        type: "split",
        orientation: "horizontal",
        x: 45,
        y: 0,
        width: 10,
        height: 100,
      },
      {
        id: "left",
        type: "split",
        orientation: "vertical",
        x: 0,
        y: 45,
        width: 45,
        height: 10,
      },
      {
        id: "left-left",
        type: "panel",
        x: 0,
        y: 0,
        width: 45,
        height: 45,
      },
      {
        id: "left-right",
        type: "panel",
        x: 0,
        y: 55,
        width: 45,
        height: 45,
      },
      {
        id: "right",
        type: "panel",
        x: 55,
        y: 0,
        width: 45,
        height: 100,
      },
    ]);
  });
});
