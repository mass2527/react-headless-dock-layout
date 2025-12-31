import { describe, expect, it } from "vitest";
import type { PanelNode, SplitNode } from "../../types";
import { calculateMinSize } from "./calculateMinSize";

describe("calculateMinSize", () => {
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
