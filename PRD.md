# Product Requirements Document (PRD)

## react-headless-dock-layout

**Version:** 0.5.1
**Type:** Open Source React Library
**License:** MIT

---

## 1. Executive Summary

**react-headless-dock-layout** is a lightweight, headless dock layout library for React that provides complete layout state management without imposing any UI rendering decisions. The library enables developers to build custom IDE-like panel interfaces with full styling control while handling the complex logic of panel arrangement, resizing, and drag-and-drop operations.

### Value Proposition

- **Full UI Control**: Headless architecture means developers bring their own components and styles
- **Minimal Bundle Size**: ~10KB minified due to zero UI components
- **Serializable State**: Layout tree can be persisted and restored via JSON
- **Modern React**: Built on React 18+ patterns with `useSyncExternalStore`

---

## 2. Target Users

| User Type | Use Case |
|-----------|----------|
| React Developers | Building custom dock layouts for web applications |
| IDE/Tool Builders | Creating code editors, design tools, or admin dashboards |
| Teams Seeking Flexibility | Projects requiring non-opinionated layout solutions |
| Lightweight-First Projects | Applications where bundle size matters |

---

## 3. Core Features

### 3.1 Panel Management

| Feature | Description |
|---------|-------------|
| Add Panel | Insert new panels into the layout with configurable placement |
| Remove Panel | Delete panels with automatic tree restructuring |
| Move Panel | Drag-and-drop panels between positions |
| Unique Identification | Each panel has a unique string ID |

### 3.2 Resizable Split Bars

| Feature | Description |
|---------|-------------|
| Drag-to-Resize | Split bars can be dragged to resize adjacent panels |
| Minimum Size Constraints | Per-panel minimum width/height enforcement |
| Ratio-Based Sizing | Panels maintain relative proportions on container resize |
| Horizontal & Vertical | Supports both split orientations |

### 3.3 Drag-and-Drop

| Feature | Description |
|---------|-------------|
| Drag Handle Support | Dedicated drag handle areas for panel movement |
| Drop Indicators | Visual feedback showing valid drop zones |
| Direction Detection | Automatic detection of drop direction (top/bottom/left/right) |
| Tree Restructuring | Automatic layout reorganization on drop |

### 3.4 Layout Persistence

| Feature | Description |
|---------|-------------|
| Serializable Tree | Layout state is a plain JS object, JSON-serializable |
| Save/Restore | Easy persistence to localStorage or backend |
| Initial State | Support for lazy initialization via function |

### 3.5 Customizable Placement Strategy

| Feature | Description |
|---------|-------------|
| Pluggable Strategy | Interface for custom panel placement logic |
| Built-in Default | `equalWidthRightStrategy` maintains equal widths |
| Extensible | Custom strategies without modifying core library |

---

## 4. Technical Architecture

### 4.1 Layout Model

The layout is represented as a **binary tree** where:

- **PanelNode** (Leaf): Represents a visible panel with unique ID
- **SplitNode** (Internal): Divides space between two children with orientation and ratio

```
           SplitNode (horizontal, 0.5)
              /                \
      PanelNode "A"      SplitNode (vertical, 0.6)
                              /           \
                      PanelNode "B"   PanelNode "C"
```

### 4.2 Node Types

**PanelNode:**
```typescript
{
  type: "panel"
  id: string
  minSize?: { width?: number; height?: number }
}
```

**SplitNode:**
```typescript
{
  type: "split"
  id: string
  left: LayoutNode
  right: LayoutNode
  orientation: "horizontal" | "vertical"
  ratio: number  // 0-1, space allocation for left/top child
}
```

### 4.3 Coordinate System

- **Absolute Positioning**: All panels use `position: absolute`
- **Pixel-Based Rects**: Each panel receives `{x, y, width, height}` in pixels
- **Gap/Split Bar**: Configurable pixel width between panels (default: 10px)

### 4.4 Data Flow

```
User Interaction
       ↓
LayoutManager Method
       ↓
Tree Mutation + Rect Calculation
       ↓
useSyncExternalStore Subscription
       ↓
React Re-render
       ↓
Components Position via layoutRects
```

---

## 5. Public API

### 5.1 Main Hook: `useDockLayout<T>`

