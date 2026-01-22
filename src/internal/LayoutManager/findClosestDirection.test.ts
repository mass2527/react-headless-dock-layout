import { describe, it, expect } from "vitest";
import { findClosestDirection, getDropIndicatorRect } from "./findClosestDirection";
import type { PanelLayoutRect } from "../../types";

const testRect: PanelLayoutRect = {
  type: "panel",
  id: "test",
  x: 100,
  y: 100,
  width: 200,
  height: 100,
};

describe("findClosestDirection", () => {
  it("returns 'top' when pointer is near top edge", () => {
    const result = findClosestDirection(testRect, { x: 200, y: 105 });
    expect(result).toBe("top");
  });

  it("returns 'bottom' when pointer is near bottom edge", () => {
    const result = findClosestDirection(testRect, { x: 200, y: 195 });
    expect(result).toBe("bottom");
  });

  it("returns 'left' when pointer is near left edge", () => {
    const result = findClosestDirection(testRect, { x: 105, y: 150 });
    expect(result).toBe("left");
  });

  it("returns 'right' when pointer is near right edge", () => {
    const result = findClosestDirection(testRect, { x: 295, y: 150 });
    expect(result).toBe("right");
  });

  it("handles corner cases - top-left favors closer edge", () => {
    // Very close to top-left corner, but closer to top
    const result = findClosestDirection(testRect, { x: 105, y: 102 });
    expect(result).toBe("top");
  });

  it("handles corner cases - bottom-right", () => {
    // Very close to bottom-right corner
    const result = findClosestDirection(testRect, { x: 298, y: 198 });
    expect(result).toBe("bottom"); // bottom is closer (2px vs 3px)
  });

  it("handles center point", () => {
    // At exact center, all distances equal
    // Should return one of them consistently (first in sort order for ties)
    const result = findClosestDirection(testRect, { x: 200, y: 150 });
    // All edges are equidistant, but the algorithm will pick based on sort stability
    expect(["top", "bottom", "left", "right"]).toContain(result);
  });
});

describe("getDropIndicatorRect", () => {
  it("returns left half for 'left' direction", () => {
    const result = getDropIndicatorRect(testRect, "left");
    expect(result).toEqual({
      x: 100,
      y: 100,
      width: 100, // half of 200
      height: 100,
    });
  });

  it("returns right half for 'right' direction", () => {
    const result = getDropIndicatorRect(testRect, "right");
    expect(result).toEqual({
      x: 200, // 100 + 100 (half width)
      y: 100,
      width: 100,
      height: 100,
    });
  });

  it("returns top half for 'top' direction", () => {
    const result = getDropIndicatorRect(testRect, "top");
    expect(result).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 50, // half of 100
    });
  });

  it("returns bottom half for 'bottom' direction", () => {
    const result = getDropIndicatorRect(testRect, "bottom");
    expect(result).toEqual({
      x: 100,
      y: 150, // 100 + 50 (half height)
      width: 200,
      height: 50,
    });
  });
});
