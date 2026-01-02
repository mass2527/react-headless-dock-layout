import {
  type AddPanelStrategy,
  evenlyDividedHorizontalStrategy,
} from "../../strategies";
import type {
  LayoutManagerOptions,
  LayoutNode,
  LayoutRect,
  SplitNode,
} from "../../types";
import { assertNever } from "../assertNever";
import { clamp } from "../clamp";
import { EventEmitter } from "../EventEmitter";
import { invariant } from "../invariant";

import { calculateLayoutRects } from "./calculateLayoutRects";
import { calculateMinSize } from "./calculateMinSize";
import { findClosestDirection } from "./findClosestDirection";
import { LayoutTree } from "./LayoutTree";
import type { Direction, Point, Rect, Size } from "./types";

export class LayoutManager {
  private _tree: LayoutTree;
  private _options: Required<LayoutManagerOptions>;
  private _eventEmitter = new EventEmitter();
  private _layoutRects: LayoutRect[] = [];
  private _addPanelStrategy: AddPanelStrategy = evenlyDividedHorizontalStrategy;

  constructor(root: LayoutNode | null, options?: LayoutManagerOptions) {
    this._tree = new LayoutTree(root);
    this._options = {
      gap: options?.gap ?? 10,
      size: options?.size ?? { width: 0, height: 0 },
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
    const unsubscribe = this._eventEmitter.subscribe(listener);

    return unsubscribe;
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
      parentId: grandParentNode.id,
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
      if (direction === "left") {
        sourceNodeParent.orientation = "horizontal";
        sourceNodeParent.left = sourceNode;
        sourceNodeParent.right = targetNode;
      } else if (direction === "right") {
        sourceNodeParent.orientation = "horizontal";
        sourceNodeParent.left = targetNode;
        sourceNodeParent.right = sourceNode;
      } else if (direction === "top") {
        sourceNodeParent.orientation = "vertical";
        sourceNodeParent.left = sourceNode;
        sourceNodeParent.right = targetNode;
      } else if (direction === "bottom") {
        sourceNodeParent.orientation = "vertical";
        sourceNodeParent.left = targetNode;
        sourceNodeParent.right = sourceNode;
      } else {
        assertNever(direction);
      }
      this.syncLayoutRects();
      return;
    }

    const sourceNodeGrandParent = this._tree.findParentNode(
      sourceNodeParent.id,
    );
    if (sourceNodeGrandParent === null) {
      this._tree.root = sourceNodeSibling;
    } else if (sourceNodeGrandParent.right.id === sourceNodeParent.id) {
      sourceNodeGrandParent.right = sourceNodeSibling;
    } else if (sourceNodeGrandParent.left.id === sourceNodeParent.id) {
      sourceNodeGrandParent.left = sourceNodeSibling;
    }

    const targetNodeParent = this._tree.findParentNode(targetId);
    invariant(targetNodeParent !== null);
    const splitNode = this.createSplitNode({
      direction,
      sourceNode,
      targetNode,
    });
    if (targetNodeParent.left.id === targetId) {
      targetNodeParent.left = splitNode;
    } else if (targetNodeParent.right.id === targetId) {
      targetNodeParent.right = splitNode;
    } else {
      invariant(false);
    }

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

    if (resizingRect.orientation === "horizontal") {
      const { left: leftRect, right: rightRect } = this.getSplitChildRects(
        resizingRect.id,
      );
      const leftWidth = point.x - leftRect.x;
      const totalWidth = leftRect.width + resizingRect.width + rightRect.width;
      const ratio = clamp(leftWidth / totalWidth, 0.1, 0.9);
      this.setSplitRatio(resizingRect.id, ratio);
    } else if (resizingRect.orientation === "vertical") {
      const { left: topRect, right: bottomRect } = this.getSplitChildRects(
        resizingRect.id,
      );
      const topHeight = point.y - topRect.y;
      const totalHeight =
        topRect.height + resizingRect.height + bottomRect.height;
      const ratio = clamp(topHeight / totalHeight, 0.1, 0.9);
      this.setSplitRatio(resizingRect.id, ratio);
    } else {
      assertNever(resizingRect.orientation);
    }
  }

