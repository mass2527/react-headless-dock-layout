/** Dimensions in pixels. */
export interface Size {
  width: number;
  height: number;
}

/** A coordinate in pixels, relative to the top-left corner of the container. */
export interface Point {
  x: number;
  y: number;
}

/**
 * A positioned rectangle in pixels, relative to the top-left corner of the container.
 * Used to describe where a panel or split bar should be rendered.
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The axis along which a split divides space.
 * - `"horizontal"`: children are placed side by side (left / right)
 * - `"vertical"`: children are stacked (top / bottom)
 */
export type Orientation = "horizontal" | "vertical";

/**
 * The side of a panel where another panel will be placed during a drop or add operation.
 */
export type Direction = "top" | "bottom" | "left" | "right";
