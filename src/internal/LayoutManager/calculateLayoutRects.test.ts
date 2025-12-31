import { describe, expect, it } from "vitest";
import type { LayoutRect, PanelNode, SplitNode } from "../../types";
import { calculateLayoutRects } from "./calculateLayoutRects";

describe("calculateLayoutRects", () => {
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
