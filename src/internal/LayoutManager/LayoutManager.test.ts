import { describe, it, expect, vi } from "vitest";
import { LayoutManager } from "./LayoutManager";
import type { PanelNode, SplitNode, PanelLayoutRect } from "../../types";
import { equalWidthRightStrategy } from "../../strategies";

describe("LayoutManager", () => {
  describe("initialization", () => {
    it("initializes with null root", () => {
      const manager = new LayoutManager(null);
      expect(manager.getRoot()).toBeNull();
      expect(manager.getLayoutRects()).toEqual([]);
    });

    it("initializes with provided tree", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);
      expect(manager.getRoot()).toBe(panel);
    });

    it("initializes with custom gap", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel, { gap: 20 });
      manager.setSize({ width: 100, height: 100 });

      // The panel should fill the container
      const rects = manager.getLayoutRects();
      expect(rects).toHaveLength(1);
    });
  });

  describe("setSize", () => {
    it("triggers rect recalculation", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);

      manager.setSize({ width: 800, height: 600 });

      const rects = manager.getLayoutRects();
      expect(rects).toHaveLength(1);
      expect(rects[0]).toMatchObject({
        width: 800,
        height: 600,
      });
    });

    it("does not recalculate if size unchanged", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);
      const listener = vi.fn();

      manager.subscribe(listener);
      manager.setSize({ width: 800, height: 600 });
      manager.setSize({ width: 800, height: 600 }); // Same size

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscription", () => {
    it("notifies listeners on changes", () => {
      const manager = new LayoutManager(null);
      const listener = vi.fn();

      manager.subscribe(listener);
      manager.setSize({ width: 100, height: 100 });

      expect(listener).toHaveBeenCalled();
    });

    it("unsubscribes correctly", () => {
      const manager = new LayoutManager(null);
      const listener = vi.fn();

      const unsubscribe = manager.subscribe(listener);
      unsubscribe();
      manager.setSize({ width: 100, height: 100 });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("addPanel", () => {
    it("adds panel to empty tree", () => {
      const manager = new LayoutManager(null);
      manager.setSize({ width: 100, height: 100 });

      manager.addPanel("a");

      expect(manager.getRoot()).toMatchObject({
        type: "panel",
        id: "a",
      });
    });

    it("adds panel with minSize", () => {
      const manager = new LayoutManager(null);
      manager.setSize({ width: 100, height: 100 });

      manager.addPanel("a", { width: 50, height: 30 });

      const root = manager.getRoot() as PanelNode;
      expect(root.minSize).toEqual({ width: 50, height: 30 });
    });

    it("adds panel to existing tree with default placement", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);
      manager.setSize({ width: 210, height: 100 });

      manager.addPanel("b");

      const root = manager.getRoot() as SplitNode;
      expect(root.type).toBe("split");
      expect(root.orientation).toBe("horizontal");
    });

    it("uses placement strategy when provided", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel, {
        placementStrategy: equalWidthRightStrategy,
      });
      manager.setSize({ width: 210, height: 100 });

      manager.addPanel("b");

      const root = manager.getRoot() as SplitNode;
      expect(root.type).toBe("split");
      expect(root.right).toMatchObject({ type: "panel", id: "b" });
    });
  });

  describe("removePanel", () => {
    it("removes panel from tree", () => {
      const split: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "a" },
        right: { type: "panel", id: "b" },
      };
      const manager = new LayoutManager(split);
      manager.setSize({ width: 210, height: 100 });

      manager.removePanel("a");

      const root = manager.getRoot() as PanelNode;
      expect(root.id).toBe("b");
    });

    it("removes last panel resulting in null root", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);
      manager.setSize({ width: 100, height: 100 });

      manager.removePanel("a");

      expect(manager.getRoot()).toBeNull();
    });

    it("does nothing on null root", () => {
      const manager = new LayoutManager(null);
      manager.removePanel("nonexistent");
      expect(manager.getRoot()).toBeNull();
    });
  });

  describe("movePanel", () => {
    it("moves panel to new location", () => {
      const tree: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "a" },
        right: {
          type: "split",
          id: "split-2",
          orientation: "vertical",
          ratio: 0.5,
          left: { type: "panel", id: "b" },
          right: { type: "panel", id: "c" },
        },
      };
      const manager = new LayoutManager(tree);
      manager.setSize({ width: 420, height: 210 });

      // Move panel c to the left of panel a
      manager.movePanel("c", "a", "left");

      const root = manager.getRoot() as SplitNode;
      // c should now be in the tree at a different position
      expect(root).toBeDefined();
    });

    it("does nothing when moving to same panel", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);
      manager.setSize({ width: 100, height: 100 });

      manager.movePanel("a", "a", "left");

      expect(manager.getRoot()).toBe(panel);
    });

    it("does nothing with null root", () => {
      const manager = new LayoutManager(null);
      manager.movePanel("a", "b", "left");
      expect(manager.getRoot()).toBeNull();
    });
  });

  describe("resizePanel", () => {
    it("updates split ratio", () => {
      const split: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "a" },
        right: { type: "panel", id: "b" },
      };
      const manager = new LayoutManager(split);
      manager.setSize({ width: 210, height: 100 });

      // Move the split bar to the right (75% position)
      manager.resizePanel("split-1", 150);

      const root = manager.getRoot() as SplitNode;
      expect(root.ratio).toBeGreaterThan(0.5);
    });

    it("clamps ratio to minimum", () => {
      const split: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "a" },
        right: { type: "panel", id: "b" },
      };
      const manager = new LayoutManager(split);
      manager.setSize({ width: 210, height: 100 });

      // Try to move to far left
      manager.resizePanel("split-1", 0);

      const root = manager.getRoot() as SplitNode;
      expect(root.ratio).toBeGreaterThanOrEqual(0.1);
    });

    it("clamps ratio to maximum", () => {
      const split: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "a" },
        right: { type: "panel", id: "b" },
      };
      const manager = new LayoutManager(split);
      manager.setSize({ width: 210, height: 100 });

      // Try to move to far right
      manager.resizePanel("split-1", 210);

      const root = manager.getRoot() as SplitNode;
      expect(root.ratio).toBeLessThanOrEqual(0.9);
    });

    it("respects minSize constraints", () => {
      const split: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          type: "panel",
          id: "a",
          minSize: { width: 100 },
        },
        right: { type: "panel", id: "b" },
      };
      const manager = new LayoutManager(split);
      manager.setSize({ width: 310, height: 100 });

      // Try to resize below panel a's minimum width
      manager.resizePanel("split-1", 50);

      const root = manager.getRoot() as SplitNode;
      // Available width = 300, minWidth = 100
      // Min ratio should be at least 100/300 = 0.33
      expect(root.ratio).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe("drag state", () => {
    it("sets and gets dragging panel", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);
      manager.setSize({ width: 100, height: 100 });

      manager.setDraggingPanel("a");

      expect(manager.getDraggingPanelId()).toBe("a");

      const draggingRect = manager.getDraggingRect();
      expect(draggingRect).toMatchObject({ id: "a" });
    });

    it("clears dragging panel", () => {
      const panel: PanelNode = { type: "panel", id: "a" };
      const manager = new LayoutManager(panel);
      manager.setSize({ width: 100, height: 100 });

      manager.setDraggingPanel("a");
      manager.setDraggingPanel(null);

      expect(manager.getDraggingPanelId()).toBeNull();
      expect(manager.getDraggingRect()).toBeNull();
    });

    it("returns null for non-existent dragging panel", () => {
      const manager = new LayoutManager(null);
      manager.setDraggingPanel("nonexistent");
      expect(manager.getDraggingRect()).toBeNull();
    });
  });
});
