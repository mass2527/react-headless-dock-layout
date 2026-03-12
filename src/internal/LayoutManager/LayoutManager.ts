import { equalWidthRightStrategy } from "../../strategies";
import type {
  LayoutManagerOptions,
  LayoutNode,
  LayoutRect,
  SplitLayoutRect,
  SplitNode,
} from "../../types";
import { assertNever } from "../assertNever";
import { clamp } from "../clamp";
import { generateId } from "../generateId";
import { invariant } from "../invariant";

import { calculateLayoutRects } from "./calculateLayoutRects";
import { calculateMinSize } from "./calculateMinSize";
import { findClosestDirection } from "./findClosestDirection";
import { LayoutTree } from "./LayoutTree";
import { buildRect, getAxis } from "./types";
import type { Direction, Orientation, Point, Rect, Size } from "./types";

function directionToSplitConfig(direction: Direction): {
  orientation: Orientation;
  isSourceFirst: boolean;
} {
  switch (direction) {
    case "left":
      return { orientation: "horizontal", isSourceFirst: true };
    case "right":
      return { orientation: "horizontal", isSourceFirst: false };
    case "top":
      return { orientation: "vertical", isSourceFirst: true };
    case "bottom":
      return { orientation: "vertical", isSourceFirst: false };
  }
}

export class LayoutManager {
  private readonly MIN_RESIZE_RATIO = 0.1;
  private readonly MAX_RESIZE_RATIO = 0.9;

  private _tree: LayoutTree;
  private _options: Required<LayoutManagerOptions> & { size: Size };
  private _listeners = new Set<() => void>();
  private _layoutRects: LayoutRect[] = [];

  constructor(root: LayoutNode | null, options?: LayoutManagerOptions) {
    this._tree = new LayoutTree(root);
    this._options = {
      gap: options?.gap ?? 10,
      size: { width: 0, height: 0 },
      placementStrategy: options?.placementStrategy ?? equalWidthRightStrategy,
    };

    this._layoutRects = calculateLayoutRects(root, this._options);
  }

  get root() {
    return this._tree.root;
  }

  set root(root: LayoutNode | null) {
    this._tree.root = root;
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
    if (this._tree.root === null) {
      throw new Error("Root node is null");
    }

    const node = this._tree.findNode(id);

    if (node === null) {
      throw new Error(`Node with id ${id} not found`);
    }

    if (node.type !== "panel") {
      throw new Error(`Node with id ${id} is not a panel`);
    }

    if (node.id === this._tree.root.id) {
      this._tree.root = null;
      this.syncLayoutRects();
      return;
    }

    const parentNode = this._tree.findParentNode(id);
    invariant(parentNode !== null, "Parent node is not null");

    const siblingNode =
      parentNode.left.id === node.id ? parentNode.right : parentNode.left;

    if (parentNode.id === this._tree.root.id) {
      this._tree.root = siblingNode;
      this.syncLayoutRects();
      return;
    }

    const grandParentNode = this._tree.findParentNode(parentNode.id);
    invariant(grandParentNode !== null, "Grand parent node is not null");

    this._tree.replaceChildNode({
      parent: grandParentNode,
      oldChildId: parentNode.id,
      newChild: siblingNode,
    });
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
    if (this._tree.root === null) {
      throw new Error("Root node is null");
    }
    if (this._tree.root.type !== "split") {
      throw new Error("Root node is not a split node");
    }

    const sourceNode = this._tree.findNode(sourceId);

    if (sourceNode === null) {
      throw new Error(`Node with id ${sourceId} not found`);
    }
    if (sourceNode.type !== "panel") {
      throw new Error(`Node with id ${sourceId} is not a panel node`);
    }

    const sourceNodeParent = this._tree.findParentNode(sourceId);
    invariant(sourceNodeParent !== null);

    const targetNode = this._tree.findNode(targetId);

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
      const { orientation, isSourceFirst } = directionToSplitConfig(direction);
      sourceNodeParent.orientation = orientation;
      sourceNodeParent.left = isSourceFirst ? sourceNode : targetNode;
      sourceNodeParent.right = isSourceFirst ? targetNode : sourceNode;
      this.syncLayoutRects();
      return;
    }

    const sourceNodeGrandParent = this._tree.findParentNode(
      sourceNodeParent.id,
    );
    if (sourceNodeGrandParent === null) {
      this._tree.root = sourceNodeSibling;
    } else {
      this._tree.replaceChildNode({
        parent: sourceNodeGrandParent,
        oldChildId: sourceNodeParent.id,
        newChild: sourceNodeSibling,
      });
    }

