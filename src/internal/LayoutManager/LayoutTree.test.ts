import { describe, it, expect } from "vitest";
import {
  findNode,
  findParentNode,
  replaceNode,
  removeNode,
  traverseTree,
  getAllPanelIds,
  updateSplitRatio,
  getSiblingNode,
} from "./LayoutTree";
import type { LayoutNode, PanelNode, SplitNode } from "../../types";

// Test fixtures
const panelA: PanelNode = { type: "panel", id: "a" };
const panelB: PanelNode = { type: "panel", id: "b" };
const panelC: PanelNode = { type: "panel", id: "c" };

const simpleSplit: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "horizontal",
  ratio: 0.5,
  left: panelA,
  right: panelB,
};

const nestedTree: SplitNode = {
  type: "split",
  id: "split-root",
  orientation: "horizontal",
  ratio: 0.5,
  left: panelA,
  right: {
    type: "split",
    id: "split-nested",
    orientation: "vertical",
    ratio: 0.6,
    left: panelB,
    right: panelC,
  },
};

describe("findNode", () => {
  it("returns null for null root", () => {
    expect(findNode(null, "a")).toBeNull();
  });

  it("finds a panel at root", () => {
    expect(findNode(panelA, "a")).toBe(panelA);
  });

  it("returns null for non-existent id", () => {
    expect(findNode(panelA, "nonexistent")).toBeNull();
  });

  it("finds nodes in a split", () => {
    expect(findNode(simpleSplit, "a")).toBe(panelA);
    expect(findNode(simpleSplit, "b")).toBe(panelB);
    expect(findNode(simpleSplit, "split-1")).toBe(simpleSplit);
  });

  it("finds deeply nested nodes", () => {
    expect(findNode(nestedTree, "c")).toBe(panelC);
    expect(findNode(nestedTree, "split-nested")).toEqual({
      type: "split",
      id: "split-nested",
      orientation: "vertical",
      ratio: 0.6,
      left: panelB,
      right: panelC,
    });
  });
});

describe("findParentNode", () => {
  it("returns null for null root", () => {
    expect(findParentNode(null, "a")).toBeNull();
  });

  it("returns null for panel root", () => {
    expect(findParentNode(panelA, "a")).toBeNull();
  });

  it("returns null for root node id", () => {
    expect(findParentNode(simpleSplit, "split-1")).toBeNull();
  });

  it("finds parent of direct children", () => {
    expect(findParentNode(simpleSplit, "a")).toBe(simpleSplit);
    expect(findParentNode(simpleSplit, "b")).toBe(simpleSplit);
  });

  it("finds parent of deeply nested nodes", () => {
    const parent = findParentNode(nestedTree, "c");
    expect(parent?.id).toBe("split-nested");
  });
});

describe("replaceNode", () => {
  it("replaces root node", () => {
    const newPanel: PanelNode = { type: "panel", id: "new" };
    const result = replaceNode(panelA, "a", newPanel);
    expect(result).toBe(newPanel);
  });

  it("replaces child in split", () => {
    const newPanel: PanelNode = { type: "panel", id: "new" };
    const result = replaceNode(simpleSplit, "a", newPanel) as SplitNode;
    expect(result.left).toBe(newPanel);
    expect(result.right).toBe(panelB);
  });

  it("replaces deeply nested node", () => {
    const newPanel: PanelNode = { type: "panel", id: "new" };
    const result = replaceNode(nestedTree, "c", newPanel) as SplitNode;
    const nested = result.right as SplitNode;
    expect(nested.right).toBe(newPanel);
  });

  it("returns original node if id not found", () => {
    const result = replaceNode(panelA, "nonexistent", panelB);
    expect(result).toBe(panelA);
  });
});

describe("removeNode", () => {
  it("returns null when removing root panel", () => {
    expect(removeNode(panelA, "a")).toBeNull();
  });

  it("returns sibling when removing left child", () => {
    const result = removeNode(simpleSplit, "a");
    expect(result).toBe(panelB);
  });

  it("returns sibling when removing right child", () => {
    const result = removeNode(simpleSplit, "b");
    expect(result).toBe(panelA);
  });

  it("restructures nested tree correctly", () => {
    const result = removeNode(nestedTree, "c") as SplitNode;
    expect(result.id).toBe("split-root");
    expect(result.right).toBe(panelB);
  });

  it("returns original tree if id not found", () => {
    const result = removeNode(simpleSplit, "nonexistent");
    expect(result).toBe(simpleSplit);
  });
});

describe("traverseTree", () => {
  it("handles null root", () => {
    const visited: string[] = [];
    traverseTree(null, (node) => visited.push(node.id));
    expect(visited).toEqual([]);
  });

  it("visits single panel", () => {
    const visited: string[] = [];
    traverseTree(panelA, (node) => visited.push(node.id));
    expect(visited).toEqual(["a"]);
  });

  it("visits all nodes in pre-order", () => {
    const visited: string[] = [];
    traverseTree(nestedTree, (node) => visited.push(node.id));
    expect(visited).toEqual(["split-root", "a", "split-nested", "b", "c"]);
  });
});

describe("getAllPanelIds", () => {
  it("returns empty array for null root", () => {
    expect(getAllPanelIds(null)).toEqual([]);
  });

  it("returns single id for panel", () => {
    expect(getAllPanelIds(panelA)).toEqual(["a"]);
  });

  it("returns all panel ids", () => {
    expect(getAllPanelIds(nestedTree)).toEqual(["a", "b", "c"]);
  });
});

describe("updateSplitRatio", () => {
  it("returns panel unchanged", () => {
    const result = updateSplitRatio(panelA, "split-1", 0.7);
    expect(result).toBe(panelA);
  });

  it("updates ratio of target split", () => {
    const result = updateSplitRatio(simpleSplit, "split-1", 0.7) as SplitNode;
    expect(result.ratio).toBe(0.7);
    expect(result.id).toBe("split-1");
  });

  it("updates nested split ratio", () => {
    const result = updateSplitRatio(nestedTree, "split-nested", 0.3) as SplitNode;
    const nested = result.right as SplitNode;
    expect(nested.ratio).toBe(0.3);
  });

  it("returns unchanged tree if split not found", () => {
    const result = updateSplitRatio(simpleSplit, "nonexistent", 0.7) as SplitNode;
    expect(result.ratio).toBe(0.5);
  });
});

describe("getSiblingNode", () => {
  it("returns null for null root", () => {
    expect(getSiblingNode(null, "a")).toBeNull();
  });

  it("returns null for root node", () => {
    expect(getSiblingNode(panelA, "a")).toBeNull();
  });

  it("returns right sibling for left child", () => {
    expect(getSiblingNode(simpleSplit, "a")).toBe(panelB);
  });

  it("returns left sibling for right child", () => {
    expect(getSiblingNode(simpleSplit, "b")).toBe(panelA);
  });
});
