import type { LayoutNode, SplitNode } from "../types";
import { assertNever } from "./assertNever";

export function findParentNode(root: LayoutNode | null, id: string) {
  if (root === null) {
    return null;
  }

  return findParentNodeInSubTree(id, root);
}

function findParentNodeInSubTree(
  id: string,
  node: LayoutNode,
): SplitNode | null {
  if (node.type === "panel") {
    return null;
  } else if (node.type === "split") {
    if (node.left.id === id || node.right.id === id) {
      return node;
    }

    return (
      findParentNodeInSubTree(id, node.left) ??
      findParentNodeInSubTree(id, node.right)
    );
  } else {
    assertNever(node);
  }
}