    const targetNodeParent = this._tree.findParentNode(targetId);
    invariant(targetNodeParent !== null);
    const splitNode = this.createSplitNode({
      direction,
      sourceNode,
      targetNode,
    });

    this._tree.replaceChildNode({
      parent: targetNodeParent,
      oldChildId: targetId,
      newChild: splitNode,
    });

    this.syncLayoutRects();
  }

  resizePanel(id: string, point: Point) {
    if (this._tree.root === null) {
      throw new Error("Root node is null");
    }

    const resizingRect = this.findRect(id);

    if (resizingRect === null) {
      throw new Error(`Rect with id ${id} not found`);
    }

    if (resizingRect.type !== "split") {
      throw new Error(`Rect with id ${id} is not a split node`);
    }

    const splitNode = this._tree.findNode(id);
    invariant(splitNode !== null, "Split node is not null");
    invariant(splitNode.type === "split", "Split node is a split");

    splitNode.ratio = this.calculateResizeRatio(splitNode, resizingRect, point);

    this.syncLayoutRects();
  }

  addPanel(id: string) {
    if (this._tree.root === null) {
      this._tree.root = {
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
    } = this._options.placementStrategy.getPlacementOnAdd(this._tree.root);

    if (targetId === this._tree.root.id) {
      this._tree.root = this.createSplitNode({
        direction,
        ratio,
        sourceNode: {
          id,
          type: "panel",
        },
        targetNode: this._tree.root,
      });

      this.syncLayoutRects();
      return;
    }

    const targetNode = this._tree.findNode(targetId);

    if (targetNode === null) {
      throw new Error(`Node with id ${targetId} not found`);
    }

    const targetNodeParent = this._tree.findParentNode(targetId);
    invariant(targetNodeParent !== null, "Target node parent is not null");

    const splitNode = this.createSplitNode({
      direction,
      sourceNode: {
        id,
        type: "panel",
      },
      targetNode,
      ratio,
    });
    this._tree.replaceChildNode({
      parent: targetNodeParent,
      oldChildId: targetId,
      newChild: splitNode,
    });
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
    this._listeners.forEach((listener) => {
      listener();
    });
  }

  private syncLayoutRects() {
    this._layoutRects = calculateLayoutRects(this._tree.root, this._options);
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
    const { orientation, isSourceFirst } = directionToSplitConfig(direction);
    return {
      id: generateId(),
      type: "split",
      orientation,
      ratio,
      left: isSourceFirst ? sourceNode : targetNode,
      right: isSourceFirst ? targetNode : sourceNode,
    };
  }

  private findRect(id: string) {
    return this._layoutRects.find((rect) => rect.id === id) ?? null;
  }

  private getSurroundingRect(id: string): Rect {
    const node = this._tree.findNode(id);
    invariant(node !== null, "Node is not null");

    if (node.type === "panel") {
      const rect = this.findRect(id);
      invariant(rect !== null, "Rect is not null");
      invariant(rect.type === "panel", "Rect is a panel");

      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    } else if (node.type === "split") {
      const leftRect = this.getSurroundingRect(node.left.id);
      const rightRect = this.getSurroundingRect(node.right.id);
      const axis = getAxis(node.orientation);

      return buildRect(
        axis,
        leftRect[axis.position],
        leftRect[axis.crossPosition],
        leftRect[axis.size] + this._options.gap + rightRect[axis.size],
        leftRect[axis.crossSize],
      );
    } else {
      assertNever(node);
    }
  }

  private calculateResizeRatio(
    splitNode: SplitNode,
    splitRect: SplitLayoutRect,
    point: Point,
  ): number {
    const axis = getAxis(splitRect.orientation);
    const firstRect = this.getSurroundingRect(splitNode.left.id);
    const secondRect = this.getSurroundingRect(splitNode.right.id);

    const firstSize = point[axis.position] - firstRect[axis.position];
    const ratio = clamp(
      firstSize /
        (firstRect[axis.size] + splitRect[axis.size] + secondRect[axis.size]),
      this.MIN_RESIZE_RATIO,
      this.MAX_RESIZE_RATIO,
    );

    const totalSize =
      firstRect[axis.size] + this._options.gap + secondRect[axis.size];
    const halfGap = this._options.gap / 2;

    const minFirstSize = calculateMinSize(
      splitNode.left,
      this._options.gap,
    )[axis.size];
    const minRatio = (minFirstSize + halfGap) / totalSize;

    const minSecondSize = calculateMinSize(
      splitNode.right,
      this._options.gap,
    )[axis.size];
    const maxRatio = (totalSize - (minSecondSize + halfGap)) / totalSize;

    return clamp(ratio, minRatio, maxRatio);
  }
}
