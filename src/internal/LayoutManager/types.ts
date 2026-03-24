export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Orientation = "horizontal" | "vertical";

export type Direction = "top" | "bottom" | "left" | "right";

/**
 * Maps an orientation to the axis properties it operates on.
 * Eliminates repeated horizontal/vertical branching throughout the codebase.
 *
 * - horizontal split → divides along x-axis (position: "x", length: "width")
 * - vertical split   → divides along y-axis (position: "y", length: "height")
 */
export interface AxisConfig {
  /** The position property for the primary axis ("x" or "y") */
  position: "x" | "y";
  /** The length property for the primary axis ("width" or "height") */
  length: "width" | "height";
  /** The length property for the cross axis ("height" or "width") */
  crossLength: "width" | "height";
}

export const AXIS_CONFIG: Record<Orientation, AxisConfig> = {
  horizontal: { position: "x", length: "width", crossLength: "height" },
  vertical: { position: "y", length: "height", crossLength: "width" },
};
