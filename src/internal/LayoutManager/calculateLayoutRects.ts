import type { LayoutManagerOptions, LayoutNode, LayoutRect, SplitLayoutRect } from "../../types";
import { assertNever } from "../assertNever";
import type { Rect, Size } from "./types";
import { getAxes } from "./types";

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
      const { primary, cross } = getAxes(node.orientation);

      rects.push({
        id: node.id,
        type: "split",
        orientation: node.orientation,
        [primary.pos]: Math.round(rect[primary.pos] + rect[primary.size] * node.ratio - options.gap / 2),
        [cross.pos]: Math.round(rect[cross.pos]),
        [primary.size]: Math.round(options.gap),
        [cross.size]: Math.round(rect[cross.size]),
      } as SplitLayoutRect);

      traverse(node.left, {
        [primary.pos]: rect[primary.pos],
        [cross.pos]: rect[cross.pos],
        [primary.size]: rect[primary.size] * node.ratio - options.gap / 2,
        [cross.size]: rect[cross.size],
      } as Rect);
      traverse(node.right, {
        [primary.pos]: rect[primary.pos] + rect[primary.size] * node.ratio + options.gap / 2,
        [cross.pos]: rect[cross.pos],
        [primary.size]: rect[primary.size] * (1 - node.ratio) - options.gap / 2,
        [cross.size]: rect[cross.size],
      } as Rect);
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
