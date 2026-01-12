import type { Orientation, Rect, Size } from "./internal/LayoutManager/types";
import type { PlacementStrategy } from "./strategies";

export interface LayoutManagerOptions {
  /**
   * Gap between panels in pixels.
   * This is the width/height of the split bar between panels.
   * Defaults to `10` if not provided.
   */
  gap?: number;
  /**
   * Strategy for determining where new panels are placed when added.
   * Defaults to `equalWidthRightStrategy` if not provided.
   */
  placementStrategy?: PlacementStrategy;
}

export interface PanelLayoutRect extends Pick<PanelNode, "id" | "type">, Rect {}

export interface SplitLayoutRect
  extends Pick<SplitNode, "id" | "type" | "orientation">,
    Rect {}

export type LayoutRect = PanelLayoutRect | SplitLayoutRect;

export interface PanelNode {
  type: "panel";
  /** Unique identifier for the panel. */
  id: string;
  /**
   * Optional minimum size constraints for the panel.
   * If specified, the panel cannot be resized smaller than these dimensions.
   */
  minSize?: Partial<Size>;
}

export interface SplitNode {
  type: "split";
  /** Unique identifier for the split node. */
  id: string;
  /** Left child node (or top child for vertical splits). */
  left: LayoutNode;
  /** Right child node (or bottom child for vertical splits). */
  right: LayoutNode;
  /**
   * Orientation of the split.
   * - `"horizontal"`: splits left/right
   * - `"vertical"`: splits top/bottom
   */
  orientation: Orientation;
  /**
   * Ratio determining how space is divided between left and right children.
   * Value between 0 and 1, where:
   * - `0.5` means equal space
   * - `< 0.5` means left child gets less space
   * - `> 0.5` means left child gets more space
   */
  ratio: number;
}

export type LayoutNode = PanelNode | SplitNode;
