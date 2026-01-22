import { describe, it, expect } from "vitest";
import { calculateLayoutRects } from "./calculateLayoutRects";
import type { PanelNode, SplitNode, PanelLayoutRect, SplitLayoutRect } from "../../types";

const DEFAULT_GAP = 10;

describe("calculateLayoutRects", () => {
  it("returns empty array for null root", () => {
    const result = calculateLayoutRects(null, { width: 100, height: 100 }, { gap: DEFAULT_GAP });
    expect(result).toEqual([]);
  });

  it("single panel fills entire container", () => {
    const panel: PanelNode = { type: "panel", id: "a" };
    const result = calculateLayoutRects(
      panel,
      { width: 800, height: 600 },
      { gap: DEFAULT_GAP }
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "panel",
      id: "a",
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });
  });

  it("horizontal split creates correct child rects", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "a" },
      right: { type: "panel", id: "b" },
    };

    const result = calculateLayoutRects(
      split,
      { width: 210, height: 100 },
      { gap: DEFAULT_GAP }
    );

    // Should have 3 rects: split bar + 2 panels
    expect(result).toHaveLength(3);

    // Find each rect
    const splitBar = result.find((r) => r.type === "split") as SplitLayoutRect;
    const panelA = result.find((r) => r.type === "panel" && r.id === "a") as PanelLayoutRect;
    const panelB = result.find((r) => r.type === "panel" && r.id === "b") as PanelLayoutRect;

    // With 210 width, 10 gap, and 0.5 ratio:
    // Available = 200, left gets 100, right gets 100
    expect(panelA).toEqual({
      type: "panel",
      id: "a",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    expect(splitBar).toEqual({
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      x: 100,
      y: 0,
      width: 10,
      height: 100,
    });

    expect(panelB).toEqual({
      type: "panel",
      id: "b",
      x: 110,
      y: 0,
      width: 100,
      height: 100,
    });
  });

  it("vertical split creates correct child rects", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "vertical",
      ratio: 0.5,
      left: { type: "panel", id: "a" },
      right: { type: "panel", id: "b" },
    };

    const result = calculateLayoutRects(
      split,
      { width: 100, height: 210 },
      { gap: DEFAULT_GAP }
    );

    const splitBar = result.find((r) => r.type === "split") as SplitLayoutRect;
    const panelA = result.find((r) => r.type === "panel" && r.id === "a") as PanelLayoutRect;
    const panelB = result.find((r) => r.type === "panel" && r.id === "b") as PanelLayoutRect;

    expect(panelA).toEqual({
      type: "panel",
      id: "a",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    expect(splitBar).toEqual({
      type: "split",
      id: "split-1",
      orientation: "vertical",
      x: 0,
      y: 100,
      width: 100,
      height: 10,
    });

    expect(panelB).toEqual({
      type: "panel",
      id: "b",
      x: 0,
      y: 110,
      width: 100,
      height: 100,
    });
  });

  it("nested splits calculate correctly", () => {
    const tree: SplitNode = {
      type: "split",
      id: "split-root",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "a" },
      right: {
        type: "split",
        id: "split-nested",
        orientation: "vertical",
        ratio: 0.5,
        left: { type: "panel", id: "b" },
        right: { type: "panel", id: "c" },
      },
    };

    const result = calculateLayoutRects(
      tree,
      { width: 210, height: 210 },
      { gap: DEFAULT_GAP }
    );

    // Should have 5 rects: 2 split bars + 3 panels
    expect(result).toHaveLength(5);

    const panelA = result.find((r) => r.type === "panel" && r.id === "a") as PanelLayoutRect;
    const panelB = result.find((r) => r.type === "panel" && r.id === "b") as PanelLayoutRect;
    const panelC = result.find((r) => r.type === "panel" && r.id === "c") as PanelLayoutRect;

    // Panel A should be on the left half
    expect(panelA.x).toBe(0);
    expect(panelA.width).toBe(100);

    // Panels B and C should be on the right, stacked vertically
    expect(panelB.x).toBe(110);
    expect(panelB.y).toBe(0);
    expect(panelC.x).toBe(110);
    expect(panelC.y).toBe(110);
  });

  it("respects different ratios", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.25,
      left: { type: "panel", id: "a" },
      right: { type: "panel", id: "b" },
    };

    const result = calculateLayoutRects(
      split,
      { width: 410, height: 100 },
      { gap: DEFAULT_GAP }
    );

    const panelA = result.find((r) => r.type === "panel" && r.id === "a") as PanelLayoutRect;
    const panelB = result.find((r) => r.type === "panel" && r.id === "b") as PanelLayoutRect;

    // With 410 width, 10 gap: available = 400
    // 25% of 400 = 100 for left, 300 for right
    expect(panelA.width).toBe(100);
    expect(panelB.width).toBe(300);
  });

  it("handles custom gap size", () => {
    const split: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "a" },
      right: { type: "panel", id: "b" },
    };

    const customGap = 20;
    const result = calculateLayoutRects(
      split,
      { width: 220, height: 100 },
      { gap: customGap }
    );

    const splitBar = result.find((r) => r.type === "split") as SplitLayoutRect;
    const panelA = result.find((r) => r.type === "panel" && r.id === "a") as PanelLayoutRect;
    const panelB = result.find((r) => r.type === "panel" && r.id === "b") as PanelLayoutRect;

    expect(splitBar.width).toBe(customGap);
    expect(panelA.width).toBe(100);
    expect(panelB.width).toBe(100);
    expect(panelB.x).toBe(120); // 100 + 20 gap
  });
});
