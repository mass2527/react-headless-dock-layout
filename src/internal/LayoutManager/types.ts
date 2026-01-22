/**
 * Internal types for layout geometry calculations.
 *
 * These types are used internally by the LayoutManager and calculation functions.
 * They represent fundamental geometric concepts in the layout system.
 */

/**
 * Represents dimensions (width and height).
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Represents a 2D coordinate point.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents a rectangle with position and dimensions.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The orientation of a split.
 * - "horizontal": Left/right split (the divider line is vertical)
 * - "vertical": Top/bottom split (the divider line is horizontal)
 */
export type Orientation = "horizontal" | "vertical";

/**
 * The four cardinal directions used for panel placement.
 * Indicates which edge/side of a panel to place new content.
 */
export type Direction = "top" | "bottom" | "left" | "right";
