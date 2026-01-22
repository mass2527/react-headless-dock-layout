import type { LayoutNode, MinSize } from "../../types";

/**
 * Calculates the minimum size that a node subtree requires.
 * Used to constrain resize operations.
 *
 * @param node - The root of the subtree
 * @param gap - The gap/split bar size
 * @returns Minimum width and height required
 */
export function calculateMinSize(
  node: LayoutNode,
  gap: number
): Required<MinSize> {
  if (node.type === "panel") {
    return {
      width: node.minSize?.width ?? 0,
      height: node.minSize?.height ?? 0,
    };
  }

  const leftMin = calculateMinSize(node.left, gap);
  const rightMin = calculateMinSize(node.right, gap);

  if (node.orientation === "horizontal") {
    // Children are side by side
    return {
      width: leftMin.width + gap + rightMin.width,
      height: Math.max(leftMin.height, rightMin.height),
    };
  } else {
    // Children are stacked
    return {
      width: Math.max(leftMin.width, rightMin.width),
      height: leftMin.height + gap + rightMin.height,
    };
  }
}
