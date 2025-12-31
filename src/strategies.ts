import { assertNever } from "./internal/assertNever";
import { findParentNode } from "./internal/findParentNode";
import type { Direction } from "./internal/LayoutManager/types";
import type { LayoutNode, PanelNode } from "./types";

export interface AddPanelStrategy {
  getPlacement(root: LayoutNode): {
    targetId: string;
    direction: Direction;
    ratio: number;
  };
}

export const evenlyDividedHorizontalStrategy: AddPanelStrategy = {
  getPlacement(root) {
    const horizontalNodeCount = calculateHorizontalSplitCount(root) + 1;

    return {
      targetId: root.id,
      direction: "right",
      ratio: horizontalNodeCount / (horizontalNodeCount + 1),
    };
  },
};

function calculateHorizontalSplitCount(node: LayoutNode): number {
  if (node.type === "panel") {
    return 0;
  } else if (node.type === "split") {
    if (node.orientation === "horizontal") {
      return (
        1 +
        calculateHorizontalSplitCount(node.left) +
        calculateHorizontalSplitCount(node.right)
      );
    } else if (node.orientation === "vertical") {
      return (
        0 +
        calculateHorizontalSplitCount(node.left) +
        calculateHorizontalSplitCount(node.right)
      );
    } else {
      assertNever(node.orientation);
    }
  } else {
    assertNever(node);
  }
}

export const bspStrategy: AddPanelStrategy = {
  getPlacement(root) {
    const rightMostPanel = findRightMostPanel(root);
    const parentNode = findParentNode(root, rightMostPanel.id);

    return {
      targetId: rightMostPanel.id,
      direction:
        parentNode === null
          ? "right"
          : parentNode.orientation === "horizontal"
            ? "bottom"
            : "right",
      ratio: 0.5,
    };
  },
};

function findRightMostPanel(node: LayoutNode): PanelNode {
  if (node.type === "panel") {
    return node;
  } else if (node.type === "split") {
    return findRightMostPanel(node.right);
  } else {
    assertNever(node);
  }
}