  addPanel(options?: {
    id?: string;
    targetId?: string;
    direction?: Direction;
    ratio?: number;
  }) {
    const id = options?.id ?? crypto.randomUUID();

    if (this._tree.root === null) {
      this._tree.root = {
        id,
        type: "panel",
      };
      this.syncLayoutRects();
      return;
    }

    const shouldUseStrategy = options?.targetId === undefined;
    const {
      targetId,
      direction = "right",
      ratio = 0.5,
    } = shouldUseStrategy
      ? this._addPanelStrategy.getPlacement(this._tree.root)
      : options;

    invariant(targetId !== undefined, "targetId is not undefined");

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
      parentId: targetNodeParent.id,
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

  serialize() {
    return JSON.stringify({
      root: this._tree.root,
      options: {
        gap: this._options.gap,
      },
    });
  }

  private emit() {
    this._eventEmitter.emit();
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
    switch (direction) {
      case "left": {
        return {
          id: crypto.randomUUID(),
          type: "split",
          orientation: "horizontal",
          ratio,
          left: sourceNode,
          right: targetNode,
        };
      }
      case "right": {
        return {
          id: crypto.randomUUID(),
          type: "split",
          orientation: "horizontal",
          ratio,
          left: targetNode,
          right: sourceNode,
        };
      }
      case "top": {
        return {
          id: crypto.randomUUID(),
          type: "split",
          orientation: "vertical",
          ratio,
          left: sourceNode,
          right: targetNode,
        };
      }
      case "bottom": {
        return {
          id: crypto.randomUUID(),
          type: "split",
          orientation: "vertical",
          ratio,
          left: targetNode,
          right: sourceNode,
        };
      }
      default: {
        assertNever(direction);
      }
    }
  }

  private setSplitRatio(id: string, ratio: number) {
    const splitNode = this._tree.findNode(id);

    invariant(splitNode !== null, "Node is not null");
    invariant(splitNode.type === "split", "Node is a split");

    if (splitNode.orientation === "horizontal") {
      const totalWidth =
        this.getSurroundingRect(splitNode.left.id).width +
        this._options.gap +
        this.getSurroundingRect(splitNode.right.id).width;
      const minLeftWidth = calculateMinSize(
        splitNode.left,
        this._options.gap,
      ).width;
      const minRightWidth = calculateMinSize(
        splitNode.right,
        this._options.gap,
      ).width;
      const minRatio = (minLeftWidth + this._options.gap / 2) / totalWidth;
      const maxRatio =
        (totalWidth - (minRightWidth + this._options.gap / 2)) / totalWidth;
      splitNode.ratio = clamp(ratio, minRatio, maxRatio);
    } else if (splitNode.orientation === "vertical") {
      const totalHeight =
        this.getSurroundingRect(splitNode.left.id).height +
        this._options.gap +
        this.getSurroundingRect(splitNode.right.id).height;
      const minTopHeight = calculateMinSize(
        splitNode.left,
        this._options.gap,
      ).height;
      const minBottomHeight = calculateMinSize(
        splitNode.right,
        this._options.gap,
      ).height;
      const minRatio = (minTopHeight + this._options.gap / 2) / totalHeight;
      const maxRatio =
        (totalHeight - (minBottomHeight + this._options.gap / 2)) / totalHeight;
      splitNode.ratio = clamp(ratio, minRatio, maxRatio);
    } else {
      assertNever(splitNode.orientation);
    }

    this.syncLayoutRects();
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
    }

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
  }

  private getSplitChildRects(splitId: string) {
    const node = this._tree.findNode(splitId);
    invariant(node !== null && node.type === "split");

    return {
      left: this.getSurroundingRect(node.left.id),
      right: this.getSurroundingRect(node.right.id),
    };
  }
}
