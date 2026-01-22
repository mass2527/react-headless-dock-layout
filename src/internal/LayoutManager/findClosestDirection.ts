import type { DropDirection, PanelLayoutRect, Point } from "../../types";

/**
 * Determines the closest edge of a panel rect to a pointer position.
 * Used for drop indicator placement during drag-and-drop.
 *
 * @param rect - The panel rectangle
 * @param pointer - Current pointer position
 * @returns The closest edge direction
 */
export function findClosestDirection(
  rect: PanelLayoutRect,
  pointer: Point
): DropDirection {
  const { x, y, width, height } = rect;

  // Calculate distance to each edge
  const distanceToTop = pointer.y - y;
  const distanceToBottom = y + height - pointer.y;
  const distanceToLeft = pointer.x - x;
  const distanceToRight = x + width - pointer.x;

  // Find minimum distance
  const distances: [DropDirection, number][] = [
    ["top", distanceToTop],
    ["bottom", distanceToBottom],
    ["left", distanceToLeft],
    ["right", distanceToRight],
  ];

  distances.sort((a, b) => a[1] - b[1]);

  // Safe to assert since array always has 4 elements
  return distances[0]![0];
}

/**
 * Calculates the drop indicator rect (50% of panel on the target side).
 *
 * @param rect - The panel rectangle
 * @param direction - The drop direction
 * @returns Rectangle for the drop indicator
 */
export function getDropIndicatorRect(
  rect: PanelLayoutRect,
  direction: DropDirection
): { x: number; y: number; width: number; height: number } {
  const { x, y, width, height } = rect;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  switch (direction) {
    case "left":
      return { x, y, width: halfWidth, height };
    case "right":
      return { x: x + halfWidth, y, width: halfWidth, height };
    case "top":
      return { x, y, width, height: halfHeight };
    case "bottom":
      return { x, y: y + halfHeight, width, height: halfHeight };
  }
}
