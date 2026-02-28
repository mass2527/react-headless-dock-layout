import { equalWidthRightStrategy } from "../../strategies";
import type {
  LayoutManagerOptions,
  LayoutNode,
  LayoutRect,
  SplitLayoutRect,
  SplitNode,
} from "../../types";
import { clamp } from "../clamp";
import { generateId } from "../generateId";
import { invariant } from "../invariant";

import { calculateLayoutRects } from "./calculateLayoutRects";
import { calculateMinSize } from "./calculateMinSize";
import { findClosestDirection } from "./findClosestDirection";
import { findNode, findParentNode, replaceChildNode } from "./tree";
import type { Direction, Orientation, Point, Rect, Size } from "./types";

// Direction semantics as data, not code branches.
// A direction encodes which orientation to split and which side the source goes on.
const DIRECTION_TO_SPLIT: Record<
  Direction,
  { orientation: Orientation; sourceFirst: boolean }
> = {
  left: { orientation: "horizontal", sourceFirst: true },
  right: { orientation: "horizontal", sourceFirst: false },
  top: { orientation: "vertical", sourceFirst: true },
  bottom: { orientation: "vertical", sourceFirst: false },
};

// Axis selection as data, not duplicated code branches.
// Maps orientation to the position and dimension keys it operates on.
const ORIENTATION_AXIS: Record<
  Orientation,
  { pos: "x" | "y"; dim: "width" | "height" }
> = {
  horizontal: { pos: "x", dim: "width" },
  vertical: { pos: "y", dim: "height" },
};

export class LayoutManager {
  private readonly MIN_RESIZE_RATIO = 0.1;
  private readonly MAX_RESIZE_RATIO = 0.9;

  private _root: LayoutNode | null;
  private _options: Required<LayoutManagerOptions> & { size: Size };
  private _listeners = new Set<() => void>();
  private _layoutRects: LayoutRect[] = [];

  constructor(root: LayoutNode | null, options?: LayoutManagerOptions) {
    this._root = root;
    this._options = {
      gap: options?.gap ?? 10,
      size: { width: 0, height: 0 },
      placementStrategy: options?.placementStrategy ?? equalWidthRightStrategy,
    };

    this._layoutRects = calculateLayoutRects(root, this._options);
  }

  get root() {
    return this._root;
  }

  set root(root: LayoutNode | null) {
    this._root = root;
    this.syncLayoutRects();
  }

  get layoutRects() {
    return this._layoutRects;
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };

  setSize(size: Size) {
    this._options.size = size;
    this.syncLayoutRects();
  }

  removePanel(id: string) {
    if (this._root === null) {
      throw new Error("Root node is null");
    }

    const node = findNode(this._root, id);

    if (node === null) {
      throw new Error(`Node with id ${id} not found`);
    }

    if (node.type !== "panel") {
      throw new Error(`Node with id ${id} is not a panel`);
    }

    if (node.id === this._root.id) {
      this._root = null;
      this.syncLayoutRects();
      return;
    }

    const parentNode = findParentNode(this._root, id);
    invariant(parentNode !== null);

    const siblingNode =
      parentNode.left.id === node.id ? parentNode.right : parentNode.left;

    if (parentNode.id === this._root.id) {
      this._root = siblingNode;
      this.syncLayoutRects();
      return;
    }

    const grandParentNode = findParentNode(this._root, parentNode.id);
    invariant(grandParentNode !== null);

    replaceChildNode(grandParentNode, parentNode.id, siblingNode);
    this.syncLayoutRects();
  }

  movePanel({
    sourceId,
    targetId,
    point,
  }: {
    sourceId: string;
    targetId: string;
    point: Point;
  }) {
    if (this._root === null) {
      throw new Error("Root node is null");
    }
    if (this._root.type !== "split") {
      throw new Error("Root node is not a split node");
    }

    const sourceNode = findNode(this._root, sourceId);

    if (sourceNode === null) {
      throw new Error(`Node with id ${sourceId} not found`);
    }
    if (sourceNode.type !== "panel") {
      throw new Error(`Node with id ${sourceId} is not a panel node`);
    }

    const sourceNodeParent = findParentNode(this._root, sourceId);
    invariant(sourceNodeParent !== null);

    const targetNode = findNode(this._root, targetId);

    if (targetNode === null) {
      throw new Error(`Node with id ${targetId} not found`);
    }
    if (targetNode.type !== "panel") {
      throw new Error(`Node with id ${targetId} is not a panel node`);
    }

    const sourceNodeSibling =
      sourceNodeParent.left.id === sourceId
        ? sourceNodeParent.right
        : sourceNodeParent.left;

    const targetRect = this.findRect(targetId);
    invariant(targetRect !== null);
    invariant(targetRect.type === "panel");
    const direction = findClosestDirection(targetRect, point);

    if (sourceNodeSibling.id === targetId) {
      const { orientation, sourceFirst } = DIRECTION_TO_SPLIT[direction];
      sourceNodeParent.orientation = orientation;
      sourceNodeParent.left = sourceFirst ? sourceNode : targetNode;
      sourceNodeParent.right = sourceFirst ? targetNode : sourceNode;
      this.syncLayoutRects();
      return;
    }

    const sourceNodeGrandParent = findParentNode(
      this._root,
      sourceNodeParent.id,
    );
    if (sourceNodeGrandParent === null) {
      this._root = sourceNodeSibling;
    } else {
      replaceChildNode(
        sourceNodeGrandParent,
        sourceNodeParent.id,
        sourceNodeSibling,
      );
    }

    const targetNodeParent = findParentNode(this._root, targetId);
    invariant(targetNodeParent !== null);
    const splitNode = this.createSplitNode({
      direction,
      sourceNode,
      targetNode,
    });

    replaceChildNode(targetNodeParent, targetId, splitNode);

    this.syncLayoutRects();
  }

