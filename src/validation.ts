import type { LayoutNode, PanelNode, SplitNode } from "./types";

/**
 * Validation error returned when a layout node is invalid.
 */
export interface ValidationError {
  /** Human-readable description of the validation error. */
  message: string;
  /** Dot-notation path to the invalid node (e.g., "root.left.right"). */
  path: string;
}

/**
 * Result of validating a layout node.
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

/**
 * Options for layout validation.
 */
export interface ValidationOptions {
  /**
   * Whether to check for duplicate IDs in the layout tree.
   * Defaults to `true`.
   */
  checkDuplicateIds?: boolean;
}

/**
 * Validates a layout node and returns detailed errors if invalid.
 *
 * This function performs comprehensive validation of a layout tree:
 * - Checks that all required properties exist and have correct types
 * - Validates that ratios are between 0 and 1
 * - Detects duplicate IDs (optional, enabled by default)
 * - Validates nested structure recursively
 *
 * @param node - The layout node to validate (can be `null` for empty layout).
 * @param options - Optional validation configuration.
 * @returns A `ValidationResult` indicating whether the layout is valid.
 *
 * @example
 * ```ts
 * const saved = localStorage.getItem("layout");
 * if (saved) {
 *   const parsed = JSON.parse(saved);
 *   const result = validateLayout(parsed);
 *   if (!result.valid) {
 *     console.error("Invalid layout:", result.errors);
 *     // Use a default layout instead
 *   }
 * }
 * ```
 */
