import type { LayoutManagerOptions, LayoutNode, LayoutRect } from "../../types";
import { assertNever } from "../assertNever";
import type { Rect } from "./types";

export function calculateLayoutRects(
  root: LayoutNode | null,
  options: Required<LayoutManagerOptions>,
): LayoutRect[] {
  if (root === null) {
    return [];
  }

  const rects: LayoutRect[] = [];

  const traverse = (node: LayoutNode, rect: Rect) => {
    if (node.type === "split") {
      if (node.orientation === "horizontal") {
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
