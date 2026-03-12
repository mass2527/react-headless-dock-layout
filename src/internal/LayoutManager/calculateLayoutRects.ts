import type { LayoutManagerOptions, LayoutNode, LayoutRect } from "../../types";
import { assertNever } from "../assertNever";
import { buildRect, getAxis } from "./types";
import type { Rect, Size } from "./types";

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
      const axis = getAxis(node.orientation);
      const mainPos = rect[axis.position];
      const mainSize = rect[axis.size];
      const crossPos = rect[axis.crossPosition];
      const crossSize = rect[axis.crossSize];
      const halfGap = options.gap / 2;

      const splitBarRect = buildRect(
        axis,
        Math.round(mainPos + mainSize * node.ratio - halfGap),
        Math.round(crossPos),
        Math.round(options.gap),
        Math.round(crossSize),
      );
      rects.push({
        id: node.id,
        type: "split",
        orientation: node.orientation,
        ...splitBarRect,
      });

      traverse(
        node.left,
        buildRect(axis, mainPos, crossPos, mainSize * node.ratio - halfGap, crossSize),
      );
      traverse(
        node.right,
        buildRect(axis, mainPos + mainSize * node.ratio + halfGap, crossPos, mainSize * (1 - node.ratio) - halfGap, crossSize),
      );
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
