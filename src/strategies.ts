import type { LayoutNode, PlacementStrategy, PlacementResult } from "./types";

/**
 * Finds the rightmost panel in the tree.
 * Used by equalWidthRightStrategy to add panels to the right.
 */
function findRightmostPanel(node: LayoutNode): string {
  if (node.type === "panel") {
    return node.id;
  }

  // For splits, recursively find rightmost in the right child
  return findRightmostPanel(node.right);
}

/**
 * Counts the number of panels in the tree.
 */
function countPanels(node: LayoutNode): number {
  if (node.type === "panel") {
    return 1;
  }
  return countPanels(node.left) + countPanels(node.right);
}

/**
 * Default placement strategy that:
 * 1. Adds new panels to the right of the rightmost panel
 * 2. Calculates ratio to maintain equal widths for all panels
 *
 * Example: With 2 existing panels, adding a third results in
 * ratio 2/3 (existing) vs 1/3 (new panel)
 */
export const equalWidthRightStrategy: PlacementStrategy = {
  getPlacementOnAdd(root: LayoutNode): PlacementResult {
    const targetId = findRightmostPanel(root);
    const existingPanels = countPanels(root);

    // Calculate ratio so all panels have equal width
    // If there are N existing panels and we add 1 more,
    // the existing content should take N/(N+1) of the space
    const ratio = existingPanels / (existingPanels + 1);

    return {
      targetId,
      direction: "right",
      ratio,
    };
  },
};
