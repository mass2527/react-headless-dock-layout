import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "../types";
import { findParentNode } from "./findParentNode";

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
