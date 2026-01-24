import type { LayoutNode, SplitNode } from "../../types";
import { assertNever } from "../assertNever";
import { findParentNode } from "../findParentNode";
import { invariant } from "../invariant";

export class LayoutTree {
  private _root: LayoutNode | null = null;

  constructor(root: LayoutNode | null) {
    this._root = root;
  }

  get root() {
    return this._root;
  }

  set root(root: LayoutNode | null) {
    this._root = root;
  }

  findNode(id: string) {
    if (this._root === null) {
      return null;
    }

    return this.findNodeInSubTree(id, this._root);
  }

  private findNodeInSubTree(id: string, node: LayoutNode): LayoutNode | null {
    if (id === node.id) {
      return node;
    }

    if (node.type === "panel") {
      return null;
    } else if (node.type === "split") {
      return (
        this.findNodeInSubTree(id, node.left) ??
        this.findNodeInSubTree(id, node.right)
      );
    } else {
      assertNever(node);
    }
  }

  findParentNode(id: string) {
    return findParentNode(this._root, id);
  }

  replaceChildNode({
    parent,
    oldChildId,
    newChild,
  }: {
    parent: SplitNode;
    oldChildId: string;
    newChild: LayoutNode;
  }) {
    const oldChildNode = this.findNode(oldChildId);
    invariant(
      oldChildNode !== null,
      "replaceChildNode requires the child to exist in the tree.",
    );

    invariant(
      parent.left.id === oldChildId || parent.right.id === oldChildId,
      "replaceChildNode requires the child to be a direct child of the parent.",
    );

    if (parent.left.id === oldChildId) {
      parent.left = newChild;
    } else {
      parent.right = newChild;
    }
  }
}
