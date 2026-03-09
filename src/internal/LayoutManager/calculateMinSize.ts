import type { LayoutNode } from "../../types";
import { assertNever } from "../utils";
import type { Size } from "./types";

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
      return {
        width: leftSize.width + gap + rightSize.width,
        height: Math.max(leftSize.height, rightSize.height),
      };
    } else if (node.orientation === "vertical") {
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
