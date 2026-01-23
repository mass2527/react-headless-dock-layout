import { describe, expect, it } from "vitest";
import {
  createFixedPlacementStrategy,
  equalHeightBottomStrategy,
  equalWidthRightStrategy,
  lastPanelBottomStrategy,
  lastPanelRightStrategy,
} from "./strategies";
import type { LayoutNode, PanelNode, SplitNode } from "./types";

// Test fixtures
const singlePanel: PanelNode = { type: "panel", id: "panel-1" };

const horizontalSplit: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "horizontal",
  ratio: 0.5,
  left: { type: "panel", id: "panel-1" },
  right: { type: "panel", id: "panel-2" },
};

const verticalSplit: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "vertical",
  ratio: 0.5,
  left: { type: "panel", id: "panel-1" },
  right: { type: "panel", id: "panel-2" },
};

const nestedHorizontal: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "horizontal",
  ratio: 0.5,
  left: { type: "panel", id: "panel-1" },
  right: {
    type: "split",
    id: "split-2",
    orientation: "horizontal",
    ratio: 0.5,
    left: { type: "panel", id: "panel-2" },
    right: { type: "panel", id: "panel-3" },
  },
};

const nestedVertical: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "vertical",
  ratio: 0.5,
  left: { type: "panel", id: "panel-1" },
  right: {
    type: "split",
    id: "split-2",
    orientation: "vertical",
    ratio: 0.5,
    left: { type: "panel", id: "panel-2" },
    right: { type: "panel", id: "panel-3" },
  },
};

const mixedLayout: SplitNode = {
  type: "split",
  id: "split-1",
  orientation: "horizontal",
  ratio: 0.5,
  left: {
    type: "split",
    id: "split-2",
    orientation: "vertical",
    ratio: 0.5,
    left: { type: "panel", id: "panel-1" },
    right: { type: "panel", id: "panel-2" },
  },
  right: { type: "panel", id: "panel-3" },
};

describe("equalWidthRightStrategy", () => {
  it("should target root with direction right for single panel", () => {
    const placement = equalWidthRightStrategy.getPlacementOnAdd(singlePanel);
    expect(placement).toEqual({
      targetId: "panel-1",
      direction: "right",
      ratio: 0.5, // (0 + 1) / (0 + 1 + 1) = 1/2
    });
  });

  it("should calculate correct ratio for horizontal split", () => {
    const placement = equalWidthRightStrategy.getPlacementOnAdd(horizontalSplit);
    expect(placement).toEqual({
      targetId: "split-1",
      direction: "right",
      ratio: 2 / 3, // (1 + 1) / (1 + 1 + 1) = 2/3
    });
  });

  it("should count horizontal splits only", () => {
    const placement = equalWidthRightStrategy.getPlacementOnAdd(verticalSplit);
    expect(placement).toEqual({
      targetId: "split-1",
      direction: "right",
      ratio: 0.5, // No horizontal splits, so (0 + 1) / (0 + 1 + 1) = 1/2
    });
  });

  it("should calculate correct ratio for nested horizontal splits", () => {
    const placement =
      equalWidthRightStrategy.getPlacementOnAdd(nestedHorizontal);
    expect(placement).toEqual({
      targetId: "split-1",
      direction: "right",
      ratio: 3 / 4, // (2 + 1) / (2 + 1 + 1) = 3/4
    });
  });
});

describe("equalHeightBottomStrategy", () => {
  it("should target root with direction bottom for single panel", () => {
    const placement = equalHeightBottomStrategy.getPlacementOnAdd(singlePanel);
    expect(placement).toEqual({
      targetId: "panel-1",
      direction: "bottom",
      ratio: 0.5,
    });
  });

  it("should count vertical splits only", () => {
    const placement =
      equalHeightBottomStrategy.getPlacementOnAdd(horizontalSplit);
    expect(placement).toEqual({
      targetId: "split-1",
      direction: "bottom",
      ratio: 0.5, // No vertical splits
    });
  });

  it("should calculate correct ratio for vertical split", () => {
    const placement = equalHeightBottomStrategy.getPlacementOnAdd(verticalSplit);
    expect(placement).toEqual({
      targetId: "split-1",
      direction: "bottom",
      ratio: 2 / 3, // (1 + 1) / (1 + 1 + 1) = 2/3
    });
  });

  it("should calculate correct ratio for nested vertical splits", () => {
    const placement =
      equalHeightBottomStrategy.getPlacementOnAdd(nestedVertical);
    expect(placement).toEqual({
      targetId: "split-1",
      direction: "bottom",
      ratio: 3 / 4, // (2 + 1) / (2 + 1 + 1) = 3/4
    });
  });
});

