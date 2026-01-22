import type {
  LayoutNode,
  LayoutRect,
  PanelLayoutRect,
  SplitLayoutRect,
  ContainerSize,
  LayoutManagerOptions,
  PlacementStrategy,
  DropDirection,
  SplitNode,
  PanelNode,
} from "../../types";
import { calculateLayoutRects } from "./calculateLayoutRects";
import { calculateMinSize } from "./calculateMinSize";
import {
  findNode,
  findParentNode,
  removeNode,
  replaceNode,
  updateSplitRatio,
} from "./LayoutTree";
import { clamp } from "../clamp";
import { generateId } from "../generateId";
import { invariant } from "../invariant";

const DEFAULT_GAP = 10;
const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

type Listener = () => void;

export class LayoutManager {
  private root: LayoutNode | null;
  private size: ContainerSize = { width: 0, height: 0 };
  private gap: number;
  private placementStrategy: PlacementStrategy | null;
  private layoutRects: LayoutRect[] = [];
  private listeners: Set<Listener> = new Set();

  // Drag state
  private draggingPanelId: string | null = null;

  constructor(
    initialRoot: LayoutNode | null,
    options: LayoutManagerOptions = {}
  ) {
    this.root = initialRoot;
    this.gap = options.gap ?? DEFAULT_GAP;
    this.placementStrategy = options.placementStrategy ?? null;
  }

  // === Subscription API (for useSyncExternalStore) ===

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // === Getters ===

  getRoot(): LayoutNode | null {
    return this.root;
  }

  getLayoutRects(): LayoutRect[] {
    return this.layoutRects;
  }

  getDraggingRect(): PanelLayoutRect | null {
    if (!this.draggingPanelId) return null;

    const rect = this.layoutRects.find(
      (r) => r.type === "panel" && r.id === this.draggingPanelId
    );

    return (rect as PanelLayoutRect) ?? null;
  }

  // === Size Management ===

  setSize(size: ContainerSize): void {
    if (this.size.width === size.width && this.size.height === size.height) {
      return;
    }

    this.size = size;
    this.syncLayoutRects();
  }

  private syncLayoutRects(): void {
    this.layoutRects = calculateLayoutRects(this.root, this.size, {
      gap: this.gap,
    });
    this.notify();
  }

  // === Panel Operations ===

  addPanel(id: string, minSize?: { width?: number; height?: number }): void {
    const newPanel: PanelNode = {
      type: "panel",
      id,
      minSize,
    };

    // If tree is empty, new panel becomes root
    if (!this.root) {
      this.root = newPanel;
      this.syncLayoutRects();
      return;
    }

    // Use placement strategy or default behavior
    if (this.placementStrategy) {
      const placement = this.placementStrategy.getPlacementOnAdd(this.root);
      this.insertPanelAt(
        newPanel,
        placement.targetId,
        placement.direction,
        placement.ratio ?? 0.5
      );
    } else {
      // Default: add to the right of the root with 50% split
      this.insertPanelAt(newPanel, this.root.id, "right", 0.5);
    }
  }

  removePanel(id: string): void {
    if (!this.root) return;

    this.root = removeNode(this.root, id);
    this.syncLayoutRects();
  }

  /**
   * Inserts a panel adjacent to a target node.
   * Creates a new split node to contain both.
   */
  private insertPanelAt(
    panel: PanelNode,
    targetId: string,
    direction: DropDirection,
    ratio: number
  ): void {
    invariant(this.root, "Cannot insert panel when root is null");

    const targetNode = findNode(this.root, targetId);
    invariant(targetNode, `Target node not found: ${targetId}`);

    const orientation: "horizontal" | "vertical" =
      direction === "left" || direction === "right" ? "horizontal" : "vertical";

    // Determine which node goes left/right (or top/bottom)
    const panelFirst = direction === "left" || direction === "top";

    const newSplit: SplitNode = {
      type: "split",
      id: generateId(),
      orientation,
      ratio: panelFirst ? ratio : 1 - ratio,
      left: panelFirst ? panel : targetNode,
      right: panelFirst ? targetNode : panel,
    };

    // Replace target with new split
    this.root = replaceNode(this.root, targetId, newSplit);
    this.syncLayoutRects();
  }

  // === Move Panel (Drag and Drop) ===

