# react-headless-dock-layout

A lightweight, headless dock layout library for React.

## Features

- **Headless** - You control all rendering and styling. This library only provides state and behavior.
- **Lightweight** - Implements only core dock layout features. No tabs, floating windows, or complex UI.
- **Panel Management** - Add, remove, drag-and-drop, and resize panels through split bars.

## When to Use

**Use this library if:**
- You need full control over UI design and styling
- You want a simple, focused dock layout solution
- Your requirements are basic panel operations (add/remove/move/resize)

**Don't use this library if:**
- You need pre-styled components ready to use
- You require tabs, floating windows, or complex docking features
- You want a complete IDE-like layout system


## Requirements

- React >= 18.0.0

## Installation

```bash
npm install react-headless-dock-layout
# or
yarn add react-headless-dock-layout
# or
pnpm add react-headless-dock-layout
```

## Usage

```tsx
import { useDockLayout } from 'react-headless-dock-layout';

function App() {
  const {
    addPanel,
    removePanel,
    containerRef,
    layoutRects,
    draggingRect,
    getRectProps,
    getDropIndicatorProps,
    getDragHandleProps,
  } = useDockLayout<HTMLDivElement>(null);

  return (
    <div>
      <button type="button" onClick={() => addPanel("explorer")}>
        Add Explorer Panel
      </button>
      <button type="button" onClick={() => addPanel("terminal")}>
        Add Terminal Panel
      </button>

      <div ref={containerRef} style={{ height: "90vh", position: "relative" }}>
        {layoutRects.map((rect) => {
          if (rect.type === "split") {
            const { style, ...props } = getRectProps(rect);
            return (
              <div
                key={rect.id}
                style={{ ...style, backgroundColor: "gray" }}
                {...props}
              />
            );
          }

          if (rect.type === "panel") {
            const { style, ...props } = getRectProps(rect);
            const dropIndicatorProps = getDropIndicatorProps(rect);

            return (
              <div
                key={rect.id}
                style={{
                  ...style,
                  opacity: draggingRect?.id === rect.id ? 0.5 : 1,
                }}
                {...props}
              >
                {dropIndicatorProps && (
                  <div
                    style={{
                      ...dropIndicatorProps.style,
                      backgroundColor: "blue",
                      opacity: 0.5,
                    }}
                  />
                )}

                <button {...getDragHandleProps(rect)}>Drag</button>
                <button type="button" onClick={() => removePanel(rect.id)}>
                  Close
                </button>

                {rect.id === "explorer" && <div>Explorer Content</div>}
                {rect.id === "terminal" && <div>Terminal Content</div>}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
```

## Advanced

### Placement Strategies

A placement strategy determines where new panels are placed when added. The default strategy is `equalWidthRightStrategy`, which adds panels to the right with equal widths.

To use a custom strategy, pass it in the options. Here's an example that adds panels to the rightmost panel, alternating split directions:

```tsx
import { useDockLayout, type PlacementStrategy, type LayoutNode, type PanelNode, type SplitNode } from 'react-headless-dock-layout';

function findRightMostPanel(node: LayoutNode): PanelNode {
  if (node.type === "panel") return node;
  if (node.type === "split") return findRightMostPanel(node.right);
  throw new Error("Unexpected node type");
}

function findParentNode(root: LayoutNode, id: string): SplitNode | null {
  function find(node: LayoutNode): SplitNode | null {
    if (node.type === "panel") return null;
    if (node.left.id === id || node.right.id === id) return node;
    return find(node.left) ?? find(node.right);
  }
  return find(root);
}

const myStrategy: PlacementStrategy = {
  getPlacementOnAdd(root) {
    const rightMostPanel = findRightMostPanel(root);
    const parentNode = findParentNode(root, rightMostPanel.id);

    return {
      targetId: rightMostPanel.id,
      direction: parentNode?.orientation === "horizontal" ? "bottom" : "right",
      ratio: 0.5,
    };
  },
};

const { addPanel } = useDockLayout(null, {
  placementStrategy: myStrategy,
});
```
