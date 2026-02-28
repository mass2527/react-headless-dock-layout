import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "../../types";
import { findNode, findParentNode, replaceChildNode } from "./tree";

describe("findNode", () => {
  it("should return null when the root is null", () => {
    expect(findNode(null, "root")).toBeNull();
  });

  it("should return null when the node is not found", () => {
    const root: LayoutNode = {
      id: "root",
      type: "panel",
    };
    expect(findNode(root, "non-existent-id")).toBeNull();
  });

  it("should return node when the node is root panel", () => {
    const root: LayoutNode = {
      id: "root",
      type: "panel",
    };
    expect(findNode(root, "root")).toBe(root);
  });

  it("should return node when the node is root split", () => {
    const root: LayoutNode = {
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
    expect(findNode(root, "root")).toEqual(root);
  });

  it("should return node when the node is a child of the root", () => {
    const left: PanelNode = {
      id: "left",
      type: "panel",
    };
    const root: LayoutNode = {
      id: "root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left,
      right: {
        id: "right",
        type: "panel",
      },
    };
    expect(findNode(root, "left")).toEqual(left);
  });

  it("should return node when the node is a grand child of the root", () => {
    const leftLeft: PanelNode = {
      id: "left-left",
      type: "panel",
    };
    const root: LayoutNode = {
      id: "root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "left",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: leftLeft,
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
    expect(findNode(root, "left-left")).toBe(leftLeft);
  });
});

describe("findParentNode", () => {
  it("should return null when the root is null", () => {
    expect(findParentNode(null, "root")).toBeNull();
  });

  it("should return null when the child node is root panel", () => {
    const root: PanelNode = {
      id: "root",
      type: "panel",
    };
    expect(findParentNode(root, "root")).toBeNull();
  });

  it("should return null when the child node is root split", () => {
    const root: LayoutNode = {
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
    expect(findParentNode(root, "root")).toBeNull();
  });

  it("should return null when the child node is not found", () => {
    const root: LayoutNode = {
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
    expect(findParentNode(root, "non-existent-child-id")).toBeNull();
  });

  it("should return node when the child node is a child of the root", () => {
    const root: LayoutNode = {
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
    expect(findParentNode(root, "left")).toBe(root);
  });

  it("should return node when the child node is a grand child of the root", () => {
    const left: SplitNode = {
      id: "left",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: {
        id: "left-left",
        type: "panel",
      },
      right: {
        id: "left-right",
        type: "panel",
      },
    };
    const root: LayoutNode = {
      id: "root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left,
      right: {
        id: "right",
        type: "panel",
      },
    };
    expect(findParentNode(root, "left-left")).toBe(left);
  });
});

describe("replaceChildNode", () => {
  it("should throw an error if the child node is not a child of the parent node", () => {
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
    expect(() =>
      replaceChildNode(root, "non-existent-child-id", {
        id: "new-child",
        type: "panel",
      }),
    ).toThrow(
      "Node with id non-existent-child-id is not a child of node with id root",
    );
  });

  it("should throw an error if the child node is a grandchild, not a direct child", () => {
    const root: SplitNode = {
      id: "root",
      type: "split",
      orientation: "horizontal",
      ratio: 0.5,
      left: { id: "left", type: "panel" },
      right: {
        id: "right",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: { id: "right-left", type: "panel" },
        right: { id: "right-right", type: "panel" },
      },
    };
    expect(() =>
      replaceChildNode(root, "right-left", {
        id: "new-child",
        type: "panel",
      }),
    ).toThrow(
      "Node with id right-left is not a child of node with id root",
    );
  });

  it("should replace the child node when the child node is the left child of the parent node", () => {
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
    const newChild: PanelNode = {
      id: "new-child",
      type: "panel",
    };
    replaceChildNode(root, "left", newChild);
    expect(root.left).toBe(newChild);
  });

  it("should replace the child node when the child node is the right child of the parent node", () => {
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
    const newChild: PanelNode = {
      id: "new-child",
      type: "panel",
    };
    replaceChildNode(root, "right", newChild);
    expect(root.right).toBe(newChild);
  });
});
