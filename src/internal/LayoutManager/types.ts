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

export interface AxisKeys {
  pos: "x" | "y";
  size: "width" | "height";
}

/**
 * Maps an orientation to its primary and cross axis property keys.
 * Primary axis is the direction of the split (horizontal → x/width, vertical → y/height).
 * Cross axis is perpendicular to the split.
 */
export function getAxes(orientation: Orientation): {
  primary: AxisKeys;
  cross: AxisKeys;
} {
  return orientation === "horizontal"
    ? {
        primary: { pos: "x", size: "width" },
        cross: { pos: "y", size: "height" },
      }
    : {
        primary: { pos: "y", size: "height" },
        cross: { pos: "x", size: "width" },
      };
}
