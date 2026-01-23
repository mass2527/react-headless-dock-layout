import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "../types";
import { findParentNode } from "./findParentNode";

describe("findParentNode", () => {
  it("should return null when root is null", () => {
    const result = findParentNode(null, "any-id");
    expect(result).toBe(null);
  });

  it("should return null when root is a panel (no parent exists)", () => {
    const root: PanelNode = {
      id: "panel-1",
      type: "panel",
    };

    const result = findParentNode(root, "panel-1");
    expect(result).toBe(null);
  });

  it("should return null when id is not found in the tree", () => {
    const root: SplitNode = {
      id: "split-1",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: {
        id: "panel-2",
        type: "panel",
      },
    };

    const result = findParentNode(root, "nonexistent");
    expect(result).toBe(null);
  });

  it("should return the parent split node for a direct child", () => {
    const root: SplitNode = {
      id: "split-1",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: {
        id: "panel-2",
        type: "panel",
      },
    };

    const result = findParentNode(root, "panel-1");
    expect(result).toBe(root);
    expect(result?.id).toBe("split-1");
  });

  it("should return the parent split node for the right child", () => {
    const root: SplitNode = {
      id: "split-1",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: {
        id: "panel-2",
        type: "panel",
      },
    };

    const result = findParentNode(root, "panel-2");
    expect(result).toBe(root);
  });

  it("should return null for the root split node itself (no parent)", () => {
    const root: SplitNode = {
      id: "split-1",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: {
        id: "panel-2",
        type: "panel",
      },
    };

    const result = findParentNode(root, "split-1");
    expect(result).toBe(null);
  });

  it("should find parent in nested structure (left branch)", () => {
    const leftSplit: SplitNode = {
      id: "split-left",
      type: "split",
      orientation: "vertical",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: {
        id: "panel-2",
        type: "panel",
      },
    };

    const root: SplitNode = {
      id: "split-root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: leftSplit,
      right: {
        id: "panel-3",
        type: "panel",
      },
    };

    // panel-1's parent should be split-left
    const result = findParentNode(root, "panel-1");
    expect(result).toBe(leftSplit);
    expect(result?.id).toBe("split-left");
  });

  it("should find parent in nested structure (right branch)", () => {
    const rightSplit: SplitNode = {
      id: "split-right",
      type: "split",
      orientation: "vertical",
      ratio: 0.5,
      left: {
        id: "panel-2",
        type: "panel",
      },
      right: {
        id: "panel-3",
        type: "panel",
      },
    };

    const root: SplitNode = {
      id: "split-root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: rightSplit,
    };

    // panel-3's parent should be split-right
    const result = findParentNode(root, "panel-3");
    expect(result).toBe(rightSplit);
  });

  it("should find parent of a nested split node", () => {
    const nestedSplit: SplitNode = {
      id: "split-nested",
      type: "split",
      orientation: "vertical",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: {
        id: "panel-2",
        type: "panel",
      },
    };

    const root: SplitNode = {
      id: "split-root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: nestedSplit,
      right: {
        id: "panel-3",
        type: "panel",
      },
    };

    // split-nested's parent should be split-root
    const result = findParentNode(root, "split-nested");
    expect(result).toBe(root);
  });

  it("should handle deeply nested structures", () => {
    const deepestSplit: SplitNode = {
      id: "split-3",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "panel-deep",
        type: "panel",
      },
      right: {
        id: "panel-4",
        type: "panel",
      },
    };

    const middleSplit: SplitNode = {
      id: "split-2",
      type: "split",
      orientation: "vertical",
      ratio: 0.5,
      left: deepestSplit,
      right: {
        id: "panel-3",
        type: "panel",
      },
    };

    const root: SplitNode = {
      id: "split-1",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "panel-1",
        type: "panel",
      },
      right: middleSplit,
    };

    // panel-deep's parent should be split-3 (deepest split)
    const result = findParentNode(root, "panel-deep");
    expect(result).toBe(deepestSplit);
    expect(result?.id).toBe("split-3");
  });
});
