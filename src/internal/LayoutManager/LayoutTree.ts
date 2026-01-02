import type { LayoutNode, SplitNode } from "../../types";
import { assertNever } from "../assertNever";
import { findParentNode } from "../findParentNode";

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
}
