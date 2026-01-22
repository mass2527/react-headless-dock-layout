// === Size Constraints ===

/**
 * Size constraints for a panel.
 * Used to enforce minimum dimensions during resize.
 */
export interface MinSize {
  width?: number;
  height?: number;
}

// === Node Types ===

/**
 * Leaf node representing a visible panel.
 */
export interface PanelNode {
  type: "panel";
  id: string;
  minSize?: MinSize;
}

/**
 * Split orientation determines how space is divided.
 * - horizontal: left | right children (side by side)
 * - vertical: top | bottom children (stacked)
 */
export type SplitOrientation = "horizontal" | "vertical";

/**
 * Internal node that divides space between two children.
 * - `left` is the first child (left or top depending on orientation)
 * - `right` is the second child (right or bottom)
 * - `ratio` (0-1) determines how much space goes to `left`
 */
export interface SplitNode {
  type: "split";
  id: string;
  orientation: SplitOrientation;
  ratio: number;
  left: LayoutNode;
  right: LayoutNode;
}

/**
 * Union type for any node in the layout tree.
 */
export type LayoutNode = PanelNode | SplitNode;

// === Rect Types ===

/**
 * Base rectangle with absolute positioning.
 */
export interface BaseRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Rectangle for a panel, includes the panel ID.
 */
export interface PanelLayoutRect extends BaseRect {
  type: "panel";
  id: string;
}

/**
 * Rectangle for a split bar (the draggable divider).
 */
export interface SplitLayoutRect extends BaseRect {
  type: "split";
  id: string;
  orientation: SplitOrientation;
}

/**
 * Union of all rect types returned by layout calculation.
 */
export type LayoutRect = PanelLayoutRect | SplitLayoutRect;

// === Direction Types ===

/**
 * Drop directions for drag-and-drop operations.
 */
export type DropDirection = "top" | "bottom" | "left" | "right";

// === Point and Size ===

/**
 * A 2D point coordinate.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Container dimensions.
 */
export interface ContainerSize {
  width: number;
  height: number;
}

// === Placement Strategy ===

/**
 * Describes where a new panel should be placed.
 */
export interface PlacementResult {
  targetId: string;
  direction: DropDirection;
  ratio?: number;
}

/**
 * Interface for custom panel placement logic.
 */
export interface PlacementStrategy {
  getPlacementOnAdd(root: LayoutNode): PlacementResult;
}

// === Options ===

/**
 * Configuration options for the layout manager.
 */
export interface LayoutManagerOptions {
  /** Size of the split bar in pixels (default: 10) */
  gap?: number;
  /** Strategy for determining where new panels are placed */
  placementStrategy?: PlacementStrategy;
}