describe("lastPanelRightStrategy", () => {
  it("should target single panel", () => {
    const placement = lastPanelRightStrategy.getPlacementOnAdd(singlePanel);
    expect(placement).toEqual({
      targetId: "panel-1",
      direction: "right",
      ratio: 0.5,
    });
  });

  it("should find rightmost panel in horizontal split", () => {
    const placement =
      lastPanelRightStrategy.getPlacementOnAdd(horizontalSplit);
    expect(placement).toEqual({
      targetId: "panel-2",
      direction: "right",
      ratio: 0.5,
    });
  });

  it("should find rightmost panel in vertical split (uses right child)", () => {
    const placement = lastPanelRightStrategy.getPlacementOnAdd(verticalSplit);
    expect(placement).toEqual({
      targetId: "panel-2",
      direction: "right",
      ratio: 0.5,
    });
  });

  it("should find rightmost panel in nested layout", () => {
    const placement =
      lastPanelRightStrategy.getPlacementOnAdd(nestedHorizontal);
    expect(placement).toEqual({
      targetId: "panel-3",
      direction: "right",
      ratio: 0.5,
    });
  });

  it("should find rightmost panel in mixed layout", () => {
    const placement = lastPanelRightStrategy.getPlacementOnAdd(mixedLayout);
    expect(placement).toEqual({
      targetId: "panel-3",
      direction: "right",
      ratio: 0.5,
    });
  });
});

describe("lastPanelBottomStrategy", () => {
  it("should target single panel", () => {
    const placement = lastPanelBottomStrategy.getPlacementOnAdd(singlePanel);
    expect(placement).toEqual({
      targetId: "panel-1",
      direction: "bottom",
      ratio: 0.5,
    });
  });

  it("should find bottommost panel in vertical split", () => {
    const placement = lastPanelBottomStrategy.getPlacementOnAdd(verticalSplit);
    expect(placement).toEqual({
      targetId: "panel-2",
      direction: "bottom",
      ratio: 0.5,
    });
  });

  it("should find bottommost panel in horizontal split (uses right child)", () => {
    const placement =
      lastPanelBottomStrategy.getPlacementOnAdd(horizontalSplit);
    expect(placement).toEqual({
      targetId: "panel-2",
      direction: "bottom",
      ratio: 0.5,
    });
  });

  it("should find bottommost panel in nested vertical layout", () => {
    const placement = lastPanelBottomStrategy.getPlacementOnAdd(nestedVertical);
    expect(placement).toEqual({
      targetId: "panel-3",
      direction: "bottom",
      ratio: 0.5,
    });
  });
});

describe("createFixedPlacementStrategy", () => {
  it("should create a strategy with specified target and direction", () => {
    const strategy = createFixedPlacementStrategy("sidebar", "right");
    const placement = strategy.getPlacementOnAdd(singlePanel);
    expect(placement).toEqual({
      targetId: "sidebar",
      direction: "right",
      ratio: 0.5,
    });
  });

  it("should use custom ratio when provided", () => {
    const strategy = createFixedPlacementStrategy("sidebar", "bottom", 0.7);
    const placement = strategy.getPlacementOnAdd(singlePanel);
    expect(placement).toEqual({
      targetId: "sidebar",
      direction: "bottom",
      ratio: 0.7,
    });
  });

  it("should always return same placement regardless of root", () => {
    const strategy = createFixedPlacementStrategy("target", "left", 0.3);

    const placement1 = strategy.getPlacementOnAdd(singlePanel);
    const placement2 = strategy.getPlacementOnAdd(horizontalSplit);
    const placement3 = strategy.getPlacementOnAdd(nestedHorizontal);

    expect(placement1).toEqual(placement2);
    expect(placement2).toEqual(placement3);
    expect(placement1).toEqual({
      targetId: "target",
      direction: "left",
      ratio: 0.3,
    });
  });

  it("should work with all directions", () => {
    const directions = ["top", "bottom", "left", "right"] as const;

    for (const direction of directions) {
      const strategy = createFixedPlacementStrategy("panel", direction);
      const placement = strategy.getPlacementOnAdd(singlePanel);
      expect(placement.direction).toBe(direction);
    }
  });
});
