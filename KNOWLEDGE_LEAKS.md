# Knowledge Leaks Analysis

> **Knowledge leak** (a.k.a. "information leakage" in *A Philosophy of Software Design*):
> A design decision that is spread across multiple modules, so that changing it
> requires coordinated edits in several places.

---

## 1. Gap Arithmetic — `gap / 2` Formula Spread Across 3 Modules

The decision of **how gap space is distributed between two children** (each child
shrinks by `gap / 2`, the split bar occupies `gap`) is encoded independently in
three separate files:

| File | Lines | What it calculates |
|---|---|---|
| `calculateLayoutRects.ts` | 22, 31–32, 35–37, 46, 55–56, 59–61 | Child rect positions and sizes using `gap / 2` |
| `LayoutManager.ts` (`calculateResizeRatio`) | 409, 415, 422, 436, 438, 449 | Min/max ratio constraints using `gap / 2` |
| `calculateMinSize.ts` | 17, 23 | Accumulated minimum size using `+ gap` |

**Why it's a leak:** If you changed how gap space is allocated (e.g., asymmetric
gaps, or gap only on one side), you'd need to update all three files in lockstep.
The gap-distribution formula is a single design decision that should live in one
place.

---

## 2. Orientation-Axis Mapping — Duplicated Horizontal/Vertical Branching

The knowledge that **"horizontal" means split along the x-axis (width/left/right)
and "vertical" means split along the y-axis (height/top/bottom)** is re-derived
via if/else branches in four places:

| File | Function | What it does |
|---|---|---|
| `calculateLayoutRects.ts:17–65` | `traverse` | Splits rect space by width or height |
| `calculateMinSize.ts:15–27` | `calculateMinSize` | Sums width or height for min size |
| `LayoutManager.ts:372–391` | `getSurroundingRect` | Computes bounding rect by width or height |
| `LayoutManager.ts:399–454` | `calculateResizeRatio` | Clamps ratio using width or height |

Each location independently maps `orientation → (primary axis, primary dimension,
secondary dimension)`. The bodies of these branches are structurally identical
except that `width`↔`height` and `x`↔`y` are swapped.

**Why it's a leak:** Adding a new layout behavior that depends on orientation
(e.g., minimum gap per axis, or animation direction) requires adding yet another
duplicated horizontal/vertical branch. A single helper that maps orientation to
axis properties would centralize this knowledge.

---

## 3. Direction-to-Orientation Mapping — Encoded in Two Separate Modules

The mapping from **direction (`top`/`bottom`/`left`/`right`) to orientation
(`horizontal`/`vertical`) and ordering** appears in two different forms:

| File | Location | Encoding |
|---|---|---|
| `LayoutManager.ts:20–34` | `directionToSplitConfig()` | Maps direction → `{ orientation, isSourceFirst }` |
| `useDockLayout.ts:291–327` | `getDropIndicatorStyle()` | Maps direction → CSS positioning (`left`/`top`/`width`/`height`) |

Both functions encode the same knowledge: which directions correspond to which
axis, and which side is "first" vs "second". They just output it in different
formats (tree structure config vs CSS styles).

**Why it's a leak:** If you added a new direction (e.g., "center" for tab
stacking) or changed the direction semantics, both functions would need
synchronized updates.

---

## 4. Drop Indicator 50% ↔ Default Split Ratio 0.5

The visual indicator and the actual split logic independently encode that **a
drop splits the target in half**:

| File | Location | Value |
|---|---|---|
| `useDockLayout.ts:294–323` | `getDropIndicatorStyle()` | Hardcoded `"50%"` CSS values |
| `LayoutManager.ts:331` | `createSplitNode()` | Default `ratio = 0.5` |

**Why it's a leak:** If you wanted drops to preview a 30/70 split instead of
50/50, you'd need to change the CSS percentages in the hook *and* the default
ratio in the LayoutManager. The visual preview and the actual behavior should
derive from the same source of truth.

---

## 5. `left`/`right` Naming for Generic First/Second Children

`SplitNode` uses `left` and `right` properties (`types.ts:43–44`), but for
**vertical** splits these actually mean **top** and **bottom**. This naming
mismatch forces every consumer to mentally re-map:

| File | Location | What happens |
|---|---|---|
| `LayoutManager.ts:426–427` | `calculateResizeRatio` | Renames to `topRect`/`bottomRect` for vertical case |
| `calculateLayoutRects.ts:51–62` | `traverse` | Uses `node.left` to mean "top child" in vertical splits |
| `calculateMinSize.ts:12–13` | `calculateMinSize` | Uses `leftSize`/`rightSize` even for vertical splits |

**Why it's a leak:** The `left`/`right` naming leaks the horizontal orientation's
mental model into every module. Each consumer must independently know that `left`
means "first child" and contextually translate it. If the properties were named
`first`/`second` (or `primary`/`secondary`), the orientation-specific meaning
would be confined to rendering code only.

---

## 6. Tree Structure Knowledge in Every Module

The discriminated union pattern (`node.type === "panel"` / `node.type === "split"`)
plus knowledge of `SplitNode`'s internal structure (`left`, `right`, `orientation`,
`ratio`) is spread across **every module** in the codebase:

- `LayoutTree.ts` — tree traversal
- `calculateLayoutRects.ts` — layout computation
- `calculateMinSize.ts` — constraint computation
- `LayoutManager.ts` — state mutations
- `strategies.ts` — placement logic
- `findParentNode.ts` — parent lookup

**Why it's a leak:** Adding a new node type (e.g., `TabGroupNode`) or changing
the tree structure (e.g., n-ary splits instead of binary) would require
modifications to every one of these files. The tree's internal shape is not
encapsulated — it's the most widely-leaked knowledge in the codebase.

---

## Summary

| # | Knowledge | Modules affected | Severity |
|---|---|---|---|
| 1 | Gap distribution formula | 3 files | High |
| 2 | Orientation → axis mapping | 4 locations | High |
| 3 | Direction → orientation mapping | 2 modules | Medium |
| 4 | Drop preview = split ratio | 2 locations | Low |
| 5 | `left`/`right` = first/second | Every consumer | Medium |
| 6 | Tree node structure | 6+ files | High (but typical for discriminated unions) |

Leaks #1 and #2 are the most actionable — they could be addressed by extracting
an orientation-aware axis helper and centralizing gap arithmetic into a single
layout-geometry module. Leak #6 is inherent to the discriminated-union approach
and would only matter if the tree structure is expected to evolve.
