import { describe, expect, it } from "vitest";
import type { LayoutNode, LayoutRect, PanelNode, SplitNode } from "../../types";
import { LayoutManager } from "./LayoutManager";

describe("LayoutManager", () => {
  describe("resizePanel", () => {
    it("should throw an error when the root is null", () => {
      const root = null;
      const layoutManager = new LayoutManager(root);
      expect(() => layoutManager.resizePanel("root", { x: 0, y: 0 })).toThrow(
        "Root node is null",
      );
    });

    it("should throw an error when the rect is not found", () => {
      const root: LayoutNode = {
        id: "root",
        type: "panel",
      };
      const layoutManager = new LayoutManager(root);
      expect(() =>
        layoutManager.resizePanel("non-existent-id", { x: 0, y: 0 }),
      ).toThrow("Rect with id non-existent-id not found");
    });

    it("should throw an error when the rect is not a split node", () => {
      const root: PanelNode = {
        id: "root",
        type: "panel",
      };
      const layoutManager = new LayoutManager(root);
      expect(() => layoutManager.resizePanel("root", { x: 0, y: 0 })).toThrow(
        "Rect with id root is not a split node",
      );
    });

    it("should resize the panel when the root is split node with horizontal orientation", () => {
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
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
        gap: 10,
      });
      layoutManager.resizePanel("root", { x: 30, y: 0 });
      const result: LayoutRect[] = [
        {
          id: "root",
          type: "split",
          orientation: "horizontal",
          x: 25,
          y: 0,
          width: 10,
          height: 100,
        },
        {
          id: "left",
          type: "panel",
          x: 0,
          y: 0,
          width: 25,
          height: 100,
        },
        {
          id: "right",
          type: "panel",
          x: 35,
          y: 0,
          width: 65,
          height: 100,
        },
      ];
      expect(layoutManager.layoutRects).toEqual(result);
    });

    it("should resize the panel if the root is split node with vertical orientation", () => {
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
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
        gap: 10,
      });
      layoutManager.resizePanel("root", { x: 0, y: 30 });
      const result: LayoutRect[] = [
        {
          id: "root",
          type: "split",
          orientation: "vertical",
          x: 0,
          y: 25,
          width: 100,
          height: 10,
        },
        {
          id: "left",
          type: "panel",
          x: 0,
          y: 0,
          width: 100,
          height: 25,
        },
        {
          id: "right",
          type: "panel",
          x: 0,
          y: 35,
          width: 100,
          height: 65,
        },
      ];
      expect(layoutManager.layoutRects).toEqual(result);
    });

    it("should resize the panel based on the `minSize` of the panel", () => {
      const root: LayoutNode | null = {
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "left",
          type: "panel",
          minSize: { width: 40 },
        },
        right: {
          id: "right",
          type: "panel",
        },
      };
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
        gap: 10,
      });
      layoutManager.resizePanel("root", { x: 30, y: 0 });
      const layoutRects = layoutManager.layoutRects;
      expect(layoutRects).toEqual([
        {
          id: "root",
          type: "split",
          orientation: "horizontal",
          x: 40,
          y: 0,
          width: 10,
          height: 100,
        },
        {
          id: "left",
          type: "panel",
          x: 0,
          y: 0,
          width: 40,
          height: 100,
        },
        {
          id: "right",
          type: "panel",
          x: 50,
          y: 0,
          width: 50,
          height: 100,
        },
      ]);
    });
  });

  describe("removePanel", () => {
    it("should throw an error if the root is null", () => {
      const layoutManager = new LayoutManager(null);
      expect(() => layoutManager.removePanel("root")).toThrowError(
        "Root node is null",
      );
    });

    it("should throw an error if the panel is not found", () => {
      const layoutManager = new LayoutManager({
        id: "root",
        type: "panel",
      });
      expect(() => layoutManager.removePanel("nonexistent")).toThrowError(
        "Node with id nonexistent not found",
      );
    });

    it("should throw an error if the panel is not a panel node", () => {
      const layoutManager = new LayoutManager({
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
      });
      expect(() => layoutManager.removePanel("root")).toThrowError(
        "Node with id root is not a panel",
      );
    });

    it("should remove the root panel node", () => {
      const root: LayoutNode = {
        id: "root",
        type: "panel",
      };
      const layoutManager = new LayoutManager(root);
      layoutManager.removePanel("root");
      expect(layoutManager.root).toBe(null);
    });

    it("should remove the child panel node of the root node", () => {
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
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
      });
      layoutManager.removePanel("left");
      expect(layoutManager.root).toEqual<LayoutNode>({
        id: "right",
        type: "panel",
      });
    });

    it("should remove the nested panel node", () => {
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
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
      });
      layoutManager.removePanel("left-left");
      expect(layoutManager.root).toEqual<LayoutNode>({
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "left-right",
          type: "panel",
        },
        right: {
          id: "right",
          type: "panel",
        },
      });
    });
  });

  describe("movePanel", () => {
    it("should throw an error if the root is null", () => {
      const layoutManager = new LayoutManager(null);
      expect(() =>
        layoutManager.movePanel({
          sourceId: "source",
          targetId: "target",
          point: { x: 0, y: 0 },
        }),
      ).toThrowError("Root node is null");
    });

    it("should throw an error if the root is not a split node", () => {
      const layoutManager = new LayoutManager({
        id: "root",
        type: "panel",
      });
      expect(() =>
        layoutManager.movePanel({
          sourceId: "source",
          targetId: "target",
          point: { x: 0, y: 0 },
        }),
      ).toThrowError("Root node is not a split node");
    });

    it("should throw an error if the source node is not found", () => {
      const layoutManager = new LayoutManager({
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
      });
      expect(() =>
        layoutManager.movePanel({
          sourceId: "nonexistent",
          targetId: "target",
          point: { x: 0, y: 0 },
        }),
      ).toThrowError("Node with id nonexistent not found");
    });

    it("should throw an error if the source node is not a panel node", () => {
      const layoutManager = new LayoutManager({
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
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
        },
        right: {
          id: "right",
          type: "panel",
        },
      });
      expect(() =>
        layoutManager.movePanel({
          sourceId: "left",
          targetId: "target",
          point: { x: 0, y: 0 },
        }),
      ).toThrowError("Node with id left is not a panel node");
    });

    it("should throw an error if the target node is not found", () => {
      const layoutManager = new LayoutManager({
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
      });
      expect(() =>
        layoutManager.movePanel({
          sourceId: "left",
          targetId: "nonexistent",
          point: { x: 0, y: 0 },
        }),
      ).toThrowError("Node with id nonexistent not found");
    });

    it("should throw an error if the target node is not a panel node", () => {
      const layoutManager = new LayoutManager({
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
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: "right-left",
            type: "panel",
          },
          right: {
            id: "right-right",
            type: "panel",
          },
        },
      });
      expect(() =>
        layoutManager.movePanel({
          sourceId: "left",
          targetId: "right",
          point: { x: 0, y: 0 },
        }),
      ).toThrowError("Node with id right is not a panel node");
    });

    it("should move the panel when the source node is the sibling of the target node", () => {
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
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
      });
      layoutManager.movePanel({
        sourceId: "right",
        targetId: "left",
        point: { x: 0, y: 50 },
      });
      expect(layoutManager.root).toEqual<LayoutNode>({
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "right",
          type: "panel",
        },
        right: {
          id: "left",
          type: "panel",
        },
      });
    });

    it("should move the panel when the source node does not have a grand parent node", () => {
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
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: "right-left",
            type: "panel",
          },
          right: {
            id: "right-right",
            type: "panel",
          },
        },
      };
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
      });
      layoutManager.movePanel({
        sourceId: "left",
        targetId: "right-left",
        point: { x: 60, y: 8 },
      });

      expect(layoutManager.root).toEqual<LayoutNode>({
        id: "right",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: expect.any(String),
          type: "split",
          orientation: "vertical",
          ratio: 0.5,
          left: {
            id: "left",
            type: "panel",
          },
          right: {
            id: "right-left",
            type: "panel",
          },
        },
        right: {
          id: "right-right",
          type: "panel",
        },
      });
    });

    it("should move the panel when the source node has a grand parent node", () => {
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
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: "right-left",
            type: "panel",
          },
          right: {
            id: "right-right",
            type: "panel",
          },
        },
      };
      const layoutManager = new LayoutManager(root, {
        size: { width: 100, height: 100 },
      });
      layoutManager.movePanel({
        sourceId: "left-left",
        targetId: "right-left",
        point: { x: 60, y: 8 },
      });
      expect(layoutManager.root).toEqual<LayoutNode>({
        id: "root",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "left-right",
          type: "panel",
        },
        right: {
          id: "right",
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: expect.any(String),
            type: "split",
            orientation: "vertical",
            ratio: 0.5,
            left: {
              id: "left-left",
              type: "panel",
            },
            right: {
              id: "right-left",
              type: "panel",
            },
          },
          right: {
            id: "right-right",
            type: "panel",
          },
        },
      });
    });
  });

  describe("addPanel", () => {
    describe("common behavior (when root is null)", () => {
      it("should add panel with given id when the root is null", () => {
        const root = null;
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: "abc-123",
          type: "panel",
        });
      });
    });

    describe("when options are not provided (default addPanelStrategy is applied)", () => {
      it("should add panel to the right of the root with correct ratio when the root is a panel node", () => {
        const root: LayoutNode = {
          id: "root",
          type: "panel",
        };
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: expect.any(String),
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: "root",
            type: "panel",
          },
          right: {
            id: "abc-123",
            type: "panel",
          },
        });
      });

      it("should add panel to the right of the root with correct ratio when the root is a split node with horizontal orientation", () => {
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
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: expect.any(String),
          type: "split",
          orientation: "horizontal",
          ratio: 2 / 3,
          left: {
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
          },
          right: {
            id: "abc-123",
            type: "panel",
          },
        });
      });

      it("should add panel to the right of the root with correct ratio when the root is a split node with vertical orientation", () => {
        const root: LayoutNode = {
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
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: expect.any(String),
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
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
          },
          right: {
            id: "abc-123",
            type: "panel",
          },
        });
      });

      it("should add panel to the right of the root with correct ratio when the root is a nested split node", () => {
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
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: expect.any(String),
          type: "split",
          orientation: "horizontal",
          ratio: 0.75,
          left: {
            id: "root",
            type: "split",
            orientation: "horizontal",
            ratio: 0.5,
            left: {
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
            },
            right: {
              id: "right",
              type: "panel",
            },
          },
          right: {
            id: "abc-123",
            type: "panel",
          },
        });
      });
    });

    describe("when options are provided", () => {
      it("should add panel to the root when the root is a panel node", () => {
        const root: LayoutNode = {
          id: "root",
          type: "panel",
        };
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123", targetId: "root" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: expect.any(String),
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: "root",
            type: "panel",
          },
          right: {
            id: "abc-123",
            type: "panel",
          },
        });
      });

      it("should add panel to the root when the root is a split node", () => {
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
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123", targetId: "root" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: expect.any(String),
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
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
          },
          right: {
            id: "abc-123",
            type: "panel",
          },
        });
      });

      it("should throw an error if the target node is not found", () => {
        const root: LayoutNode = {
          id: "root",
          type: "panel",
        };
        const layoutManager = new LayoutManager(root);
        expect(() =>
          layoutManager.addPanel({ id: "abc-123", targetId: "nonexistent" }),
        ).toThrowError("Node with id nonexistent not found");
      });

      it("should add panel to the non-root", () => {
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
        const layoutManager = new LayoutManager(root);
        layoutManager.addPanel({ id: "abc-123", targetId: "left" });
        expect(layoutManager.root).toEqual<LayoutNode>({
          id: "root",
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: expect.any(String),
            type: "split",
            orientation: "horizontal",
            ratio: 0.5,
            left: {
              id: "left",
              type: "panel",
            },
            right: {
              id: "abc-123",
              type: "panel",
            },
          },
          right: {
            id: "right",
            type: "panel",
          },
        });
      });
    });
  });
});
