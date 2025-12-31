import type { LayoutNode } from "../../types";
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
    parentId,
    oldChildId,
    newChild,
  }: {
    parentId: string;
    oldChildId: string;
    newChild: LayoutNode;
  }) {
    const parentNode = this.findNode(parentId);
    if (parentNode === null) {
      throw new Error(`Parent node with id ${parentId} not found`);
    }

    if (parentNode.type !== "split") {
      throw new Error(`Parent node with id ${parentId} is not a split node`);
    }

    const oldChildNode = this.findNode(oldChildId);
    if (oldChildNode === null) {
      throw new Error(`Child node with id ${oldChildId} not found`);
    }

    if (parentNode.left.id === oldChildId) {
      parentNode.left = newChild;
    } else if (parentNode.right.id === oldChildId) {
      parentNode.right = newChild;
    } else {
      throw new Error(
        `Child node with id ${oldChildId} is not a child of the parent node with id ${parentId}`,
      );
    }
  }
}
