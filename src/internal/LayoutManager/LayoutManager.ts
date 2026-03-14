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
import { getAxes } from "./types";
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
      minResizeRatio: options?.minResizeRatio ?? 0.1,
      maxResizeRatio: options?.maxResizeRatio ?? 0.9,
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
    direction,
  }: {
    sourceId: string;
    targetId: string;
    direction: Direction;
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

  getDropDirection({
    panelId,
    point,
  }: {
    panelId: string;
    point: Point;
  }): Direction {
    const targetRect = this.findRect(panelId);
    invariant(targetRect !== null && targetRect.type === "panel");

    return findClosestDirection(targetRect, point);
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
      const { primary, cross } = getAxes(node.orientation);

      return {
        x: leftRect.x,
        y: leftRect.y,
        [primary.size]:
          leftRect[primary.size] +
          this._options.gap +
          rightRect[primary.size],
        [cross.size]: leftRect[cross.size],
      } as Rect;
    } else {
      assertNever(node);
    }
  }

  private calculateResizeRatio(
    splitNode: SplitNode,
    splitRect: SplitLayoutRect,
    point: Point,
  ): number {
    const { primary } = getAxes(splitRect.orientation);
    const leftRect = this.getSurroundingRect(splitNode.left.id);
    const rightRect = this.getSurroundingRect(splitNode.right.id);

    const leftSize = point[primary.pos] - leftRect[primary.pos];
    const ratio = clamp(
      leftSize /
        (leftRect[primary.size] +
          splitRect[primary.size] +
          rightRect[primary.size]),
      this._options.minResizeRatio,
      this._options.maxResizeRatio,
    );

    const totalSize =
      leftRect[primary.size] + this._options.gap + rightRect[primary.size];

    const minLeftSize = calculateMinSize(
      splitNode.left,
      this._options.gap,
    )[primary.size];
    const minRatio = (minLeftSize + this._options.gap / 2) / totalSize;

    const minRightSize = calculateMinSize(
      splitNode.right,
      this._options.gap,
    )[primary.size];
    const maxRatio =
      (totalSize - (minRightSize + this._options.gap / 2)) / totalSize;

    return clamp(ratio, minRatio, maxRatio);
  }
}
