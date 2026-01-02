import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "../../types";
import { LayoutTree } from "./LayoutTree";

describe("LayoutTree", () => {
  describe("findNode", () => {
    it("should return null when the root is null", () => {
      const root = null;
      const tree = new LayoutTree(root);
      expect(tree.findNode("root")).toBeNull();
    });

    it("should return null when the node is not found", () => {
      const root: LayoutNode = {
        id: "root",
        type: "panel",
      };
      const tree = new LayoutTree(root);
      expect(tree.findNode("non-existent-id")).toBeNull();
    });

    it("should return node when the node is root panel", () => {
      const root: LayoutNode = {
        id: "root",
        type: "panel",
      };
      const tree = new LayoutTree(root);
      expect(tree.findNode("root")).toBe(root);
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
      const tree = new LayoutTree(root);
      expect(tree.findNode("root")).toEqual(root);
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
      const tree = new LayoutTree(root);
      expect(tree.findNode("left")).toEqual(left);
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
      const tree = new LayoutTree(root);
      expect(tree.findNode("left-left")).toBe(leftLeft);
    });
  });

  describe("findParentNode", () => {
    it("should return null when the root is null", () => {
      const root = null;
      const tree = new LayoutTree(root);
      expect(tree.findParentNode("root")).toBeNull();
    });

    it("should return null when the child node is root panel", () => {
      const root: PanelNode = {
        id: "root",
        type: "panel",
      };
      const tree = new LayoutTree(root);
      expect(tree.findParentNode("root")).toBeNull();
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
      const tree = new LayoutTree(root);
      expect(tree.findParentNode("root")).toBeNull();
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
      const tree = new LayoutTree(root);
      expect(tree.findParentNode("non-existent-child-id")).toBeNull();
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
      const tree = new LayoutTree(root);
      expect(tree.findParentNode("left")).toBe(root);
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
      const tree = new LayoutTree(root);
      expect(tree.findParentNode("left-left")).toBe(left);
    });
  });

  describe("replaceChildNode", () => {
    it("should throw an error if the child node is not found", () => {
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
      const tree = new LayoutTree(root);
      expect(() =>
        tree.replaceChildNode({
          parent: root,
          oldChildId: "non-existent-child-id",
          newChild: { id: "new-child", type: "panel" },
        }),
      ).toThrowError("Child node with id non-existent-child-id not found");
    });

    it("should throw an error if the child node is not a child of the parent node", () => {
      const root: LayoutNode = {
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
      const tree = new LayoutTree(root);
      expect(() =>
        tree.replaceChildNode({
          parent: root,
          oldChildId: "right-left",
          newChild: { id: "new-child", type: "panel" },
        }),
      ).toThrow(
        "Child node with id right-left is not a child of the parent node with id root",
      );
    });

    it("should replace the child node when the child node is the left child of the parent node", () => {
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
      const tree = new LayoutTree(root);
      const newChild: PanelNode = {
        id: "new-child",
        type: "panel",
      };
      tree.replaceChildNode({
        parent: root,
        oldChildId: "left",
        newChild: newChild,
      });
      expect(root.left).toBe(newChild);
    });

    it("should replace the child node when the child node is the right child of the parent node", () => {
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
      const tree = new LayoutTree(root);
      const newChild: PanelNode = {
        id: "new-child",
        type: "panel",
      };
      tree.replaceChildNode({
        parent: root,
        oldChildId: "right",
        newChild: newChild,
      });
      expect(root.right).toBe(newChild);
    });
  });
});
