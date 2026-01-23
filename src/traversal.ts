import { assertNever } from "./internal/assertNever";
import type { LayoutNode, PanelNode, SplitNode } from "./types";

/**
 * Information about a node's position in the layout tree.
 */
export interface NodeInfo<T extends LayoutNode> {
  /** The node itself. */
  node: T;
  /** The depth of the node in the tree (root is 0). */
  depth: number;
  /** The path from root to this node (e.g., ["left", "right"]). */
  path: ("left" | "right")[];
}

/**
 * Callback function for tree traversal.
 *
 * @param info - Information about the current node.
 * @returns `false` to stop traversal early, anything else to continue.
 */
export type TraversalCallback<T extends LayoutNode> = (
  info: NodeInfo<T>,
) => boolean | void;

/**
 * Traverses a layout tree in depth-first order, calling the callback for each node.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @param callback - Function called for each node. Return `false` to stop early.
 *
 * @example
 * ```ts
 * // Log all node IDs
 * traverseLayout(root, ({ node, depth }) => {
 *   console.log("  ".repeat(depth) + node.id);
 * });
 * ```
 *
 * @example
 * ```ts
 * // Find first panel with specific ID
 * let found: PanelNode | null = null;
 * traverseLayout(root, ({ node }) => {
 *   if (node.type === "panel" && node.id === "target") {
 *     found = node;
 *     return false; // Stop traversal
 *   }
 * });
 * ```
 */
export function traverseLayout(
  root: LayoutNode | null,
  callback: TraversalCallback<LayoutNode>,
): void {
  if (root === null) {
    return;
  }

  traverseNode(root, callback, 0, []);
}

function traverseNode(
  node: LayoutNode,
  callback: TraversalCallback<LayoutNode>,
  depth: number,
  path: ("left" | "right")[],
): boolean {
  const result = callback({ node, depth, path });

  if (result === false) {
    return false;
  }

  if (node.type === "panel") {
    return true;
  } else if (node.type === "split") {
    const continueLeft = traverseNode(node.left, callback, depth + 1, [
      ...path,
      "left",
    ]);
    if (!continueLeft) {
      return false;
    }

    const continueRight = traverseNode(node.right, callback, depth + 1, [
      ...path,
      "right",
    ]);
    return continueRight;
  } else {
    assertNever(node);
  }
}

/**
 * Returns all panel nodes in the layout tree.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @returns An array of all `PanelNode` objects in the tree.
 *
 * @example
 * ```ts
 * const panels = findAllPanels(root);
 * console.log(`Layout has ${panels.length} panels`);
 * ```
 */
export function findAllPanels(root: LayoutNode | null): PanelNode[] {
  const panels: PanelNode[] = [];

  traverseLayout(root, ({ node }) => {
    if (node.type === "panel") {
      panels.push(node);
    }
  });

  return panels;
}

/**
 * Returns all split nodes in the layout tree.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @returns An array of all `SplitNode` objects in the tree.
 *
 * @example
 * ```ts
 * const splits = findAllSplits(root);
 * console.log(`Layout has ${splits.length} split dividers`);
 * ```
 */
export function findAllSplits(root: LayoutNode | null): SplitNode[] {
  const splits: SplitNode[] = [];

  traverseLayout(root, ({ node }) => {
    if (node.type === "split") {
      splits.push(node);
    }
  });

  return splits;
}

/**
 * Counts the number of panels in the layout tree.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @returns The number of panels in the tree.
 *
 * @example
 * ```ts
 * const count = countPanels(root);
 * if (count === 0) {
 *   console.log("Layout is empty");
 * }
 * ```
 */
export function countPanels(root: LayoutNode | null): number {
  if (root === null) {
    return 0;
  }

  if (root.type === "panel") {
    return 1;
  } else if (root.type === "split") {
    return countPanels(root.left) + countPanels(root.right);
  } else {
    assertNever(root);
  }
}

/**
 * Finds a node by its ID in the layout tree.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @param id - The ID of the node to find.
 * @returns The node if found, `null` otherwise.
 *
 * @example
 * ```ts
 * const node = findNodeById(root, "panel-1");
 * if (node?.type === "panel") {
 *   console.log("Found panel:", node.id);
 * }
 * ```
 */
export function findNodeById(
  root: LayoutNode | null,
  id: string,
): LayoutNode | null {
  let found: LayoutNode | null = null;

  traverseLayout(root, ({ node }) => {
    if (node.id === id) {
      found = node;
      return false;
    }
  });

  return found;
}

/**
 * Finds a panel by its ID in the layout tree.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @param id - The ID of the panel to find.
 * @returns The panel if found, `null` otherwise.
 *
 * @example
 * ```ts
 * const panel = findPanelById(root, "editor");
 * if (panel) {
 *   console.log("Found editor panel");
 * }
 * ```
 */
export function findPanelById(
  root: LayoutNode | null,
  id: string,
): PanelNode | null {
  const node = findNodeById(root, id);

  if (node === null || node.type !== "panel") {
    return null;
  }

  return node;
}

/**
 * Returns all panel IDs in the layout tree.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @returns An array of panel IDs.
 *
 * @example
 * ```ts
 * const ids = getPanelIds(root);
 * console.log("Panels:", ids.join(", "));
 * ```
 */
export function getPanelIds(root: LayoutNode | null): string[] {
  return findAllPanels(root).map((panel) => panel.id);
}

/**
 * Calculates the maximum depth of the layout tree.
 *
 * @param root - The root node of the layout tree (can be `null`).
 * @returns The maximum depth (0 for single panel, -1 for empty tree).
 *
 * @example
 * ```ts
 * const depth = getTreeDepth(root);
 * console.log(`Layout has ${depth} levels of nesting`);
 * ```
 */
export function getTreeDepth(root: LayoutNode | null): number {
  if (root === null) {
    return -1;
  }

  if (root.type === "panel") {
    return 0;
  } else if (root.type === "split") {
    return 1 + Math.max(getTreeDepth(root.left), getTreeDepth(root.right));
  } else {
    assertNever(root);
  }
}
