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

  const traverse = (node: LayoutNode, rect: Rect): LayoutRect[] => {
    if (node.type === "panel") {
      return [
        {
          id: node.id,
          type: "panel",
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      ];
    } else if (node.type === "split") {
      const isHorizontal = node.orientation === "horizontal";
      const mainSize = isHorizontal ? rect.width : rect.height;
      const mainPos = isHorizontal ? rect.x : rect.y;
      const splitStart = mainPos + mainSize * node.ratio - options.gap / 2;

      const splitRect: LayoutRect = {
        id: node.id,
        type: "split",
        orientation: node.orientation,
        x: Math.round(isHorizontal ? splitStart : rect.x),
        y: Math.round(isHorizontal ? rect.y : splitStart),
        width: Math.round(isHorizontal ? options.gap : rect.width),
        height: Math.round(isHorizontal ? rect.height : options.gap),
      };

      const leftSize = mainSize * node.ratio - options.gap / 2;
      const rightSize = mainSize * (1 - node.ratio) - options.gap / 2;
      const rightPos = mainPos + mainSize * node.ratio + options.gap / 2;

      const leftRect: Rect = isHorizontal
        ? { ...rect, width: leftSize }
        : { ...rect, height: leftSize };

      const rightRect: Rect = isHorizontal
        ? { ...rect, x: rightPos, width: rightSize }
        : { ...rect, y: rightPos, height: rightSize };

      return [
        splitRect,
        ...traverse(node.left, leftRect),
        ...traverse(node.right, rightRect),
      ];
    } else {
      assertNever(node);
    }
  };

  return traverse(root, {
    x: 0,
    y: 0,
    width: options.size.width,
    height: options.size.height,
  });
}
