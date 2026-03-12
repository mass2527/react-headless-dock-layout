import type { LayoutNode } from "../../types";
import { assertNever } from "../assertNever";
import { buildSize, getAxis } from "./types";
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
    const axis = getAxis(node.orientation);

    return buildSize(
      axis,
      leftSize[axis.size] + gap + rightSize[axis.size],
      Math.max(leftSize[axis.crossSize], rightSize[axis.crossSize]),
    );
  } else {
    assertNever(node);
  }
}
