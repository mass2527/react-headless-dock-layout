import { describe, expect, it } from "vitest";
import type { PanelNode, SplitNode } from "../../types";
import { calculateMinSize } from "./calculateMinSize";

describe("calculateMinSize", () => {
  describe("edge cases", () => {
    it("should return 0 for panel without minSize", () => {
      const node: PanelNode = {
        type: "panel",
        id: "panel",
      };
      const result = calculateMinSize(node, 10);
      expect(result).toEqual({ width: 0, height: 0 });
    });

    it("should return 0 width when only height is specified", () => {
      const node: PanelNode = {
        type: "panel",
        id: "panel",
        minSize: { height: 100 },
      };
      const result = calculateMinSize(node, 10);
      expect(result).toEqual({ width: 0, height: 100 });
    });

    it("should return 0 height when only width is specified", () => {
      const node: PanelNode = {
        type: "panel",
        id: "panel",
        minSize: { width: 100 },
      };
      const result = calculateMinSize(node, 10);
      expect(result).toEqual({ width: 100, height: 0 });
    });

    it("should handle zero gap", () => {
      const node: SplitNode = {
        type: "split",
        id: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "left", minSize: { width: 50, height: 50 } },
        right: {
          type: "panel",
          id: "right",
          minSize: { width: 50, height: 50 },
        },
      };
      const result = calculateMinSize(node, 0);
      expect(result).toEqual({ width: 100, height: 50 });
    });

    it("should handle mixed minSize specifications in split", () => {
      const node: SplitNode = {
        type: "split",
        id: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "left", minSize: { width: 100, height: 80 } },
        right: { type: "panel", id: "right" }, // No minSize
      };
      const result = calculateMinSize(node, 10);
      expect(result).toEqual({ width: 110, height: 80 }); // 100 + 10 + 0
    });

    it("should handle deeply nested layout with varying minSizes", () => {
      const node: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          type: "split",
          id: "split-2",
          orientation: "vertical",
          ratio: 0.5,
          left: {
            type: "panel",
            id: "panel-1",
            minSize: { width: 100, height: 50 },
          },
          right: { type: "panel", id: "panel-2", minSize: { width: 80, height: 60 } },
        },
        right: {
          type: "split",
          id: "split-3",
          orientation: "vertical",
          ratio: 0.5,
          left: { type: "panel", id: "panel-3" }, // No minSize
          right: {
            type: "panel",
            id: "panel-4",
            minSize: { width: 120, height: 40 },
          },
        },
      };
      const gap = 10;
      const result = calculateMinSize(node, gap);

      // Left branch: max(100, 80) = 100 width, 50 + 10 + 60 = 120 height
      // Right branch: max(0, 120) = 120 width, 0 + 10 + 40 = 50 height
      // Total: 100 + 10 + 120 = 230 width, max(120, 50) = 120 height
      expect(result).toEqual({ width: 230, height: 120 });
    });

    it("should handle alternating horizontal and vertical splits", () => {
      const node: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          type: "split",
          id: "split-2",
          orientation: "vertical",
          ratio: 0.5,
          left: {
            type: "split",
            id: "split-3",
            orientation: "horizontal",
            ratio: 0.5,
            left: {
              type: "panel",
              id: "panel-1",
              minSize: { width: 30, height: 30 },
            },
            right: {
              type: "panel",
              id: "panel-2",
              minSize: { width: 30, height: 30 },
            },
          },
          right: {
            type: "panel",
            id: "panel-3",
            minSize: { width: 50, height: 40 },
          },
        },
        right: {
          type: "panel",
          id: "panel-4",
          minSize: { width: 60, height: 100 },
        },
      };
      const gap = 10;
      const result = calculateMinSize(node, gap);

      // split-3: 30 + 10 + 30 = 70 width, max(30, 30) = 30 height
      // split-2: max(70, 50) = 70 width, 30 + 10 + 40 = 80 height
      // split-1: 70 + 10 + 60 = 140 width, max(80, 100) = 100 height
      expect(result).toEqual({ width: 140, height: 100 });
    });

    it("should handle very large minSize values", () => {
      const node: SplitNode = {
        type: "split",
        id: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          type: "panel",
          id: "left",
          minSize: { width: 10000, height: 5000 },
        },
        right: {
          type: "panel",
          id: "right",
          minSize: { width: 10000, height: 5000 },
        },
      };
      const result = calculateMinSize(node, 10);
      expect(result).toEqual({ width: 20010, height: 5000 });
    });

    it("should handle asymmetric minSize requirements", () => {
      const node: SplitNode = {
        type: "split",
        id: "split",
        orientation: "vertical",
        ratio: 0.5,
        left: {
          type: "panel",
          id: "left",
          minSize: { width: 200, height: 50 },
        },
        right: {
          type: "panel",
          id: "right",
          minSize: { width: 100, height: 150 },
        },
      };
      const result = calculateMinSize(node, 10);
      // Vertical split: max widths, sum heights
      expect(result).toEqual({ width: 200, height: 210 }); // 50 + 10 + 150
    });
  });


  it("should return the min size of a panel node", () => {
    const node: PanelNode = {
      type: "panel",
      id: "panel",
      minSize: { width: 100, height: 100 },
    };
    const result = calculateMinSize(node, 10);
    expect(result).toEqual({ width: 100, height: 100 });
  });

  it("should return the min size of a split node when the orientation is horizontal", () => {
    const node: SplitNode = {
      type: "split",
      id: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "left", minSize: { width: 100, height: 100 } },
      right: {
        type: "panel",
        id: "right",
        minSize: { width: 100, height: 100 },
      },
    };
    const result = calculateMinSize(node, 10);
    expect(result).toEqual({ width: 210, height: 100 });
  });

  it("should return the min size of a split node when the orientation is vertical", () => {
    const node: SplitNode = {
      type: "split",
      id: "split",
      orientation: "vertical",
      ratio: 0.5,
      left: { type: "panel", id: "left", minSize: { width: 100, height: 100 } },
      right: {
        type: "panel",
        id: "right",
        minSize: { width: 100, height: 100 },
      },
    };
    const result = calculateMinSize(node, 10);
    expect(result).toEqual({ width: 100, height: 210 });
  });

  it("should return the min size of a split node when the node is nested", () => {
    const node: SplitNode = {
      type: "split",
      id: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "left", minSize: { width: 100, height: 100 } },
      right: {
        type: "split",
        id: "right",
        orientation: "vertical",
        ratio: 0.5,
        left: {
          type: "panel",
          id: "right-left",
          minSize: { width: 100, height: 100 },
        },
        right: {
          type: "panel",
          id: "right-right",
          minSize: { width: 100, height: 100 },
        },
      },
    };
    const result = calculateMinSize(node, 10);
    expect(result).toEqual({ width: 210, height: 210 });
  });
});
