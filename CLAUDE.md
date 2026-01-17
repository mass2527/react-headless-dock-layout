# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm test              # Run tests (vitest, watch mode by default)
pnpm test run          # Run tests once
pnpm test run src/internal/LayoutManager/LayoutTree.test.ts  # Run single test file
pnpm dev               # Start Vite dev server (demo app at src/App.tsx)
pnpm build             # Build library with tsup (outputs to dist/)
pnpm type-check        # TypeScript type checking
```

Formatting and linting are handled by Biome. The project uses pnpm as package manager.

## Architecture

This is a headless React library that provides dock layout state management without any UI rendering. Users bring their own components and styles.

### Core Structure

**Public API (`src/index.ts`):**
- `useDockLayout` hook - main entry point that exposes layout state and interaction handlers
- Types: `LayoutNode`, `PanelNode`, `SplitNode`, `LayoutRect`, `LayoutManagerOptions`
- `PlacementStrategy` interface and `equalWidthRightStrategy` default

**Layout Tree Model:**
- `LayoutNode` = `PanelNode | SplitNode` (binary tree structure)
- `SplitNode` divides space with `orientation` (horizontal/vertical) and `ratio` (0-1)
- `PanelNode` represents leaf nodes with unique `id`

**Internal Components (`src/internal/`):**
- `LayoutManager` - core class managing tree operations, resize calculations, and rect computation
- `LayoutTree` - tree manipulation utilities (find, replace, traverse)
- `calculateLayoutRects` - converts tree + container size into absolute positioned rectangles
- `calculateMinSize` - computes minimum size constraints for resize limits
- `findClosestDirection` - determines drop direction based on pointer position

### Data Flow

1. `useDockLayout` creates a `LayoutManager` instance with initial tree
2. Container resize triggers `setSize()` → recalculates all layout rects
3. Operations (`addPanel`, `removePanel`, `movePanel`, `resizePanel`) mutate tree and trigger rect sync
4. `useSyncExternalStore` provides React reactivity via `LayoutManager.subscribe`
5. `layoutRects` array contains absolute positions for panels and split bars

### Key Patterns

- Use `invariant()` for validating state that should never be invalid
- Use `assertNever()` for exhaustive switch/if-else on discriminated unions
- All rect calculations flow through `calculateLayoutRects` when tree or size changes
