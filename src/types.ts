import type { Orientation, Rect, Size } from "./internal/LayoutManager/types";
import type { PlacementStrategy } from "./strategies";

export interface LayoutManagerOptions {
  size?: Size;
  gap?: number;
  placementStrategy?: PlacementStrategy;
}

export interface PanelLayoutRect extends Pick<PanelNode, "id" | "type">, Rect {}

export interface SplitLayoutRect
  extends Pick<SplitNode, "id" | "type" | "orientation">,
    Rect {}

export type LayoutRect = PanelLayoutRect | SplitLayoutRect;

export interface PanelNode {
  type: "panel";
  id: string;
  minSize?: Partial<Size>;
}

export interface SplitNode {
  type: "split";
  id: string;
  left: LayoutNode;
  right: LayoutNode;
  orientation: Orientation;
  ratio: number;
}

export type LayoutNode = PanelNode | SplitNode;