**Signature:**
```typescript
function useDockLayout<T extends HTMLElement>(
  initialRoot: LayoutNode | null | (() => LayoutNode | null),
  options?: LayoutManagerOptions
): UseDockLayoutReturn<T>
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `containerRef` | `RefCallback<T>` | Attach to container element |
| `layoutRects` | `LayoutRect[]` | Panel and split bar positions |
| `draggingRect` | `PanelLayoutRect \| null` | Currently dragged panel |
| `root` | `LayoutNode \| null` | Current layout tree (for persistence) |
| `getRectProps` | `Function` | Props generator for rect elements |
| `getDropIndicatorProps` | `Function` | Props generator for drop indicators |
| `getDragHandleProps` | `Function` | Props generator for drag handles |
| `addPanel` | `(id: string) => void` | Add new panel |
| `removePanel` | `(id: string) => void` | Remove panel |

### 5.2 Options

```typescript
interface LayoutManagerOptions {
  gap?: number                        // Split bar size (default: 10)
  placementStrategy?: PlacementStrategy  // Panel placement logic
}
```

### 5.3 Placement Strategy Interface

```typescript
interface PlacementStrategy {
  getPlacementOnAdd(root: LayoutNode): {
    targetId: string
    direction: "top" | "bottom" | "left" | "right"
    ratio?: number
  }
}
```

### 5.4 Type Exports

| Type | Description |
|------|-------------|
| `LayoutNode` | Union of `PanelNode \| SplitNode` |
| `PanelNode` | Leaf node representing a panel |
| `SplitNode` | Internal node representing a split |
| `LayoutRect` | Union of `PanelLayoutRect \| SplitLayoutRect` |
| `LayoutManagerOptions` | Hook configuration options |
| `PlacementStrategy` | Interface for placement strategies |

---

## 6. Interaction Specifications

### 6.1 Resize Interaction

1. User presses pointer on split bar
2. System captures pointer via `setPointerCapture`
3. User drags to desired position
4. System calculates new ratio based on pointer position
5. System enforces minimum size constraints
6. System clamps ratio to [0.1, 0.9] range
7. User releases pointer
8. Layout updates with new proportions

### 6.2 Drag-and-Drop Interaction

1. User presses pointer on drag handle
2. System sets `draggingRect` state
3. User moves over target panel
4. System calculates drop direction based on pointer position
5. System displays drop indicator (50% zone)
6. User releases pointer on target
7. System restructures tree:
   - Creates new split at target location
   - Moves source panel as child of new split
   - Removes orphaned nodes
8. Layout updates with new structure

### 6.3 Add Panel

1. Application calls `addPanel(id)`
2. If root is null: panel becomes root
3. Otherwise: placement strategy determines target and direction
4. System creates new split node
5. System inserts at target location
6. Layout rects recalculate

### 6.4 Remove Panel

1. Application calls `removePanel(id)`
2. If panel is root: root becomes null
3. Otherwise:
   - Find parent split
   - Replace parent with sibling in grandparent
   - Clean up orphaned nodes
4. Layout rects recalculate

---

## 7. Constraints & Boundaries

### 7.1 Size Constraints

| Constraint | Value | Configurable |
|------------|-------|--------------|
| Minimum Split Ratio | 0.1 (10%) | No |
| Maximum Split Ratio | 0.9 (90%) | No |
| Default Gap | 10px | Yes |
| Per-Panel Min Size | Custom per panel | Yes |

### 7.2 Structural Constraints

| Constraint | Description |
|------------|-------------|
| Binary Tree Only | Each split has exactly 2 children |
| No Floating Panels | All panels constrained to layout tree |
| No Tab System | Panels are monolithic, no stacking |
| Single Root | Layout has one root node or null |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Requirement | Target |
|-------------|--------|
| Bundle Size | < 15KB minified |
| Re-render Efficiency | Only affected components re-render |
| Resize Performance | 60fps during drag operations |

### 8.2 Compatibility

| Requirement | Target |
|-------------|--------|
| React Version | >= 18.0.0 |
| Browser Support | Modern browsers (ES2020+) |
| Module Formats | ESM + CommonJS |
| TypeScript | Full type definitions |

### 8.3 Accessibility

| Requirement | Status |
|-------------|--------|
| Keyboard Navigation | Not implemented |
| Screen Reader | Not implemented |
| ARIA Attributes | Not implemented |

---

## 9. Current Limitations

| Limitation | Description |
|------------|-------------|
| No Tab System | Cannot stack multiple panels in same location |
| No Floating Windows | Panels cannot break out of layout |
| No Undo/Redo | State mutations not tracked |
| No Maximize/Minimize | Panel state is binary (visible or removed) |
| No Keyboard Support | Pointer-only interactions |
| Manual Styling | Users must style all elements |
| No Built-in Animations | No transition effects provided |

---

## 10. Future Considerations

These are potential features not currently implemented:

| Feature | Description |
|---------|-------------|
| Tab Support | Stack multiple panels in single location |
| Floating Panels | Detachable windows |
| Undo/Redo | State history management |
| Keyboard Navigation | Accessibility improvement |
| Panel Locking | Prevent resize/move of specific panels |
| Layout Presets | Built-in common arrangements |
| Animation Hooks | Callbacks for transition effects |

---

## 11. Dependencies

### 11.1 Runtime Dependencies

| Dependency | Version | Reason |
|------------|---------|--------|
| React | >= 18.0.0 | Peer dependency (hooks, useSyncExternalStore) |

### 11.2 Development Dependencies

| Dependency | Purpose |
|------------|---------|
| TypeScript | Type safety |
| Vite | Development server |
| Vitest | Testing framework |
| Biome | Formatting & linting |
| tsup | Build tool |

---

## 12. Project Structure

```
src/
├── index.ts                    # Public API exports
├── types.ts                    # LayoutNode, PanelNode, SplitNode
├── strategies.ts               # PlacementStrategy + equalWidthRightStrategy
├── useDockLayout.ts            # Main hook implementation
└── internal/
    ├── LayoutManager/
    │   ├── LayoutManager.ts    # Core state manager
    │   ├── LayoutTree.ts       # Tree data structure
    │   ├── calculateLayoutRects.ts
    │   ├── calculateMinSize.ts
    │   └── findClosestDirection.ts
    ├── useResizeObserver.ts    # Container size observer
    ├── useCursor.ts            # Cursor management
    ├── findParentNode.ts       # Tree traversal utility
    ├── generateId.ts           # ID generation
    ├── invariant.ts            # Assertions
    ├── assertNever.ts          # Type exhaustion
    ├── clamp.ts                # Number clamping
    └── useStableCallback.ts    # Memoized callback
