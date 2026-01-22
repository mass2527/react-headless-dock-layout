import type { LayoutManagerOptions, LayoutNode, LayoutRect } from "../../../types";
import { assertNever } from "../../errors";
import type { Rect, Size } from "../types";

/**
 * Converts a layout tree into an array of absolute-positioned rectangles.
 *
 * This function traverses the binary tree structure and calculates the pixel
 * coordinates for each node based on the container size and split ratios.
 *
 * **Algorithm:**
 * 1. Start with the full container as the available rect
 * 2. For each split node:
 *    - Calculate the split bar position based on the ratio
 *    - Recursively process left/right children with their allocated portions
 * 3. For each panel node:
 *    - Output its final pixel coordinates
 *
 * **Coordinate System:**
 * - Origin (0,0) is at the top-left of the container
 * - Split bars are centered on the split line with width/height equal to `gap`
 *
 * @param root - The root of the layout tree, or null for empty layout.
 * @param options - Configuration containing gap size and container dimensions.
 * @returns Array of rectangles for all panels and split bars.
 */
export function calculateLayoutRects(
  root: LayoutNode | null,
  options: Required<Pick<LayoutManagerOptions, "gap">> & { size: Size },
): LayoutRect[] {
  if (root === null) {
    return [];
  }

  const rects: LayoutRect[] = [];

  const traverse = (node: LayoutNode, rect: Rect) => {
    if (node.type === "split") {
      if (node.orientation === "horizontal") {
        // Horizontal split: left | right (split bar is vertical)
        rects.push({
          id: node.id,
          type: "split",
          orientation: node.orientation,
          x: Math.round(rect.x + rect.width * node.ratio - options.gap / 2),
          y: Math.round(rect.y),
          width: Math.round(options.gap),
          height: Math.round(rect.height),
        });

        traverse(node.left, {
          x: rect.x,
          y: rect.y,
          width: rect.width * node.ratio - options.gap / 2,
          height: rect.height,
        });
        traverse(node.right, {
          x: rect.x + rect.width * node.ratio + options.gap / 2,
          y: rect.y,
          width: rect.width * (1 - node.ratio) - options.gap / 2,
          height: rect.height,
        });
      } else if (node.orientation === "vertical") {
        // Vertical split: top / bottom (split bar is horizontal)
        rects.push({
          id: node.id,
          type: "split",
          orientation: node.orientation,
          x: Math.round(rect.x),
          y: Math.round(rect.y + rect.height * node.ratio - options.gap / 2),
          width: Math.round(rect.width),
          height: Math.round(options.gap),
        });

        traverse(node.left, {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height * node.ratio - options.gap / 2,
        });
        traverse(node.right, {
          x: rect.x,
          y: rect.y + rect.height * node.ratio + options.gap / 2,
          width: rect.width,
          height: rect.height * (1 - node.ratio) - options.gap / 2,
        });
      } else {
        assertNever(node.orientation);
      }
    } else if (node.type === "panel") {
      rects.push({
        id: node.id,
        type: "panel",
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    } else {
      assertNever(node);
    }
  };

  traverse(root, {
    x: 0,
    y: 0,
    width: options.size.width,
    height: options.size.height,
  });

  return rects;
}
