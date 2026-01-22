import type { LayoutNode, SplitNode } from "../../types";
import { assertNever } from "../errors";
import { findParentNode } from "./findParentNode";

/**
 * A wrapper class for managing a layout tree data structure.
 *
 * The layout tree is a binary tree where:
 * - Leaf nodes are `PanelNode` (actual content panels)
 * - Internal nodes are `SplitNode` (dividers that split space between children)
 *
 * This class provides methods for traversing and modifying the tree structure.
 */
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

  /**
   * Finds a node by its ID using depth-first search.
   *
   * @param id - The ID of the node to find.
   * @returns The node if found, null otherwise.
   */
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

  /**
   * Finds the parent SplitNode of a node with the given ID.
   *
   * @param id - The ID of the node whose parent to find.
   * @returns The parent SplitNode, or null if not found or if the node is the root.
   */
  findParentNode(id: string) {
    return findParentNode(this._root, id);
  }

  /**
   * Replaces a child node of a parent with a new node.
   *
   * This mutates the parent node in place.
   *
   * @param params.parent - The parent SplitNode containing the child to replace.
   * @param params.oldChildId - The ID of the child to replace.
   * @param params.newChild - The new node to put in place of the old child.
   * @throws {Error} If the old child is not found or is not a child of the parent.
   */
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
