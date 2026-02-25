import type { LayoutNode, SplitNode } from "../../types";
import { assertNever } from "../assertNever";
import { findParentNode } from "../findParentNode";

export function findNode(
  root: LayoutNode | null,
  id: string,
): LayoutNode | null {
  if (root === null) {
    return null;
  }

  if (id === root.id) {
    return root;
  }

  if (root.type === "panel") {
    return null;
  } else if (root.type === "split") {
    return findNode(root.left, id) ?? findNode(root.right, id);
  } else {
    assertNever(root);
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

export { findParentNode };
