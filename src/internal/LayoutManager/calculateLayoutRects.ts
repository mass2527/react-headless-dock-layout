import type { LayoutManagerOptions, LayoutNode, LayoutRect } from "../../types";
import { assertNever } from "../assertNever";
import type { Rect, Size } from "./types";

export function calculateLayoutRects(
  root: LayoutNode | null,
  options: Required<Pick<LayoutManagerOptions, "gap">> & { size: Size },
): LayoutRect[] {
  if (root === null) {
    return [];
  }

  // Ensure container has valid dimensions (must be positive)
  if (options.size.width <= 0 || options.size.height <= 0) {
    return [];
  }

  const rects: LayoutRect[] = [];

  const traverse = (node: LayoutNode, rect: Rect) => {
    // Ensure dimensions don't go negative due to gap calculations
    const safeWidth = Math.max(0, rect.width);
    const safeHeight = Math.max(0, rect.height);

    if (node.type === "split") {
      if (node.orientation === "horizontal") {
        rects.push({
          id: node.id,
          type: "split",
          orientation: node.orientation,
          x: Math.round(rect.x + safeWidth * node.ratio - options.gap / 2),
          y: Math.round(rect.y),
          width: Math.round(options.gap),
          height: Math.round(safeHeight),
        });

        traverse(node.left, {
          x: rect.x,
          y: rect.y,
          width: Math.max(0, safeWidth * node.ratio - options.gap / 2),
          height: safeHeight,
        });
        traverse(node.right, {
          x: rect.x + safeWidth * node.ratio + options.gap / 2,
          y: rect.y,
          width: Math.max(0, safeWidth * (1 - node.ratio) - options.gap / 2),
          height: safeHeight,
        });
      } else if (node.orientation === "vertical") {
        rects.push({
          id: node.id,
          type: "split",
          orientation: node.orientation,
          x: Math.round(rect.x),
          y: Math.round(rect.y + safeHeight * node.ratio - options.gap / 2),
          width: Math.round(safeWidth),
          height: Math.round(options.gap),
        });

        traverse(node.left, {
          x: rect.x,
          y: rect.y,
          width: safeWidth,
          height: Math.max(0, safeHeight * node.ratio - options.gap / 2),
        });
        traverse(node.right, {
          x: rect.x,
          y: rect.y + safeHeight * node.ratio + options.gap / 2,
          width: safeWidth,
          height: Math.max(0, safeHeight * (1 - node.ratio) - options.gap / 2),
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
        width: Math.round(safeWidth),
        height: Math.round(safeHeight),
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
