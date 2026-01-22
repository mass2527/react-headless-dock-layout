import type { LayoutNode, SplitNode } from "../../types";

/**
 * Finds a node by its ID in the tree.
 * Returns null if not found.
 */
export function findNode(
  root: LayoutNode | null,
  id: string
): LayoutNode | null {
  if (!root) return null;

  if (root.id === id) return root;

  if (root.type === "split") {
    const leftResult = findNode(root.left, id);
    if (leftResult) return leftResult;
    return findNode(root.right, id);
  }

  return null;
}

/**
 * Finds the parent split node of a given node ID.
 * Returns null if the node is the root or not found.
 */
export function findParentNode(
  root: LayoutNode | null,
  targetId: string
): SplitNode | null {
  if (!root || root.type === "panel") return null;

  if (root.left.id === targetId || root.right.id === targetId) {
    return root;
  }

  const leftResult = findParentNode(root.left, targetId);
  if (leftResult) return leftResult;

  return findParentNode(root.right, targetId);
}

/**
 * Replaces a node in the tree with a new node.
 * Returns a new tree (immutable operation).
 */
export function replaceNode(
  root: LayoutNode,
  targetId: string,
  newNode: LayoutNode
): LayoutNode {
  if (root.id === targetId) {
    return newNode;
  }

  if (root.type === "panel") {
    return root;
  }

  return {
    ...root,
    left: replaceNode(root.left, targetId, newNode),
    right: replaceNode(root.right, targetId, newNode),
  };
}

/**
 * Removes a panel from the tree and restructures.
 * The sibling of the removed panel takes its parent's place.
 * Returns null if removing the last panel.
 */
export function removeNode(
  root: LayoutNode,
  targetId: string
): LayoutNode | null {
  // If root is the target, return null (tree becomes empty)
  if (root.id === targetId) {
    return null;
  }

  if (root.type === "panel") {
    return root;
  }

  // Check if either child is the target
  if (root.left.id === targetId) {
    return root.right;
  }
  if (root.right.id === targetId) {
    return root.left;
  }

  // Recurse into children
  const newLeft = removeNode(root.left, targetId);
  if (newLeft !== root.left) {
    return newLeft === null ? root.right : { ...root, left: newLeft };
  }

  const newRight = removeNode(root.right, targetId);
  if (newRight !== root.right) {
    return newRight === null ? root.left : { ...root, right: newRight };
  }

  return root;
}

/**
 * Traverses the tree and calls the callback for each node.
 * Visits in pre-order (parent, then children).
 */
export function traverseTree(
  root: LayoutNode | null,
  callback: (node: LayoutNode) => void
): void {
  if (!root) return;

  callback(root);

  if (root.type === "split") {
    traverseTree(root.left, callback);
    traverseTree(root.right, callback);
  }
}

/**
 * Collects all panel IDs in the tree.
 */
export function getAllPanelIds(root: LayoutNode | null): string[] {
  const ids: string[] = [];

  traverseTree(root, (node) => {
    if (node.type === "panel") {
      ids.push(node.id);
    }
  });

  return ids;
}

/**
 * Updates the ratio of a specific split node.
 * Returns a new tree (immutable).
 */
export function updateSplitRatio(
  root: LayoutNode,
  splitId: string,
  newRatio: number
): LayoutNode {
  if (root.type === "panel") {
    return root;
  }

  if (root.id === splitId) {
    return { ...root, ratio: newRatio };
  }

  return {
    ...root,
    left: updateSplitRatio(root.left, splitId, newRatio),
    right: updateSplitRatio(root.right, splitId, newRatio),
  };
}

/**
 * Gets the sibling node of a given node ID within its parent split.
 */
export function getSiblingNode(
  root: LayoutNode | null,
  nodeId: string
): LayoutNode | null {
  const parent = findParentNode(root, nodeId);
  if (!parent) return null;

  if (parent.left.id === nodeId) {
    return parent.right;
  }
  return parent.left;
}
