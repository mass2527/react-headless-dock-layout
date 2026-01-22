import type { LayoutNode, SplitNode } from "../../types";
import { assertNever } from "../errors";

/**
 * Finds the parent split node of a node with the given ID.
 *
 * In a binary tree structure, the parent is always a SplitNode since
 * PanelNodes are leaf nodes and cannot have children.
 *
 * @param root - The root of the layout tree to search.
 * @param id - The ID of the node whose parent to find.
 * @returns The parent SplitNode, or null if not found or if the node is the root.
 */
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
    // Check if either child matches the target ID
    if (node.left.id === id || node.right.id === id) {
      return node;
    }

    // Recursively search in subtrees
    return (
      findParentNodeInSubTree(id, node.left) ??
      findParentNodeInSubTree(id, node.right)
    );
  } else {
    assertNever(node);
  }
}
