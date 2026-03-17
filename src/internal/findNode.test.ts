import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode } from "../types";
import { findNode } from "./findNode";

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
