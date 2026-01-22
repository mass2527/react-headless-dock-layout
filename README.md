# react-headless-dock-layout

A lightweight, headless dock layout library for React.

## Features

- **Headless** - You control all rendering and styling
- **Lightweight** - Core dock layout features only (no tabs, floating windows, etc.)
- **Panel Operations** - Add, remove, drag-and-drop, and resize panels

## Installation

```bash
npm install react-headless-dock-layout
```

Requires React 18.0.0 or higher.

## Quick Start

```tsx
import { useDockLayout } from 'react-headless-dock-layout';

function App() {
  const {
    containerRef,
    layoutRects,
    draggingRect,
    addPanel,
    removePanel,
    getRectProps,
    getDropIndicatorProps,
    getDragHandleProps,
  } = useDockLayout<HTMLDivElement>(null);

  return (
    <div>
      <button onClick={() => addPanel("panel-1")}>Add Panel</button>

      <div ref={containerRef} style={{ height: "400px", position: "relative" }}>
        {layoutRects.map((rect) => {
          const { style, ...props } = getRectProps(rect);

          if (rect.type === "split") {
            return (
              <div key={rect.id} style={{ ...style, background: "#ccc" }} {...props} />
            );
          }

          if (rect.type === "panel") {
            const dropProps = getDropIndicatorProps(rect);
            return (
              <div
                key={rect.id}
                style={{ ...style, opacity: draggingRect?.id === rect.id ? 0.5 : 1 }}
                {...props}
              >
                {dropProps && (
                  <div style={{ ...dropProps.style, background: "rgba(0,100,255,0.3)" }} />
                )}
                <button {...getDragHandleProps(rect)}>Drag</button>
                <button onClick={() => removePanel(rect.id)}>Close</button>
                <div>Panel: {rect.id}</div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
```

## API

### `useDockLayout(initialRoot, options?)`

Main hook for managing dock layouts.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialRoot` | `LayoutNode \| null \| () => LayoutNode \| null` | Initial layout tree (use function for lazy init, e.g., from localStorage) |
| `options.gap` | `number` | Gap between panels in pixels (default: `10`) |
| `options.placementStrategy` | `PlacementStrategy` | Strategy for placing new panels (default: `equalWidthRightStrategy`) |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `containerRef` | `RefCallback` | Attach to container element (must have `position: relative`) |
| `layoutRects` | `LayoutRect[]` | Array of panel and split bar rectangles to render |
| `draggingRect` | `PanelLayoutRect \| null` | Currently dragging panel (for visual feedback) |
| `root` | `LayoutNode \| null` | Current layout tree (serialize with `JSON.stringify`) |
| `addPanel(id)` | `function` | Add a panel with the given ID |
| `removePanel(id)` | `function` | Remove a panel by ID |
| `getRectProps(rect)` | `function` | Get style and event handlers for a rectangle |
| `getDropIndicatorProps(rect)` | `function` | Get drop indicator style (returns `null` if not applicable) |
| `getDragHandleProps(rect)` | `function` | Get props for drag handle element |

## Types

```ts
// Layout tree nodes
type LayoutNode = PanelNode | SplitNode;

interface PanelNode {
  type: "panel";
  id: string;
  minSize?: { width?: number; height?: number };
}

interface SplitNode {
  type: "split";
  id: string;
  left: LayoutNode;   // or top for vertical
  right: LayoutNode;  // or bottom for vertical
  orientation: "horizontal" | "vertical";
  ratio: number;      // 0-1, where 0.5 is equal split
}

// Rectangles for rendering
type LayoutRect = PanelLayoutRect | SplitLayoutRect;

interface PanelLayoutRect {
  type: "panel";
  id: string;
  x: number; y: number; width: number; height: number;
}

interface SplitLayoutRect {
  type: "split";
  id: string;
  orientation: "horizontal" | "vertical";
  x: number; y: number; width: number; height: number;
}
```

## Custom Placement Strategy

Control where new panels are placed:

```tsx
import { useDockLayout, type PlacementStrategy, type LayoutNode } from 'react-headless-dock-layout';

const bottomStrategy: PlacementStrategy = {
  getPlacementOnAdd(root: LayoutNode) {
    return {
      targetId: root.id,
      direction: "bottom",  // "top" | "bottom" | "left" | "right"
      ratio: 0.5,
    };
  },
};

const { addPanel } = useDockLayout(null, { placementStrategy: bottomStrategy });
```

## Persisting Layout

```tsx
const { root, ...rest } = useDockLayout(() => {
  const saved = localStorage.getItem("layout");
  return saved ? JSON.parse(saved) : null;
});

// Save on change
useEffect(() => {
  if (root) localStorage.setItem("layout", JSON.stringify(root));
}, [root]);
```

## License

MIT
