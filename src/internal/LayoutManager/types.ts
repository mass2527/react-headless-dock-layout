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
 * Maps a direction to its corresponding split configuration.
 * Centralizes the knowledge of how directions relate to orientations
 * and child ordering (which side the "source" goes on).
 */
export function directionToSplitConfig(direction: Direction): {
  orientation: Orientation;
  sourceIsLeft: boolean;
} {
  switch (direction) {
    case "left":
      return { orientation: "horizontal", sourceIsLeft: true };
    case "right":
      return { orientation: "horizontal", sourceIsLeft: false };
    case "top":
      return { orientation: "vertical", sourceIsLeft: true };
    case "bottom":
      return { orientation: "vertical", sourceIsLeft: false };
  }
}
