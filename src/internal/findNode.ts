import type { LayoutNode } from "../types";
import { assertNever } from "./assertNever";

export function findNode(
  root: LayoutNode | null,
  id: string,
): LayoutNode | null {
  if (root === null) {
    return null;
  }

  return findNodeInSubTree(id, root);
}

function findNodeInSubTree(id: string, node: LayoutNode): LayoutNode | null {
  if (id === node.id) {
    return node;
  }

  if (node.type === "panel") {
    return null;
  } else if (node.type === "split") {
    return (
      findNodeInSubTree(id, node.left) ?? findNodeInSubTree(id, node.right)
    );
  } else {
    assertNever(node);
  }
}
