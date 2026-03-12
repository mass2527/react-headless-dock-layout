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

export interface AxisConfig {
  position: "x" | "y";
  size: "width" | "height";
  crossPosition: "x" | "y";
  crossSize: "width" | "height";
}

const horizontalAxis: AxisConfig = {
  position: "x",
  size: "width",
  crossPosition: "y",
  crossSize: "height",
};

const verticalAxis: AxisConfig = {
  position: "y",
  size: "height",
  crossPosition: "x",
  crossSize: "width",
};

export function getAxis(orientation: Orientation): AxisConfig {
  return orientation === "horizontal" ? horizontalAxis : verticalAxis;
}

export function buildRect(
  axis: AxisConfig,
  main: number,
  cross: number,
  mainSize: number,
  crossSize: number,
): Rect {
  return {
    [axis.position]: main,
    [axis.crossPosition]: cross,
    [axis.size]: mainSize,
    [axis.crossSize]: crossSize,
  } as unknown as Rect;
}

export function buildSize(
  axis: AxisConfig,
  mainSize: number,
  crossSize: number,
): Size {
  return {
    [axis.size]: mainSize,
    [axis.crossSize]: crossSize,
  } as unknown as Size;
}
