import type { Orientation, Rect, Size } from "./internal/LayoutManager/types";
import type { PlacementStrategy } from "./strategies";

/**
 * Configuration for the layout system. All fields are optional and have sensible defaults.
 */
export interface LayoutManagerOptions {
  /**
   * Thickness of the split bar between adjacent panels, in pixels.
   * @defaultValue 10
   */
  gap?: number;
  /**
   * Controls where a new panel is inserted when `addPanel` is called.
   * Implement `PlacementStrategy` to create custom placement logic.
   * @defaultValue equalWidthRightStrategy
   */
  placementStrategy?: PlacementStrategy;
  /**
   * The smallest fraction of a split's total length that either child may occupy
   * during a resize drag. Clamps the split ratio to `[minResizeRatio, maxResizeRatio]`.
   * @defaultValue 0.1
   */
  minResizeRatio?: number;
  /**
   * The largest fraction of a split's total length that either child may occupy
   * during a resize drag. Clamps the split ratio to `[minResizeRatio, maxResizeRatio]`.
   * @defaultValue 0.9
   */
  maxResizeRatio?: number;
}

/**
 * Computed position and size for a panel, ready to be applied as CSS.
 * Produced by the layout engine each time the tree or container size changes.
 */
export interface PanelLayoutRect extends Pick<PanelNode, "id" | "type">, Rect {}

/**
 * Computed position and size for a split bar (the draggable divider between two panels).
 * Includes `orientation` so consumers can render the appropriate resize cursor.
 */
export interface SplitLayoutRect
  extends Pick<SplitNode, "id" | "type" | "orientation">,
    Rect {}

/**
 * Union of every rectangle the layout engine produces.
 * Discriminate on `type` (`"panel"` or `"split"`) to determine rendering behavior.
 */
export type LayoutRect = PanelLayoutRect | SplitLayoutRect;

/**
 * A leaf in the layout tree — represents a single user-visible content area.
 */
export interface PanelNode {
  type: "panel";
  id: string;
  /**
   * Minimum pixel dimensions this panel may shrink to during resize.
   * Either axis may be omitted to leave it unconstrained.
   */
  minSize?: Partial<Size>;
}

/**
 * An internal node in the layout tree that divides its space between two children.
 * The binary tree of `SplitNode`s and `PanelNode`s fully describes the layout.
 */
export interface SplitNode {
  type: "split";
  id: string;
  /** The child that appears on the left (horizontal) or top (vertical). */
  left: LayoutNode;
  /** The child that appears on the right (horizontal) or bottom (vertical). */
  right: LayoutNode;
  orientation: Orientation;
  /**
   * Fraction of available space (after subtracting the gap) allocated to `left`.
   * Must be between 0 and 1. For example, 0.5 gives both children equal space;
   * 0.3 gives 30 % to `left` and 70 % to `right`.
   */
  ratio: number;
}

/**
 * A node in the layout tree. The tree is a binary structure where every internal
 * node is a `SplitNode` and every leaf is a `PanelNode`.
 */
export type LayoutNode = PanelNode | SplitNode;
