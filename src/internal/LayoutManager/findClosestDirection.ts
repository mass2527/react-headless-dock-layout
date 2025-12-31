import type { Direction, Point, Rect } from "./types";

export function findClosestDirection(rect: Rect, point: Point): Direction {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  const dx = (point.x - centerX) / (rect.width / 2);
  const dy = (point.y - centerY) / (rect.height / 2);

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "bottom" : "top";
  }
}
