import type { LayoutManagerOptions, LayoutNode, LayoutRect } from "../../types";
import { assertNever } from "../assertNever";
import { AXIS_CONFIG, type Rect, type Size } from "./types";

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
      const { position, length, crossLength } = AXIS_CONFIG[node.orientation];
      const halfGap = options.gap / 2;

      const splitRect = {
        id: node.id,
        type: "split" as const,
        orientation: node.orientation,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
      splitRect[position] = Math.round(rect[position] + rect[length] * node.ratio - halfGap);
      splitRect[length] = Math.round(options.gap);
      splitRect[crossLength] = Math.round(rect[crossLength]);
      rects.push(splitRect);

      const leftRect: Rect = { ...rect, [length]: rect[length] * node.ratio - halfGap };
      traverse(node.left, leftRect);

      const rightRect: Rect = {
        ...rect,
        [position]: rect[position] + rect[length] * node.ratio + halfGap,
        [length]: rect[length] * (1 - node.ratio) - halfGap,
      };
      traverse(node.right, rightRect);
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
