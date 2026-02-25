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
import { findNode, findParentNode, replaceChildNode } from "./LayoutTree";
import type { Direction, Orientation, Point, Rect, Size } from "./types";

const MIN_RESIZE_RATIO = 0.1;
const MAX_RESIZE_RATIO = 0.9;

const DIRECTION_CONFIG: Record<
  Direction,
  { orientation: Orientation; sourceFirst: boolean }
> = {
  left: { orientation: "horizontal", sourceFirst: true },
  right: { orientation: "horizontal", sourceFirst: false },
  top: { orientation: "vertical", sourceFirst: true },
  bottom: { orientation: "vertical", sourceFirst: false },
};

function createSplitNode({
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
  const { orientation, sourceFirst } = DIRECTION_CONFIG[direction];
  return {
    id: generateId(),
    type: "split",
    orientation,
    ratio,
    left: sourceFirst ? sourceNode : targetNode,
    right: sourceFirst ? targetNode : sourceNode,
  };
}

function applySiblingMove(
  parent: SplitNode,
  direction: Direction,
  sourceNode: LayoutNode,
  targetNode: LayoutNode,
) {
  const { orientation, sourceFirst } = DIRECTION_CONFIG[direction];
  parent.orientation = orientation;
  parent.left = sourceFirst ? sourceNode : targetNode;
  parent.right = sourceFirst ? targetNode : sourceNode;
}

function getAxisProps(orientation: Orientation) {
  return orientation === "horizontal"
    ? ({ pos: "x", dim: "width" } as const)
    : ({ pos: "y", dim: "height" } as const);
}

function getSurroundingRect(
  root: LayoutNode | null,
  layoutRects: LayoutRect[],
  gap: number,
  id: string,
): Rect {
  const node = findNode(root, id);
  invariant(node !== null, "Node is not null");

  if (node.type === "panel") {
    const rect = layoutRects.find((r) => r.id === id) ?? null;
    invariant(rect !== null, "Rect is not null");
    invariant(rect.type === "panel", "Rect is a panel");
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }

  const leftRect = getSurroundingRect(root, layoutRects, gap, node.left.id);
  const rightRect = getSurroundingRect(root, layoutRects, gap, node.right.id);
  const { dim } = getAxisProps(node.orientation);

  return {
    x: leftRect.x,
    y: leftRect.y,
    width: dim === "width" ? leftRect.width + gap + rightRect.width : leftRect.width,
    height: dim === "height" ? leftRect.height + gap + rightRect.height : leftRect.height,
  };
}

function calculateResizeRatio(
  root: LayoutNode | null,
  layoutRects: LayoutRect[],
  gap: number,
  splitNode: SplitNode,
  splitRect: SplitLayoutRect,
  point: Point,
): number {
  const { pos, dim } = getAxisProps(splitRect.orientation);

  const leftRect = getSurroundingRect(root, layoutRects, gap, splitNode.left.id);
  const rightRect = getSurroundingRect(root, layoutRects, gap, splitNode.right.id);

  const offset = point[pos] - leftRect[pos];
  const ratio = clamp(
    offset / (leftRect[dim] + splitRect[dim] + rightRect[dim]),
    MIN_RESIZE_RATIO,
    MAX_RESIZE_RATIO,
  );

  const total = leftRect[dim] + gap + rightRect[dim];
  const minLeft = calculateMinSize(splitNode.left, gap)[dim];
  const minRatio = (minLeft + gap / 2) / total;
  const minRight = calculateMinSize(splitNode.right, gap)[dim];
  const maxRatio = (total - (minRight + gap / 2)) / total;

  return clamp(ratio, minRatio, maxRatio);
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

    replaceChildNode(this._root, {
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
      applySiblingMove(sourceNodeParent, direction, sourceNode, targetNode);
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
      replaceChildNode(this._root, {
        parent: sourceNodeGrandParent,
        oldChildId: sourceNodeParent.id,
        newChild: sourceNodeSibling,
      });
    }

    const targetNodeParent = findParentNode(this._root, targetId);
    invariant(targetNodeParent !== null);
    const splitNode = createSplitNode({
      direction,
      sourceNode,
      targetNode,
    });

    replaceChildNode(this._root, {
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

    splitNode.ratio = calculateResizeRatio(
      this._root,
      this._layoutRects,
      this._options.gap,
      splitNode,
      resizingRect,
      point,
    );

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
      this._root = createSplitNode({
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

    const splitNode = createSplitNode({
      direction,
      sourceNode: {
        id,
        type: "panel",
      },
      targetNode,
      ratio,
    });
    replaceChildNode(this._root, {
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
    this._layoutRects = calculateLayoutRects(this._root, this._options);
    this.emit();
  }

  private findRect(id: string) {
    return this._layoutRects.find((rect) => rect.id === id) ?? null;
  }
}
