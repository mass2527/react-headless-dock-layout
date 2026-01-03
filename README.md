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
    getDropZoneProps,
    getDragHandleProps,
  } = useDockLayout<HTMLDivElement>(null);

  return (
    <div>
      <button type="button" onClick={() => addPanel({ id: "explorer" })}>
        Add Explorer Panel
      </button>
      <button type="button" onClick={() => addPanel({ id: "terminal" })}>
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
            const dropZoneProps = getDropZoneProps(rect);

            return (
              <div
                key={rect.id}
                style={{
                  ...style,
                  opacity: draggingRect?.id === rect.id ? 0.5 : 1,
                }}
                {...props}
              >
                {dropZoneProps && (
                  <div
                    style={{
                      ...dropZoneProps.style,
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
