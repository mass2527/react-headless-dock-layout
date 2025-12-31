import type { LayoutNode } from "../../types";
import { assertNever } from "../assertNever";
import type { Size } from "./types";

export function calculateMinSize(node: LayoutNode, gap: number): Size {
  if (node.type === "panel") {
    return {
      width: node.minSize?.width ?? 0,
      height: node.minSize?.height ?? 0,
    };
  } else if (node.type === "split") {
    if (node.orientation === "horizontal") {
      return {
        width:
          calculateMinSize(node.left, gap).width +
          gap +
          calculateMinSize(node.right, gap).width,
        height: Math.max(
          calculateMinSize(node.left, gap).height,
          calculateMinSize(node.right, gap).height,
        ),
      };
    } else if (node.orientation === "vertical") {
      return {
        width: Math.max(
          calculateMinSize(node.left, gap).width,
          calculateMinSize(node.right, gap).width,
        ),
        height:
          calculateMinSize(node.left, gap).height +
          gap +
          calculateMinSize(node.right, gap).height,
      };
    } else {
      assertNever(node.orientation);
    }
  } else {
    assertNever(node);
  }
}