```

---

## 13. Usage Example

```tsx
import { useDockLayout } from 'react-headless-dock-layout';

function App() {
  const {
    containerRef,
    layoutRects,
    getRectProps,
    getDragHandleProps,
    getDropIndicatorProps,
    draggingRect,
    addPanel,
    removePanel,
  } = useDockLayout(null);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100vh' }}
    >
      {layoutRects.map((rect) => {
        if (rect.type === 'panel') {
          const dropIndicatorProps = draggingRect
            ? getDropIndicatorProps(rect)
            : null;

          return (
            <div key={rect.id} {...getRectProps(rect)}>
              <div {...getDragHandleProps(rect)}>Drag Handle</div>
              <button onClick={() => removePanel(rect.id)}>Close</button>
              {dropIndicatorProps && <div {...dropIndicatorProps} />}
            </div>
          );
        }

        // Split bar
        return <div key={rect.id} {...getRectProps(rect)} />;
      })}

      <button onClick={() => addPanel(`panel-${Date.now()}`)}>
        Add Panel
      </button>
    </div>
  );
}
```

---

## 14. Competitive Positioning

| Library | Approach | Bundle Size | Headless |
|---------|----------|-------------|----------|
| **react-headless-dock-layout** | Headless, minimal | ~10KB | Yes |
| react-grid-layout | Full UI | ~50KB | No |
| dockview | Full UI | ~100KB+ | No |
| react-mosaic | Full UI | ~30KB | No |

**Differentiator**: Full styling control with minimal footprint for teams who want to own their UI implementation.

---

## 15. Success Metrics

| Metric | Target |
|--------|--------|
| Bundle Size | < 15KB minified |
| Test Coverage | > 80% of core logic |
| TypeScript | 100% type coverage |
| Documentation | Complete API reference |
| Examples | Working demo application |

---

*Document Version: 1.0*
*Based on: react-headless-dock-layout v0.5.1*
