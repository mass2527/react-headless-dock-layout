import type { LayoutNode } from "../../types";
import { assertNever } from "../assertNever";

export interface ValidationError {
  code:
    | "DUPLICATE_ID"
    | "INVALID_RATIO"
    | "EMPTY_ID"
    | "INVALID_NODE_TYPE"
    | "MISSING_CHILDREN";
  message: string;
  path: string[];
  nodeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a layout tree for common errors:
 * - Duplicate IDs
 * - Invalid ratios (must be between 0 and 1)
 * - Empty IDs
 * - Missing children on split nodes
 */
export function validateLayoutTree(root: LayoutNode | null): ValidationResult {
  if (root === null) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = [];
  const seenIds = new Map<string, string[]>();

  function validate(node: LayoutNode, path: string[]): void {
    // Check for empty ID
    if (!node.id || node.id.trim() === "") {
      errors.push({
        code: "EMPTY_ID",
        message: `Node at path [${path.join(" > ")}] has an empty ID`,
        path,
      });
    }

    // Track IDs for duplicate detection
    if (node.id) {
      const existingPath = seenIds.get(node.id);
      if (existingPath !== undefined) {
        errors.push({
          code: "DUPLICATE_ID",
          message: `Duplicate ID "${node.id}" found at paths [${existingPath.join(" > ")}] and [${path.join(" > ")}]`,
          path,
          nodeId: node.id,
        });
      } else {
        seenIds.set(node.id, path);
      }
    }

    if (node.type === "panel") {
      // Panel nodes are valid if they have an ID (already checked)
      return;
    }

    if (node.type === "split") {
      // Validate ratio
      if (typeof node.ratio !== "number" || Number.isNaN(node.ratio)) {
        errors.push({
          code: "INVALID_RATIO",
          message: `Split node "${node.id}" has an invalid ratio: ${node.ratio}. Ratio must be a number.`,
          path,
          nodeId: node.id,
        });
      } else if (node.ratio < 0 || node.ratio > 1) {
        errors.push({
          code: "INVALID_RATIO",
          message: `Split node "${node.id}" has an invalid ratio: ${node.ratio}. Ratio must be between 0 and 1.`,
          path,
          nodeId: node.id,
        });
      }

      // Check for missing children
      if (!node.left) {
        errors.push({
          code: "MISSING_CHILDREN",
          message: `Split node "${node.id}" is missing a left child`,
          path,
          nodeId: node.id,
        });
      } else {
        validate(node.left, [...path, "left"]);
      }

      if (!node.right) {
        errors.push({
          code: "MISSING_CHILDREN",
          message: `Split node "${node.id}" is missing a right child`,
          path,
          nodeId: node.id,
        });
      } else {
        validate(node.right, [...path, "right"]);
      }

      return;
    }

    // Unknown node type
    assertNever(node);
  }

  validate(root, ["root"]);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Throws an error if the layout tree is invalid.
 * Useful for validating user-provided layout trees.
 */
export function assertValidLayoutTree(root: LayoutNode | null): void {
  const result = validateLayoutTree(root);
  if (!result.valid) {
    const errorMessages = result.errors.map((e) => e.message).join("\n  - ");
    throw new Error(`Invalid layout tree:\n  - ${errorMessages}`);
  }
}
