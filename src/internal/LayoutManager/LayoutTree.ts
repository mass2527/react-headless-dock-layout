import type { LayoutNode, SplitNode } from "../../types";
import { assertNever } from "../assertNever";
import { findParentNode } from "../findParentNode";

export { findParentNode };

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

export function replaceChildNode(
  root: LayoutNode | null,
  {
    parent,
    oldChildId,
    newChild,
  }: {
    parent: SplitNode;
    oldChildId: string;
    newChild: LayoutNode;
  },
) {
  const oldChildNode = findNode(root, oldChildId);
  if (oldChildNode === null) {
    throw new Error(`Child node with id ${oldChildId} not found`);
  }

  if (parent.left.id === oldChildId) {
    parent.left = newChild;
  } else if (parent.right.id === oldChildId) {
    parent.right = newChild;
  } else {
    throw new Error(
      `Child node with id ${oldChildId} is not a child of the parent node with id ${parent.id}`,
    );
  }
}
