import type { Orientation, Rect, Size } from "./internal/LayoutManager/types";
import type { PlacementStrategy } from "./strategies";

/** Configuration options for the layout manager. */
export interface LayoutManagerOptions {
  /** Gap (in pixels) between panels, also the split bar width/height. @default 10 */
  gap?: number;
  /** Strategy for placing new panels. @default equalWidthRightStrategy */
  placementStrategy?: PlacementStrategy;
}

/** Computed rectangle for a panel, including position and size. */
export interface PanelLayoutRect extends Pick<PanelNode, "id" | "type">, Rect {}

/** Computed rectangle for a split bar (resize handle), including position and size. */
export interface SplitLayoutRect
  extends Pick<SplitNode, "id" | "type" | "orientation">,
    Rect {}

/** Union of all computed layout rectangles (panels and split bars). */
export type LayoutRect = PanelLayoutRect | SplitLayoutRect;

/** Leaf node representing a single panel in the layout tree. */
export interface PanelNode {
  type: "panel";
  /** Unique identifier for this panel. */
  id: string;
  /** Minimum width/height constraints. Panel cannot be resized below these values. */
  minSize?: Partial<Size>;
}

/** Branch node that splits space between two child nodes. */
export interface SplitNode {
  type: "split";
  /** Unique identifier for this split. */
  id: string;
  /** Left (horizontal) or top (vertical) child node. */
  left: LayoutNode;
  /** Right (horizontal) or bottom (vertical) child node. */
  right: LayoutNode;
  /** Split direction: `"horizontal"` (left/right) or `"vertical"` (top/bottom). */
  orientation: Orientation;
  /** Space ratio for left child (0-1). 0.5 = equal split, <0.5 = left smaller. */
  ratio: number;
}

/** A node in the layout tree. Either a leaf panel or a branch split. */
export type LayoutNode = PanelNode | SplitNode;
