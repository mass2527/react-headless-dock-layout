import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "../types";
import { replaceChildNode } from "./replaceChildNode";

describe("replaceChildNode", () => {
  it("should throw an error if the child node is not a child of the parent node", () => {
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
      replaceChildNode({
        parent: root,
        oldChildId: "right-left",
        newChild: { id: "new-child", type: "panel" },
      }),
    ).toThrow(
      "Child node with id right-left is not a child of the parent node with id root",
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
    replaceChildNode({
      parent: root,
      oldChildId: "left",
      newChild: newChild,
    });
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
    replaceChildNode({
      parent: root,
      oldChildId: "right",
      newChild: newChild,
    });
    expect(root.right).toBe(newChild);
  });
});
