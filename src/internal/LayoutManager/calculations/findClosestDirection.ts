import type { Direction, Point, Rect } from "../types";

/**
 * Determines which edge of a rectangle a point is closest to.
 *
 * This is used during drag-and-drop to determine where a dropped panel
 * should be placed relative to the target panel.
 *
 * **Algorithm:**
 * 1. Normalize the point's position relative to the rect center
 * 2. Scale by rect dimensions to handle non-square rectangles
 * 3. Compare absolute X vs Y distance to determine axis
 * 4. Sign determines which edge (left/right or top/bottom)
 *
 * @param rect - The rectangle to test against.
 * @param point - The point to find the closest edge for.
 * @returns The direction of the closest edge: "top", "bottom", "left", or "right".
 */
export function findClosestDirection(rect: Rect, point: Point): Direction {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  // Normalize distances by rect half-dimensions for aspect ratio correction
  const dx = (point.x - centerX) / (rect.width / 2);
  const dy = (point.y - centerY) / (rect.height / 2);

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "bottom" : "top";
  }
}
