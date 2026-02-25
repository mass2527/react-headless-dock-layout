import type { Direction } from "./internal/LayoutManager/types";
import type { LayoutNode } from "./types";

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

function countHorizontalSplits(node: LayoutNode): number {
  if (node.type === "panel") {
    return 0;
  }

  const childCount =
    countHorizontalSplits(node.left) + countHorizontalSplits(node.right);

  return node.orientation === "horizontal" ? 1 + childCount : childCount;
}