  /**
   * Moves a panel to a new position relative to a target.
   */
  movePanel(
    sourceId: string,
    targetId: string,
    direction: DropDirection
  ): void {
    if (!this.root || sourceId === targetId) return;

    // Find the source panel
    const sourceNode = findNode(this.root, sourceId);
    invariant(
      sourceNode && sourceNode.type === "panel",
      "Source must be a panel"
    );

    // Remove source from tree (but keep reference)
    const treeWithoutSource = removeNode(this.root, sourceId);

    if (!treeWithoutSource) {
      // Source was the only node, nothing to do
      return;
    }

    // Update root and insert source at new location
    this.root = treeWithoutSource;
    this.insertPanelAt(sourceNode, targetId, direction, 0.5);
  }

  // === Resize Operations ===

  /**
   * Updates the ratio of a split node during resize.
   * Enforces minimum size constraints.
   */
  resizePanel(splitId: string, pointerPosition: number): void {
    if (!this.root) return;

    const splitNode = findNode(this.root, splitId);
    invariant(
      splitNode && splitNode.type === "split",
      "Resize target must be a split node"
    );

    // Find the split bar rect to get its position
    const splitRect = this.layoutRects.find(
      (r) => r.type === "split" && r.id === splitId
    ) as SplitLayoutRect | undefined;
    invariant(splitRect, "Split rect not found");

    // Calculate available space for this split
    const bounds = this.findSplitBounds(splitId);

    // Calculate new ratio based on pointer position
    let newRatio: number;

    if (splitNode.orientation === "horizontal") {
      const availableWidth = bounds.width - this.gap;
      const relativeX = pointerPosition - bounds.x;
      newRatio = relativeX / (availableWidth + this.gap);
    } else {
      const availableHeight = bounds.height - this.gap;
      const relativeY = pointerPosition - bounds.y;
      newRatio = relativeY / (availableHeight + this.gap);
    }

    // Calculate min/max ratio based on child constraints
    const leftMinSize = calculateMinSize(splitNode.left, this.gap);
    const rightMinSize = calculateMinSize(splitNode.right, this.gap);

    let minRatio = MIN_RATIO;
    let maxRatio = MAX_RATIO;

    if (splitNode.orientation === "horizontal") {
      const totalWidth = bounds.width - this.gap;
      if (totalWidth > 0) {
        minRatio = Math.max(MIN_RATIO, leftMinSize.width / totalWidth);
        maxRatio = Math.min(MAX_RATIO, 1 - rightMinSize.width / totalWidth);
      }
    } else {
      const totalHeight = bounds.height - this.gap;
      if (totalHeight > 0) {
        minRatio = Math.max(MIN_RATIO, leftMinSize.height / totalHeight);
        maxRatio = Math.min(MAX_RATIO, 1 - rightMinSize.height / totalHeight);
      }
    }

    // Clamp and apply
    newRatio = clamp(newRatio, minRatio, maxRatio);
    this.root = updateSplitRatio(this.root, splitId, newRatio);
    this.syncLayoutRects();
  }

  /**
   * Finds the bounding rect for a split's available space.
   */
  private findSplitBounds(
    splitId: string
  ): { x: number; y: number; width: number; height: number } {
    const splitNode = findNode(this.root!, splitId) as SplitNode;
    if (!splitNode) {
      return { x: 0, y: 0, width: this.size.width, height: this.size.height };
    }

    // Find all panel rects that are descendants of this split
    const childIds = this.collectChildPanelIds(splitNode);

    const childRects = this.layoutRects.filter(
      (r) => r.type === "panel" && childIds.includes(r.id)
    );

    if (childRects.length === 0) {
      return { x: 0, y: 0, width: this.size.width, height: this.size.height };
    }

    const minX = Math.min(...childRects.map((r) => r.x));
    const minY = Math.min(...childRects.map((r) => r.y));
    const maxX = Math.max(...childRects.map((r) => r.x + r.width));
    const maxY = Math.max(...childRects.map((r) => r.y + r.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX + this.gap,
      height: maxY - minY + this.gap,
    };
  }

  private collectChildPanelIds(node: LayoutNode): string[] {
    if (node.type === "panel") return [node.id];
    return [
      ...this.collectChildPanelIds(node.left),
      ...this.collectChildPanelIds(node.right),
    ];
  }

  // === Drag State ===

  setDraggingPanel(id: string | null): void {
    this.draggingPanelId = id;
    this.notify();
  }

  getDraggingPanelId(): string | null {
    return this.draggingPanelId;
  }
}
