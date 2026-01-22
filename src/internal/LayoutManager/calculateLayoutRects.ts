import type {
  LayoutNode,
  LayoutRect,
  ContainerSize,
} from "../../types";

interface CalculateOptions {
  gap: number;
}

/**
 * Calculates absolute rectangles for all nodes in the layout tree.
 *
 * @param root - The layout tree root
 * @param size - Container dimensions
 * @param options - Configuration (gap size)
 * @returns Array of rectangles for panels and split bars
 */
export function calculateLayoutRects(
  root: LayoutNode | null,
  size: ContainerSize,
  options: CalculateOptions
): LayoutRect[] {
  if (!root) return [];

  const rects: LayoutRect[] = [];
  const { gap } = options;

  function calculate(
    node: LayoutNode,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (node.type === "panel") {
      rects.push({
        type: "panel",
        id: node.id,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
      return;
    }

    // Split node - calculate split bar and child rects
    const { orientation, ratio, left, right } = node;

    if (orientation === "horizontal") {
      // Split horizontally: [left | bar | right]
      const leftWidth = (width - gap) * ratio;
      const rightWidth = width - gap - leftWidth;
      const barX = x + leftWidth;

      // Split bar rect
      rects.push({
        type: "split",
        id: node.id,
        orientation: "horizontal",
        x: Math.round(barX),
        y: Math.round(y),
        width: gap,
        height: Math.round(height),
      });

      // Left child
      calculate(left, x, y, leftWidth, height);

      // Right child
      calculate(right, barX + gap, y, rightWidth, height);
    } else {
      // Split vertically: [top / bar / bottom]
      const topHeight = (height - gap) * ratio;
      const bottomHeight = height - gap - topHeight;
      const barY = y + topHeight;

      // Split bar rect
      rects.push({
        type: "split",
        id: node.id,
        orientation: "vertical",
        x: Math.round(x),
        y: Math.round(barY),
        width: Math.round(width),
        height: gap,
      });

      // Top child (left in tree)
      calculate(left, x, y, width, topHeight);

      // Bottom child (right in tree)
      calculate(right, x, barY + gap, width, bottomHeight);
    }
  }

  calculate(root, 0, 0, size.width, size.height);

  return rects;
}