  resizePanel(id: string, point: Point) {
    if (this._root === null) {
      throw new Error("Root node is null");
    }

    const resizingRect = this.findRect(id);

    if (resizingRect === null) {
      throw new Error(`Rect with id ${id} not found`);
    }

    if (resizingRect.type !== "split") {
      throw new Error(`Rect with id ${id} is not a split node`);
    }

    const splitNode = findNode(this._root, id);
    invariant(splitNode !== null && splitNode.type === "split");

    splitNode.ratio = this.calculateResizeRatio(splitNode, resizingRect, point);

    this.syncLayoutRects();
  }

  addPanel(id: string) {
    if (this._root === null) {
      this._root = {
        id,
        type: "panel",
      };
      this.syncLayoutRects();
      return;
    }

    const {
      targetId,
      direction,
      ratio = 0.5,
    } = this._options.placementStrategy.getPlacementOnAdd(this._root);

    const newPanel: LayoutNode = { id, type: "panel" };

    if (targetId === this._root.id) {
      this._root = this.createSplitNode({
        direction,
        ratio,
        sourceNode: newPanel,
        targetNode: this._root,
      });

      this.syncLayoutRects();
      return;
    }

    const targetNode = findNode(this._root, targetId);

    if (targetNode === null) {
      throw new Error(`Node with id ${targetId} not found`);
    }

    const targetNodeParent = findParentNode(this._root, targetId);
    invariant(targetNodeParent !== null);

    const splitNode = this.createSplitNode({
      direction,
      sourceNode: newPanel,
      targetNode,
      ratio,
    });
    replaceChildNode(targetNodeParent, targetId, splitNode);
    this.syncLayoutRects();
  }

  calculateDropTarget({
    draggedPanelId,
    targetPanelId,
    point,
  }: {
    draggedPanelId: string;
    targetPanelId: string;
    point: Point;
  }) {
    invariant(
      draggedPanelId !== targetPanelId,
      "Dragged panel id is not the same as target panel id",
    );

    const targetRect = this.findRect(targetPanelId);
    invariant(targetRect !== null && targetRect.type === "panel");

    return {
      id: targetPanelId,
      direction: findClosestDirection(targetRect, point),
    };
  }

  private emit() {
    for (const listener of this._listeners) {
      listener();
    }
  }

  private syncLayoutRects() {
    this._layoutRects = calculateLayoutRects(this._root, this._options);
    this.emit();
  }

  private createSplitNode({
    direction,
    sourceNode,
    targetNode,
    ratio = 0.5,
  }: {
    direction: Direction;
    sourceNode: LayoutNode;
    targetNode: LayoutNode;
    ratio?: number;
  }): SplitNode {
    const { orientation, sourceFirst } = DIRECTION_TO_SPLIT[direction];
    return {
      id: generateId(),
      type: "split",
      orientation,
      ratio,
      left: sourceFirst ? sourceNode : targetNode,
      right: sourceFirst ? targetNode : sourceNode,
    };
  }

  private findRect(id: string) {
    return this._layoutRects.find((rect) => rect.id === id) ?? null;
  }

  private getSurroundingRect(id: string): Rect {
    const node = findNode(this._root, id);
    invariant(node !== null);

    if (node.type === "panel") {
      const rect = this.findRect(id);
      invariant(rect !== null && rect.type === "panel");
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }

    const leftRect = this.getSurroundingRect(node.left.id);
    const rightRect = this.getSurroundingRect(node.right.id);
    const gap = this._options.gap;

    return {
      x: leftRect.x,
      y: leftRect.y,
      width:
        node.orientation === "horizontal"
          ? leftRect.width + gap + rightRect.width
          : leftRect.width,
      height:
        node.orientation === "vertical"
          ? leftRect.height + gap + rightRect.height
          : leftRect.height,
    };
  }

  private calculateResizeRatio(
    splitNode: SplitNode,
    splitRect: SplitLayoutRect,
    point: Point,
  ): number {
    const { pos, dim } = ORIENTATION_AXIS[splitRect.orientation];

    const firstRect = this.getSurroundingRect(splitNode.left.id);
    const secondRect = this.getSurroundingRect(splitNode.right.id);

    const firstSize = point[pos] - firstRect[pos];
    const ratio = clamp(
      firstSize / (firstRect[dim] + splitRect[dim] + secondRect[dim]),
      this.MIN_RESIZE_RATIO,
      this.MAX_RESIZE_RATIO,
    );

    const gap = this._options.gap;
    const total = firstRect[dim] + gap + secondRect[dim];

    const minFirst = calculateMinSize(splitNode.left, gap)[dim];
    const minRatio = (minFirst + gap / 2) / total;

    const minSecond = calculateMinSize(splitNode.right, gap)[dim];
    const maxRatio = (total - (minSecond + gap / 2)) / total;

    return clamp(ratio, minRatio, maxRatio);
  }
}
