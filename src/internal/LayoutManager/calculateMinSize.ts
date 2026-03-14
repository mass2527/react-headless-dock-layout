import type { LayoutNode } from "../../types";
import { assertNever } from "../assertNever";
import type { Size } from "./types";
import { getAxes } from "./types";

export function calculateMinSize(node: LayoutNode, gap: number): Size {
  if (node.type === "panel") {
    return {
      width: node.minSize?.width ?? 0,
      height: node.minSize?.height ?? 0,
    };
  } else if (node.type === "split") {
    const leftSize = calculateMinSize(node.left, gap);
    const rightSize = calculateMinSize(node.right, gap);
    const { primary, cross } = getAxes(node.orientation);

    return {
      [primary.size]: leftSize[primary.size] + gap + rightSize[primary.size],
      [cross.size]: Math.max(leftSize[cross.size], rightSize[cross.size]),
    } as Size;
  } else {
    assertNever(node);
  }
}
