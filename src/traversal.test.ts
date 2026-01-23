import { describe, expect, it, vi } from "vitest";
import {
  countPanels,
  findAllPanels,
  findAllSplits,
  findNodeById,
  findPanelById,
  getPanelIds,
  getTreeDepth,
  traverseLayout,
} from "./traversal";
import type { LayoutNode, PanelNode, SplitNode } from "./types";

// Test fixtures
const singlePanel: PanelNode = { type: "panel", id: "panel-1" };

const simpleSplit: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "horizontal",
  ratio: 0.5,
  left: { type: "panel", id: "panel-1" },
  right: { type: "panel", id: "panel-2" },
};

const nestedLayout: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "horizontal",
  ratio: 0.5,
  left: {
    type: "split",
    id: "split-2",
    orientation: "vertical",
    ratio: 0.3,
    left: { type: "panel", id: "panel-1" },
    right: { type: "panel", id: "panel-2" },
  },
  right: {
    type: "split",
    id: "split-3",
    orientation: "vertical",
    ratio: 0.7,
    left: { type: "panel", id: "panel-3" },
    right: { type: "panel", id: "panel-4" },
  },
};

describe("traverseLayout", () => {
  it("should handle null layout", () => {
    const callback = vi.fn();
    traverseLayout(null, callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should visit single panel", () => {
    const visited: string[] = [];
    traverseLayout(singlePanel, ({ node }) => {
      visited.push(node.id);
    });
    expect(visited).toEqual(["panel-1"]);
  });

  it("should visit all nodes in a split layout", () => {
    const visited: string[] = [];
    traverseLayout(simpleSplit, ({ node }) => {
      visited.push(node.id);
    });
    expect(visited).toEqual(["split-1", "panel-1", "panel-2"]);
  });

  it("should visit nodes in depth-first order", () => {
    const visited: string[] = [];
    traverseLayout(nestedLayout, ({ node }) => {
      visited.push(node.id);
    });
    expect(visited).toEqual([
      "split-1",
      "split-2",
      "panel-1",
      "panel-2",
      "split-3",
      "panel-3",
      "panel-4",
    ]);
  });

  it("should provide correct depth information", () => {
    const depths: Array<{ id: string; depth: number }> = [];
    traverseLayout(nestedLayout, ({ node, depth }) => {
      depths.push({ id: node.id, depth });
    });
    expect(depths).toEqual([
      { id: "split-1", depth: 0 },
      { id: "split-2", depth: 1 },
      { id: "panel-1", depth: 2 },
      { id: "panel-2", depth: 2 },
      { id: "split-3", depth: 1 },
      { id: "panel-3", depth: 2 },
      { id: "panel-4", depth: 2 },
    ]);
  });

  it("should provide correct path information", () => {
    const paths: Array<{ id: string; path: string[] }> = [];
    traverseLayout(nestedLayout, ({ node, path }) => {
      paths.push({ id: node.id, path: [...path] });
    });
    expect(paths).toEqual([
      { id: "split-1", path: [] },
      { id: "split-2", path: ["left"] },
      { id: "panel-1", path: ["left", "left"] },
      { id: "panel-2", path: ["left", "right"] },
      { id: "split-3", path: ["right"] },
      { id: "panel-3", path: ["right", "left"] },
      { id: "panel-4", path: ["right", "right"] },
    ]);
  });

  it("should stop traversal when callback returns false", () => {
    const visited: string[] = [];
    traverseLayout(nestedLayout, ({ node }) => {
      visited.push(node.id);
      if (node.id === "panel-1") {
        return false;
      }
    });
    expect(visited).toEqual(["split-1", "split-2", "panel-1"]);
  });

  it("should continue traversal when callback returns undefined", () => {
    const visited: string[] = [];
    traverseLayout(simpleSplit, ({ node }) => {
      visited.push(node.id);
      // no return value
    });
    expect(visited).toEqual(["split-1", "panel-1", "panel-2"]);
  });

  it("should continue traversal when callback returns true", () => {
    const visited: string[] = [];
    traverseLayout(simpleSplit, ({ node }) => {
      visited.push(node.id);
      return true;
    });
    expect(visited).toEqual(["split-1", "panel-1", "panel-2"]);
  });
});

describe("findAllPanels", () => {
  it("should return empty array for null layout", () => {
    expect(findAllPanels(null)).toEqual([]);
  });

  it("should return single panel for panel layout", () => {
    const panels = findAllPanels(singlePanel);
    expect(panels).toHaveLength(1);
    expect(panels[0]?.id).toBe("panel-1");
  });

  it("should return all panels in a split layout", () => {
    const panels = findAllPanels(simpleSplit);
    expect(panels).toHaveLength(2);
    expect(panels.map((p) => p.id)).toEqual(["panel-1", "panel-2"]);
  });

  it("should return all panels in a nested layout", () => {
    const panels = findAllPanels(nestedLayout);
    expect(panels).toHaveLength(4);
    expect(panels.map((p) => p.id)).toEqual([
      "panel-1",
      "panel-2",
      "panel-3",
      "panel-4",
    ]);
  });
});

describe("findAllSplits", () => {
  it("should return empty array for null layout", () => {
    expect(findAllSplits(null)).toEqual([]);
  });

  it("should return empty array for panel layout", () => {
    expect(findAllSplits(singlePanel)).toEqual([]);
  });

  it("should return split node in a simple split layout", () => {
    const splits = findAllSplits(simpleSplit);
    expect(splits).toHaveLength(1);
    expect(splits[0]?.id).toBe("split-1");
  });

  it("should return all splits in a nested layout", () => {
    const splits = findAllSplits(nestedLayout);
    expect(splits).toHaveLength(3);
    expect(splits.map((s) => s.id)).toEqual(["split-1", "split-2", "split-3"]);
  });
});

describe("countPanels", () => {
  it("should return 0 for null layout", () => {
    expect(countPanels(null)).toBe(0);
  });

  it("should return 1 for single panel", () => {
    expect(countPanels(singlePanel)).toBe(1);
  });

  it("should return 2 for simple split", () => {
    expect(countPanels(simpleSplit)).toBe(2);
  });

  it("should return 4 for nested layout", () => {
    expect(countPanels(nestedLayout)).toBe(4);
  });
});

describe("findNodeById", () => {
  it("should return null for null layout", () => {
    expect(findNodeById(null, "panel-1")).toBe(null);
  });

  it("should find panel node by id", () => {
    const node = findNodeById(singlePanel, "panel-1");
    expect(node).toBe(singlePanel);
  });

  it("should find split node by id", () => {
    const node = findNodeById(simpleSplit, "split-1");
    expect(node).toBe(simpleSplit);
  });

  it("should find nested panel by id", () => {
    const node = findNodeById(nestedLayout, "panel-3");
    expect(node).not.toBeNull();
    expect(node?.id).toBe("panel-3");
    expect(node?.type).toBe("panel");
  });

  it("should find nested split by id", () => {
    const node = findNodeById(nestedLayout, "split-2");
    expect(node).not.toBeNull();
    expect(node?.id).toBe("split-2");
    expect(node?.type).toBe("split");
  });

  it("should return null for non-existent id", () => {
    expect(findNodeById(nestedLayout, "non-existent")).toBe(null);
  });
});

describe("findPanelById", () => {
  it("should return null for null layout", () => {
    expect(findPanelById(null, "panel-1")).toBe(null);
  });

  it("should find panel by id", () => {
    const panel = findPanelById(nestedLayout, "panel-2");
    expect(panel).not.toBeNull();
    expect(panel?.id).toBe("panel-2");
  });

  it("should return null for split node id", () => {
    expect(findPanelById(nestedLayout, "split-1")).toBe(null);
  });

  it("should return null for non-existent id", () => {
    expect(findPanelById(nestedLayout, "non-existent")).toBe(null);
  });
});

describe("getPanelIds", () => {
  it("should return empty array for null layout", () => {
    expect(getPanelIds(null)).toEqual([]);
  });

  it("should return single id for panel layout", () => {
    expect(getPanelIds(singlePanel)).toEqual(["panel-1"]);
  });

  it("should return all panel ids in order", () => {
    expect(getPanelIds(nestedLayout)).toEqual([
      "panel-1",
      "panel-2",
      "panel-3",
      "panel-4",
    ]);
  });
});

describe("getTreeDepth", () => {
  it("should return -1 for null layout", () => {
    expect(getTreeDepth(null)).toBe(-1);
  });

  it("should return 0 for single panel", () => {
    expect(getTreeDepth(singlePanel)).toBe(0);
  });

  it("should return 1 for simple split", () => {
    expect(getTreeDepth(simpleSplit)).toBe(1);
  });

  it("should return 2 for nested layout", () => {
    expect(getTreeDepth(nestedLayout)).toBe(2);
  });

  it("should return correct depth for unbalanced tree", () => {
    const unbalanced: LayoutNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "panel-1" },
      right: {
        type: "split",
        id: "split-2",
        orientation: "vertical",
        ratio: 0.5,
        left: { type: "panel", id: "panel-2" },
        right: {
          type: "split",
          id: "split-3",
          orientation: "horizontal",
          ratio: 0.5,
          left: { type: "panel", id: "panel-3" },
          right: { type: "panel", id: "panel-4" },
        },
      },
    };
    expect(getTreeDepth(unbalanced)).toBe(3);
  });
});
