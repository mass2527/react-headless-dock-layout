import type { LayoutNode } from "../../types";
import { assertNever } from "../assertNever";
import { AXIS_CONFIG, type Size } from "./types";

export function calculateMinSize(node: LayoutNode, gap: number): Size {
  if (node.type === "panel") {
    return {
      width: node.minSize?.width ?? 0,
      height: node.minSize?.height ?? 0,
    };
  } else if (node.type === "split") {
    const leftSize = calculateMinSize(node.left, gap);
    const rightSize = calculateMinSize(node.right, gap);
    const { length, crossLength } = AXIS_CONFIG[node.orientation];

    const size: Size = { width: 0, height: 0 };
    size[length] = leftSize[length] + gap + rightSize[length];
    size[crossLength] = Math.max(leftSize[crossLength], rightSize[crossLength]);
    return size;
  } else {
    assertNever(node);
  }
}
