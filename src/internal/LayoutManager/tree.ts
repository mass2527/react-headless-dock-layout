import type { LayoutNode, SplitNode } from "../../types";

export function findNode(
  root: LayoutNode | null,
  id: string,
): LayoutNode | null {
  if (root === null) {
    return null;
  }

  if (root.id === id) {
    return root;
  }

  if (root.type === "panel") {
    return null;
  }

  return findNode(root.left, id) ?? findNode(root.right, id);
}

export function findParentNode(
  root: LayoutNode | null,
  id: string,
): SplitNode | null {
  if (root === null || root.type === "panel") {
    return null;
  }

  if (root.left.id === id || root.right.id === id) {
    return root;
  }

  return findParentNode(root.left, id) ?? findParentNode(root.right, id);
}

export function replaceChildNode(
  parent: SplitNode,
  oldChildId: string,
  newChild: LayoutNode,
) {
  if (parent.left.id === oldChildId) {
    parent.left = newChild;
  } else if (parent.right.id === oldChildId) {
    parent.right = newChild;
  } else {
    throw new Error(
      `Node with id ${oldChildId} is not a child of node with id ${parent.id}`,
    );
  }
}
