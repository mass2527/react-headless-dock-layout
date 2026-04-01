import { assertNever } from "./internal/assertNever";
import type { Direction } from "./internal/LayoutManager/types";
import type { LayoutNode } from "./types";

/**
 * Determines where a newly added panel is placed in the existing layout tree.
 * Implement this interface to customize panel insertion behavior
 * (e.g., always add below, add in a round-robin pattern, etc.).
 */
export interface PlacementStrategy {
  /**
   * Given the current layout tree, decide which existing node to split,
   * in which direction, and how to divide the space.
   *
   * @param root - The current layout tree (never null — the layout engine
   *   handles the empty-layout case before calling this).
   * @returns
   *   - `targetId` — id of the node that will be split to accommodate the new panel.
   *   - `direction` — which side of the target the new panel appears on.
   *   - `ratio` — fraction of space kept by the existing content (0–1).
   */
  getPlacementOnAdd(root: LayoutNode): {
    targetId: string;
    direction: Direction;
    ratio: number;
  };
}

/**
 * Appends every new panel to the right edge of the layout and adjusts ratios
 * so that all top-level columns share equal width.
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
