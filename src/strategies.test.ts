import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "./types";
import { equalWidthRightStrategy } from "./strategies";

describe("equalWidthRightStrategy", () => {
  describe("getPlacementOnAdd", () => {
    it("should return targetId as root id and ratio 0.5 for a single panel", () => {
      const root: PanelNode = {
        id: "panel-1",
        type: "panel",
      };

      const result = equalWidthRightStrategy.getPlacementOnAdd(root);

      expect(result).toEqual({
        targetId: "panel-1",
        direction: "right",
        ratio: 0.5,
      });
    });

    it("should return ratio 2/3 for one horizontal split (2 panels)", () => {
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

      const result = equalWidthRightStrategy.getPlacementOnAdd(root);

      expect(result).toEqual({
        targetId: "split-1",
        direction: "right",
        ratio: 2 / 3,
      });
    });

    it("should return ratio 3/4 for two horizontal splits (3 panels)", () => {
      const root: SplitNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "split-2",
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
        },
        right: {
          id: "panel-3",
          type: "panel",
        },
      };

      const result = equalWidthRightStrategy.getPlacementOnAdd(root);

      expect(result).toEqual({
        targetId: "split-1",
        direction: "right",
        ratio: 3 / 4,
      });
    });

    it("should not count vertical splits", () => {
      const root: SplitNode = {
        id: "split-1",
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

      const result = equalWidthRightStrategy.getPlacementOnAdd(root);

      // 0 horizontal splits, so ratio should be 1/2
      expect(result).toEqual({
        targetId: "split-1",
        direction: "right",
        ratio: 0.5,
      });
    });

    it("should only count horizontal splits in mixed layout", () => {
      const root: SplitNode = {
        id: "split-h1",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "split-v1",
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
        },
        right: {
          id: "split-h2",
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: "panel-3",
            type: "panel",
          },
          right: {
            id: "panel-4",
            type: "panel",
          },
        },
      };

      const result = equalWidthRightStrategy.getPlacementOnAdd(root);

      // 2 horizontal splits (split-h1 and split-h2), so ratio should be 3/4
      expect(result).toEqual({
        targetId: "split-h1",
        direction: "right",
        ratio: 3 / 4,
      });
    });

    it("should handle deeply nested horizontal splits", () => {
      // Create a deeply nested structure with 4 horizontal splits
      const root: LayoutNode = {
        id: "split-1",
        type: "split",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          id: "split-2",
          type: "split",
          orientation: "horizontal",
          ratio: 0.5,
          left: {
            id: "split-3",
            type: "split",
            orientation: "horizontal",
            ratio: 0.5,
            left: {
              id: "split-4",
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
            },
            right: {
              id: "panel-3",
              type: "panel",
            },
          },
          right: {
            id: "panel-4",
            type: "panel",
          },
        },
        right: {
          id: "panel-5",
          type: "panel",
        },
      };

      const result = equalWidthRightStrategy.getPlacementOnAdd(root);

      // 4 horizontal splits, so ratio should be 5/6
      expect(result).toEqual({
        targetId: "split-1",
        direction: "right",
        ratio: 5 / 6,
      });
    });
  });
});
