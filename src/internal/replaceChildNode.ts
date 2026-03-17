import type { LayoutNode, SplitNode } from "../types";

export function replaceChildNode({
  parent,
  oldChildId,
  newChild,
}: {
  parent: SplitNode;
  oldChildId: string;
  newChild: LayoutNode;
}) {
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
