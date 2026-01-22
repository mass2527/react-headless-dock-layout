import { assertNever } from "./internal/assertNever";
import type { Direction } from "./internal/LayoutManager/types";
import type { LayoutNode } from "./types";

/** Determines where new panels are placed in the layout. */
export interface PlacementStrategy {
  /**
   * Returns placement config for a new panel.
   * @param root - Current layout tree root.
   * @returns `targetId` (node to split), `direction` (split direction), `ratio` (space division).
   */
  getPlacementOnAdd(root: LayoutNode): {
    targetId: string;
    direction: Direction;
    ratio: number;
  };
}

/** Default strategy: adds panels to the right, distributing width equally among all panels. */
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