export function validateLayout(
  node: unknown,
  options: ValidationOptions = {},
): ValidationResult {
  const { checkDuplicateIds = true } = options;
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  validateNode(node, "root", errors, seenIds, checkDuplicateIds);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

function validateNode(
  node: unknown,
  path: string,
  errors: ValidationError[],
  seenIds: Set<string>,
  checkDuplicateIds: boolean,
): void {
  // null is valid (empty layout)
  if (node === null) {
    return;
  }

  // Must be an object
  if (typeof node !== "object" || Array.isArray(node)) {
    errors.push({
      message: `Expected an object or null, got ${Array.isArray(node) ? "array" : typeof node}`,
      path,
    });
    return;
  }

  const nodeObj = node as Record<string, unknown>;

  // Must have a type property
  if (!("type" in nodeObj)) {
    errors.push({
      message: 'Missing required property "type"',
      path,
    });
    return;
  }

  // Type must be "panel" or "split"
  if (nodeObj.type !== "panel" && nodeObj.type !== "split") {
    errors.push({
      message: `Invalid type "${nodeObj.type}", expected "panel" or "split"`,
      path,
    });
    return;
  }

  // Must have an id property
  if (!("id" in nodeObj)) {
    errors.push({
      message: 'Missing required property "id"',
      path,
    });
    return;
  }

  // ID must be a string
  if (typeof nodeObj.id !== "string") {
    errors.push({
      message: `Invalid id type "${typeof nodeObj.id}", expected string`,
      path,
    });
    return;
  }

  // ID must not be empty
  if (nodeObj.id.trim() === "") {
    errors.push({
      message: "ID cannot be empty",
      path,
    });
    return;
  }

  // Check for duplicate IDs
  if (checkDuplicateIds) {
    if (seenIds.has(nodeObj.id)) {
      errors.push({
        message: `Duplicate ID "${nodeObj.id}" found in layout tree`,
        path,
      });
    }
    seenIds.add(nodeObj.id);
  }

  if (nodeObj.type === "panel") {
    validatePanelNode(nodeObj, path, errors);
  } else {
    validateSplitNode(nodeObj, path, errors, seenIds, checkDuplicateIds);
  }
}

function validatePanelNode(
  node: Record<string, unknown>,
  path: string,
  errors: ValidationError[],
): void {
  // minSize is optional, but if present must be valid
  if ("minSize" in node && node.minSize !== undefined) {
    if (typeof node.minSize !== "object" || node.minSize === null) {
      errors.push({
        message: `Invalid minSize type "${typeof node.minSize}", expected object`,
        path: `${path}.minSize`,
      });
      return;
    }

    const minSize = node.minSize as Record<string, unknown>;

    if ("width" in minSize && minSize.width !== undefined) {
      if (typeof minSize.width !== "number" || minSize.width < 0) {
        errors.push({
          message: `Invalid minSize.width "${minSize.width}", expected non-negative number`,
          path: `${path}.minSize.width`,
        });
      }
    }

    if ("height" in minSize && minSize.height !== undefined) {
      if (typeof minSize.height !== "number" || minSize.height < 0) {
        errors.push({
          message: `Invalid minSize.height "${minSize.height}", expected non-negative number`,
          path: `${path}.minSize.height`,
        });
      }
    }
  }
}

function validateSplitNode(
  node: Record<string, unknown>,
  path: string,
  errors: ValidationError[],
  seenIds: Set<string>,
  checkDuplicateIds: boolean,
): void {
  // Must have orientation
  if (!("orientation" in node)) {
    errors.push({
      message: 'Missing required property "orientation"',
      path,
    });
  } else if (node.orientation !== "horizontal" && node.orientation !== "vertical") {
    errors.push({
      message: `Invalid orientation "${node.orientation}", expected "horizontal" or "vertical"`,
      path: `${path}.orientation`,
    });
  }

  // Must have ratio
  if (!("ratio" in node)) {
    errors.push({
      message: 'Missing required property "ratio"',
      path,
    });
  } else if (typeof node.ratio !== "number") {
    errors.push({
      message: `Invalid ratio type "${typeof node.ratio}", expected number`,
      path: `${path}.ratio`,
    });
  } else if (node.ratio < 0 || node.ratio > 1) {
    errors.push({
      message: `Invalid ratio "${node.ratio}", expected value between 0 and 1`,
      path: `${path}.ratio`,
    });
  }

  // Must have left child
  if (!("left" in node)) {
    errors.push({
      message: 'Missing required property "left"',
      path,
    });
  } else {
    validateNode(node.left, `${path}.left`, errors, seenIds, checkDuplicateIds);
  }

  // Must have right child
  if (!("right" in node)) {
    errors.push({
      message: 'Missing required property "right"',
      path,
    });
  } else {
    validateNode(node.right, `${path}.right`, errors, seenIds, checkDuplicateIds);
  }
}

/**
 * Type guard that checks if a value is a valid `LayoutNode`.
 *
 * This is a simpler alternative to `validateLayout` when you just need
 * a boolean result for type narrowing.
 *
 * @param node - The value to check.
 * @returns `true` if the value is a valid `LayoutNode`, `false` otherwise.
 *
 * @example
 * ```ts
 * const saved = localStorage.getItem("layout");
 * if (saved) {
 *   const parsed = JSON.parse(saved);
 *   if (isValidLayoutNode(parsed)) {
 *     // parsed is now typed as LayoutNode
 *     useDockLayout(parsed);
 *   }
 * }
 * ```
 */
export function isValidLayoutNode(node: unknown): node is LayoutNode | null {
  return validateLayout(node).valid;
}

/**
 * Type guard that checks if a value is a valid `PanelNode`.
 *
 * @param node - The value to check.
 * @returns `true` if the value is a valid `PanelNode`.
 */
export function isValidPanelNode(node: unknown): node is PanelNode {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    return false;
  }

  const nodeObj = node as Record<string, unknown>;

  if (nodeObj.type !== "panel") {
    return false;
  }

  if (typeof nodeObj.id !== "string" || nodeObj.id.trim() === "") {
    return false;
  }

  // Check minSize if present
  if ("minSize" in nodeObj && nodeObj.minSize !== undefined) {
    if (typeof nodeObj.minSize !== "object" || nodeObj.minSize === null) {
      return false;
    }

    const minSize = nodeObj.minSize as Record<string, unknown>;

    if ("width" in minSize && minSize.width !== undefined) {
      if (typeof minSize.width !== "number" || minSize.width < 0) {
        return false;
      }
    }

    if ("height" in minSize && minSize.height !== undefined) {
      if (typeof minSize.height !== "number" || minSize.height < 0) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Type guard that checks if a value is a valid `SplitNode`.
 *
 * @param node - The value to check.
 * @returns `true` if the value is a valid `SplitNode`.
 */
export function isValidSplitNode(node: unknown): node is SplitNode {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    return false;
  }

  const nodeObj = node as Record<string, unknown>;

  if (nodeObj.type !== "split") {
    return false;
  }

  if (typeof nodeObj.id !== "string" || nodeObj.id.trim() === "") {
    return false;
  }

  if (nodeObj.orientation !== "horizontal" && nodeObj.orientation !== "vertical") {
    return false;
  }

  if (typeof nodeObj.ratio !== "number" || nodeObj.ratio < 0 || nodeObj.ratio > 1) {
    return false;
  }

  if (!("left" in nodeObj) || !isValidLayoutNode(nodeObj.left)) {
    return false;
  }

  if (!("right" in nodeObj) || !isValidLayoutNode(nodeObj.right)) {
    return false;
  }

  return true;
}
