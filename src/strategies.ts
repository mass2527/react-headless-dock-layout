import { assertNever } from "./internal/assertNever";
import type { Direction } from "./internal/LayoutManager/types";
import type { LayoutNode, PanelNode } from "./types";

export interface PlacementStrategy {
  /**
   * Calculates the placement for a new panel based on the current layout tree.
   *
   * @param root - The root node of the current layout tree.
   * @returns Placement configuration specifying:
   *   - `targetId`: The ID of the panel that will be split to make room for the new panel
   *   - `direction`: The direction in which to split (`"top"`, `"bottom"`, `"left"`, or `"right"`)
   *   - `ratio`: The ratio for dividing space (0-1, where 0.5 is equal split)
   */
  getPlacementOnAdd(root: LayoutNode): {
    targetId: string;
    direction: Direction;
    ratio: number;
  };
}

/**
 * Default placement strategy that adds panels to the right with equal widths.
 * New panels are added by splitting the root panel horizontally, maintaining equal widths
 * for all panels.
 */
export const equalWidthRightStrategy: PlacementStrategy = {
  getPlacementOnAdd(root) {
    const horizontalSplitCount = countHorizontalSplits(root) + 1;

    return {
      targetId: root.id,
      direction: "right",
      ratio: horizontalSplitCount / (horizontalSplitCount + 1),
    };
  },
};

/**
 * Placement strategy that adds panels to the right of the rightmost panel.
 * New panels are added by splitting the rightmost panel with equal space (50/50).
 */
export const lastPanelRightStrategy: PlacementStrategy = {
  getPlacementOnAdd(root) {
    const rightmostPanel = findRightmostPanel(root);

    return {
      targetId: rightmostPanel.id,
      direction: "right",
      ratio: 0.5,
    };
  },
};

/**
 * Placement strategy that adds panels below the bottommost panel.
 * New panels are added by splitting the bottommost panel with equal space (50/50).
 */
export const lastPanelBottomStrategy: PlacementStrategy = {
  getPlacementOnAdd(root) {
    const bottommostPanel = findBottommostPanel(root);

    return {
      targetId: bottommostPanel.id,
      direction: "bottom",
      ratio: 0.5,
    };
  },
};

/**
 * Placement strategy that adds panels to the bottom with equal heights.
 * New panels are added by splitting the root panel vertically, maintaining equal heights
 * for all panels.
 */
export const equalHeightBottomStrategy: PlacementStrategy = {
  getPlacementOnAdd(root) {
    const verticalSplitCount = countVerticalSplits(root) + 1;

    return {
      targetId: root.id,
      direction: "bottom",
      ratio: verticalSplitCount / (verticalSplitCount + 1),
    };
  },
};

/**
 * Creates a custom placement strategy that always places new panels
 * adjacent to a specific target panel.
 *
 * @param targetId - The ID of the panel to split when adding new panels.
 * @param direction - The direction in which to place the new panel.
 * @param ratio - The ratio for dividing space (defaults to 0.5 for equal split).
 * @returns A `PlacementStrategy` that places panels at the specified location.
 *
 * @example
 * ```ts
 * // Always add new panels to the right of panel "sidebar"
 * const strategy = createFixedPlacementStrategy("sidebar", "right");
 * useDockLayout(initialLayout, { placementStrategy: strategy });
 * ```
 */
export function createFixedPlacementStrategy(
  targetId: string,
  direction: Direction,
  ratio = 0.5,
): PlacementStrategy {
  return {
    getPlacementOnAdd() {
      return {
        targetId,
        direction,
        ratio,
      };
    },
  };
}

function countHorizontalSplits(node: LayoutNode): number {
  if (node.type === "panel") {
    return 0;
  } else if (node.type === "split") {
    if (node.orientation === "horizontal") {
      return (
        1 + countHorizontalSplits(node.left) + countHorizontalSplits(node.right)
      );
    } else if (node.orientation === "vertical") {
      return (
        countHorizontalSplits(node.left) + countHorizontalSplits(node.right)
      );
    } else {
      assertNever(node.orientation);
    }
  } else {
    assertNever(node);
  }
}

function countVerticalSplits(node: LayoutNode): number {
  if (node.type === "panel") {
    return 0;
  } else if (node.type === "split") {
    if (node.orientation === "vertical") {
      return (
        1 + countVerticalSplits(node.left) + countVerticalSplits(node.right)
      );
    } else if (node.orientation === "horizontal") {
      return (
        countVerticalSplits(node.left) + countVerticalSplits(node.right)
      );
    } else {
      assertNever(node.orientation);
    }
  } else {
    assertNever(node);
  }
}

function findRightmostPanel(node: LayoutNode): PanelNode {
  if (node.type === "panel") {
    return node;
  } else if (node.type === "split") {
    if (node.orientation === "horizontal") {
      // For horizontal splits, go right
      return findRightmostPanel(node.right);
    } else if (node.orientation === "vertical") {
      // For vertical splits, check both and prefer the one on the right side
      // Since vertical splits don't have left/right semantically, we go right by convention
      return findRightmostPanel(node.right);
    } else {
      assertNever(node.orientation);
    }
  } else {
    assertNever(node);
  }
}

function findBottommostPanel(node: LayoutNode): PanelNode {
  if (node.type === "panel") {
    return node;
  } else if (node.type === "split") {
    if (node.orientation === "vertical") {
      // For vertical splits, go to the bottom (right child)
      return findBottommostPanel(node.right);
    } else if (node.orientation === "horizontal") {
      // For horizontal splits, check both and prefer the bottom one
      // Since horizontal splits don't have top/bottom semantically, we go right by convention
      return findBottommostPanel(node.right);
    } else {
      assertNever(node.orientation);
    }
  } else {
    assertNever(node);
  }
}
