import type { LayoutNode } from "../../../types";
import { assertNever } from "../../errors";
import type { Size } from "../types";

/**
 * Calculates the minimum size required for a layout subtree.
 *
 * This is used during resize operations to determine how far a split bar
 * can be dragged before violating panel minimum size constraints.
 *
 * **Algorithm:**
 * - Panel nodes return their minSize (or 0 if not specified)
 * - Split nodes sum their children's min sizes along the split axis,
 *   and take the max along the perpendicular axis
 *
 * @param node - The root of the subtree to calculate.
 * @param gap - The gap size between panels (added for each split).
 * @returns The minimum width and height required for this subtree.
 */
export function calculateMinSize(node: LayoutNode, gap: number): Size {
  if (node.type === "panel") {
    return {
      width: node.minSize?.width ?? 0,
      height: node.minSize?.height ?? 0,
    };
  } else if (node.type === "split") {
    const leftSize = calculateMinSize(node.left, gap);
    const rightSize = calculateMinSize(node.right, gap);

    if (node.orientation === "horizontal") {
      // Horizontal split: widths add up, heights take max
      return {
        width: leftSize.width + gap + rightSize.width,
        height: Math.max(leftSize.height, rightSize.height),
      };
    } else if (node.orientation === "vertical") {
      // Vertical split: heights add up, widths take max
      return {
        width: Math.max(leftSize.width, rightSize.width),
        height: leftSize.height + gap + rightSize.height,
      };
    } else {
      assertNever(node.orientation);
    }
  } else {
    assertNever(node);
  }
}
