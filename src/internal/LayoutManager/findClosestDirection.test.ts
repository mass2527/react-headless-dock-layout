import { describe, expect, it } from "vitest";
import { findClosestDirection } from "./findClosestDirection";

describe("findClosestDirection", () => {
  it("should return top when the point is at the top edge", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 50, y: 0 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("top");
  });

  it("should return bottom when the point is at the bottom edge", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 50, y: 100 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("bottom");
  });

  it("should return left when the point is at the left edge", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 0, y: 50 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("left");
  });

  it("should return right when the point is at the right edge", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 100, y: 50 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("right");
  });

  it("should return top when the point is in the top directional region", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 50, y: 10 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("top");
  });

  it("should return bottom when the point is in the bottom directional region", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 50, y: 90 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("bottom");
  });

  it("should return left when the point is in the left directional region", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 10, y: 50 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("left");
  });

  it("should return right when the point is in the right directional region", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 90, y: 50 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("right");
  });

  it("returns top when the point lies on the boundary between left and top directional regions", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 25, y: 25 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("top");
  });

  it("returns top when the point lies on the boundary between right and top directional regions", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 75, y: 25 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("top");
  });

  it("should return bottom when the point lies on the boundary between left and bottom directional regions", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 25, y: 75 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("bottom");
  });

  it("should return bottom when the point lies on the boundary between right and bottom directional regions", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 75, y: 75 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("bottom");
  });

  it("should return top when the point lies on the center of the rect", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const point = { x: 50, y: 50 };
    const result = findClosestDirection(rect, point);
    expect(result).toBe("top");
  });
});
