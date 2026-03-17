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
import { findNode } from "../findNode";
import { findParentNode } from "../findParentNode";
import { generateId } from "../generateId";
import { invariant } from "../invariant";
import { replaceChildNode } from "../replaceChildNode";

import { calculateLayoutRects } from "./calculateLayoutRects";
import { calculateMinSize } from "./calculateMinSize";
import { findClosestDirection } from "./findClosestDirection";
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
      minResizeRatio: options?.minResizeRatio ?? 0.1,
      maxResizeRatio: options?.maxResizeRatio ?? 0.9,
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
    invariant(parentNode !== null, "Parent node is not null");

    const siblingNode =
      parentNode.left.id === node.id ? parentNode.right : parentNode.left;

    if (parentNode.id === this._root.id) {
      this._root = siblingNode;
      this.syncLayoutRects();
      return;
    }

    const grandParentNode = findParentNode(this._root, parentNode.id);
    invariant(grandParentNode !== null, "Grand parent node is not null");

    replaceChildNode({
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

    if (sourceNodeSibling.id === targetId) {
      const { orientation, isSourceFirst } = directionToSplitConfig(direction);
      sourceNodeParent.orientation = orientation;
      sourceNodeParent.left = isSourceFirst ? sourceNode : targetNode;
      sourceNodeParent.right = isSourceFirst ? targetNode : sourceNode;
      this.syncLayoutRects();
      return;
    }

    const sourceNodeGrandParent = findParentNode(this._root,
      sourceNodeParent.id,
    );
    if (sourceNodeGrandParent === null) {
      this._root = sourceNodeSibling;
    } else {
      replaceChildNode({
        parent: sourceNodeGrandParent,
        oldChildId: sourceNodeParent.id,
        newChild: sourceNodeSibling,
      });
    }

    const targetNodeParent = findParentNode(this._root, targetId);
    invariant(targetNodeParent !== null);
    const splitNode = this.createSplitNode({
      direction,
      sourceNode,
      targetNode,
    });

    replaceChildNode({
      parent: targetNodeParent,
      oldChildId: targetId,
      newChild: splitNode,
    });

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
    invariant(splitNode !== null, "Split node is not null");
    invariant(splitNode.type === "split", "Split node is a split");

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

    if (targetId === this._root.id) {
      this._root = this.createSplitNode({
        direction,
        ratio,
        sourceNode: {
          id,
          type: "panel",
        },
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
    replaceChildNode({
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
    const node = findNode(this._root, id);
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

      if (node.orientation === "horizontal") {
        return {
          x: leftRect.x,
          y: leftRect.y,
          width: leftRect.width + this._options.gap + rightRect.width,
          height: leftRect.height,
        };
      } else if (node.orientation === "vertical") {
        return {
          x: leftRect.x,
          y: leftRect.y,
          width: leftRect.width,
          height: leftRect.height + this._options.gap + rightRect.height,
        };
      } else {
        assertNever(node.orientation);
      }
    } else {
      assertNever(node);
    }
  }

  private calculateResizeRatio(
    splitNode: SplitNode,
    splitRect: SplitLayoutRect,
    point: Point,
  ): number {
    if (splitRect.orientation === "horizontal") {
      const leftRect = this.getSurroundingRect(splitNode.left.id);
      const rightRect = this.getSurroundingRect(splitNode.right.id);
      const leftWidth = point.x - leftRect.x;
      const ratio = clamp(
        leftWidth / (leftRect.width + splitRect.width + rightRect.width),
        this._options.minResizeRatio,
        this._options.maxResizeRatio,
      );

      const totalWidth = leftRect.width + this._options.gap + rightRect.width;

      const minLeftWidth = calculateMinSize(
        splitNode.left,
        this._options.gap,
      ).width;
      const minRatio = (minLeftWidth + this._options.gap / 2) / totalWidth;

      const minRightWidth = calculateMinSize(
        splitNode.right,
        this._options.gap,
      ).width;
      const maxRatio =
        (totalWidth - (minRightWidth + this._options.gap / 2)) / totalWidth;

      return clamp(ratio, minRatio, maxRatio);
    } else if (splitRect.orientation === "vertical") {
      const topRect = this.getSurroundingRect(splitNode.left.id);
      const bottomRect = this.getSurroundingRect(splitNode.right.id);
      const topHeight = point.y - topRect.y;
      const ratio = clamp(
        topHeight / (topRect.height + splitRect.height + bottomRect.height),
        this._options.minResizeRatio,
        this._options.maxResizeRatio,
      );

      const totalHeight =
        topRect.height + this._options.gap + bottomRect.height;

      const minTopHeight = calculateMinSize(
        splitNode.left,
        this._options.gap,
      ).height;
      const minRatio = (minTopHeight + this._options.gap / 2) / totalHeight;

      const minBottomHeight = calculateMinSize(
        splitNode.right,
        this._options.gap,
      ).height;
      const maxRatio =
        (totalHeight - (minBottomHeight + this._options.gap / 2)) / totalHeight;

      return clamp(ratio, minRatio, maxRatio);
    } else {
      assertNever(splitRect.orientation);
    }
  }
}
