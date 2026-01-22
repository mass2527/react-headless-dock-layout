import { describe, it, expect } from "vitest";
import { calculateMinSize } from "./calculateMinSize";
import type { PanelNode, SplitNode } from "../../types";

const DEFAULT_GAP = 10;

describe("calculateMinSize", () => {
  it("panel with no minSize returns zeros", () => {
    const panel: PanelNode = { type: "panel", id: "a" };
    const result = calculateMinSize(panel, DEFAULT_GAP);
    expect(result).toEqual({ width: 0, height: 0 });
  });

  it("panel with minSize returns those values", () => {
    const panel: PanelNode = {
      type: "panel",
      id: "a",
      minSize: { width: 100, height: 50 },
    };
    const result = calculateMinSize(panel, DEFAULT_GAP);
    expect(result).toEqual({ width: 100, height: 50 });
  });

  it("panel with partial minSize uses 0 for missing", () => {
    const panel: PanelNode = {
      type: "panel",
      id: "a",
      minSize: { width: 100 },
    };
    const result = calculateMinSize(panel, DEFAULT_GAP);
    expect(result).toEqual({ width: 100, height: 0 });
  });

  it("horizontal split sums widths and takes max height", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        type: "panel",
        id: "a",
        minSize: { width: 100, height: 50 },
      },
      right: {
        type: "panel",
        id: "b",
        minSize: { width: 150, height: 80 },
      },
    };

    const result = calculateMinSize(split, DEFAULT_GAP);
    // Width: 100 + 10 (gap) + 150 = 260
    // Height: max(50, 80) = 80
    expect(result).toEqual({ width: 260, height: 80 });
  });

  it("vertical split sums heights and takes max width", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "vertical",
      ratio: 0.5,
      left: {
        type: "panel",
        id: "a",
        minSize: { width: 100, height: 50 },
      },
      right: {
        type: "panel",
        id: "b",
        minSize: { width: 150, height: 80 },
      },
    };

    const result = calculateMinSize(split, DEFAULT_GAP);
    // Width: max(100, 150) = 150
    // Height: 50 + 10 (gap) + 80 = 140
    expect(result).toEqual({ width: 150, height: 140 });
  });

  it("nested structure accumulates correctly", () => {
    const tree: SplitNode = {
      type: "split",
      id: "split-root",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        type: "panel",
        id: "a",
        minSize: { width: 100, height: 200 },
      },
      right: {
        type: "split",
        id: "split-nested",
        orientation: "vertical",
        ratio: 0.5,
        left: {
          type: "panel",
          id: "b",
          minSize: { width: 150, height: 50 },
        },
        right: {
          type: "panel",
          id: "c",
          minSize: { width: 120, height: 60 },
        },
      },
    };

    const result = calculateMinSize(tree, DEFAULT_GAP);

    // Nested vertical split:
    // - Width: max(150, 120) = 150
    // - Height: 50 + 10 + 60 = 120

    // Root horizontal split:
    // - Width: 100 + 10 + 150 = 260
    // - Height: max(200, 120) = 200

    expect(result).toEqual({ width: 260, height: 200 });
  });

  it("handles panels with no minSize in splits", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "a" },
      right: { type: "panel", id: "b" },
    };

    const result = calculateMinSize(split, DEFAULT_GAP);
    // Width: 0 + 10 + 0 = 10
    // Height: max(0, 0) = 0
    expect(result).toEqual({ width: 10, height: 0 });
  });

  it("respects custom gap size", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        type: "panel",
        id: "a",
        minSize: { width: 100, height: 50 },
      },
      right: {
        type: "panel",
        id: "b",
        minSize: { width: 100, height: 50 },
      },
    };

    const customGap = 20;
    const result = calculateMinSize(split, customGap);
    expect(result).toEqual({ width: 220, height: 50 });
  });
});
