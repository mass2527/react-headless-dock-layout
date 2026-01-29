# Accessibility Improvement Plan

This document outlines the plan to improve accessibility (a11y) in react-headless-dock-layout.

## Current State

The library currently has **no accessibility features**:
- Only pointer-based interactions (no keyboard support)
- No ARIA attributes or roles
- No focus management
- No screen reader announcements
- No semantic HTML guidance

## Goals

Achieve WCAG 2.1 Level AA compliance by providing accessible building blocks that consumers can use to build fully accessible dock layouts.

---

## Phase 1: Keyboard Support for Split Bars (High Priority)

Split bars are the primary interactive elements that currently only support pointer input.

### Tasks

1. **Add keyboard event handlers to `getRectProps()` for split bars**
   - File: `src/useDockLayout.ts` (lines 122-163)
   - Add `onKeyDown` handler for Arrow key navigation
   - Left/Right arrows for horizontal splits, Up/Down for vertical
   - Support Shift+Arrow for larger increments (e.g., 10% vs 1%)
   - Add `tabIndex={0}` to make split bars focusable

2. **Add keyboard resize method to LayoutManager**
   - File: `src/internal/LayoutManager/LayoutManager.ts`
   - Add `resizePanelByDelta(id: string, delta: number)` method
   - Works with ratio increments instead of pointer positions

3. **Expose ARIA props for split bars**
   - Return `role="separator"`
   - Return `aria-orientation` based on split orientation
   - Return `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for ratio
   - Return `aria-label` template (e.g., "Resize between Panel A and Panel B")

### Acceptance Criteria
- [ ] Split bars are focusable with Tab key
- [ ] Arrow keys resize the split (respecting orientation)
- [ ] Shift+Arrow provides coarse adjustment
- [ ] Screen readers announce separator role and current value

---

## Phase 2: Keyboard Support for Panel Drag/Drop (High Priority)

Panel repositioning currently requires pointer-based drag and drop.

### Tasks

1. **Add keyboard-activated move mode**
   - File: `src/useDockLayout.ts` (lines 82-121, 166-214)
   - Add state for keyboard move mode: `movingPanelId`
   - Enter/Space on drag handle activates move mode
   - Arrow keys cycle through drop targets
   - Enter confirms drop, Escape cancels

2. **Expose available drop targets**
   - File: `src/internal/LayoutManager/LayoutManager.ts`
   - Add method `getAvailableDropTargets(sourceId: string)`
   - Returns array of `{targetId, direction}` options

3. **Add `getKeyboardDragHandleProps()` function**
   - Returns keyboard event handlers for move mode
   - Returns `aria-pressed` or `aria-expanded` for move state
   - Returns `aria-describedby` pointing to instructions

4. **Create focus management utilities**
   - Focus should move to panel after it's dropped
   - Announce successful moves to screen readers

### Acceptance Criteria
- [ ] Drag handle can be activated with Enter/Space
- [ ] Arrow keys navigate between drop positions
- [ ] Enter confirms, Escape cancels
- [ ] Focus moves appropriately after operations
- [ ] Screen readers announce current drop target

---

## Phase 3: Live Regions for Announcements (Medium Priority)

Provide screen reader announcements for layout operations.

### Tasks

1. **Add announcement system to useDockLayout**
   - New state: `announcement: string | null`
   - Expose `announcementProps` for aria-live region
   - Auto-clear announcements after delay

2. **Announce layout operations**
   - Panel added: "Panel [name] added to layout"
   - Panel removed: "Panel [name] removed from layout"
   - Panel moved: "Panel [name] moved to [direction] of Panel [target]"
   - Resize: "Resized to [ratio]%"

3. **Announce drag/drop feedback**
   - Drag started: "Dragging Panel [name]. Use arrow keys to select drop position."
   - Drop target changed: "Drop [direction] of Panel [target]"
   - Drop completed: "Panel [name] dropped [direction] of Panel [target]"
   - Cancelled: "Move cancelled"

### Acceptance Criteria
- [ ] All operations announced to screen readers
- [ ] Announcements are concise and helpful
- [ ] aria-live region provided in return value

---

## Phase 4: ARIA Props and Semantic Guidance (Medium Priority)

Provide ARIA attributes that consumers can spread onto their elements.

### Tasks

1. **Enhance `getRectProps()` return value**
   - For panels: suggest `role="region"` with `aria-label`
   - For split bars: include full separator semantics
   - Include `aria-controls` linking split bars to adjacent panels

2. **Add `getPanelA11yProps(id)` helper**
   - Returns recommended ARIA attributes for a panel
   - `role="region"`
   - `aria-label` based on panel ID or custom label
   - `tabIndex` for focus management

3. **Add `getDropIndicatorA11yProps()` helper**
   - Returns ARIA attributes for drop indicator overlay
   - `aria-hidden="true"` (visual-only feedback)
   - Or `role="status"` with text for AT

4. **Type exports for accessibility**
   - Export `A11yPanelProps`, `A11ySplitBarProps` types
   - Document expected usage patterns

### Acceptance Criteria
- [ ] All interactive elements have appropriate roles
- [ ] Labels describe element purpose
- [ ] Relationships between elements are expressed

---

## Phase 5: Focus Management (Medium Priority)

Ensure focus is managed correctly during layout operations.

### Tasks

1. **Track focus across operations**
   - File: `src/useDockLayout.ts`
   - Add optional `focusedPanelId` state
   - Expose `setFocusedPanel(id)` method

2. **Focus newly added panels**
   - After `addPanel()`, set focus to new panel
   - Provide ref callback or ID for focus target

3. **Handle focus when panels are removed**
   - When focused panel is removed, move focus to nearest sibling
   - Use tree traversal to find appropriate target

4. **Maintain focus during resize**
   - Keep focus on split bar during keyboard resize
   - Return focus to previous element after resize completes

### Acceptance Criteria
- [ ] Adding a panel focuses it
- [ ] Removing a panel moves focus appropriately
- [ ] Focus is never lost or trapped

---

## Phase 6: Documentation and Examples (Low Priority)

Document accessibility features and provide examples.

### Tasks

1. **Update README with accessibility section**
   - Document keyboard shortcuts
   - Explain ARIA props usage
   - List screen reader compatibility

2. **Add accessible demo implementation**
   - Update `src/App.tsx` with full a11y implementation
   - Show proper ARIA usage patterns
   - Include visible focus indicators

3. **Update CLAUDE.md**
   - Add a11y testing commands
   - Document accessibility architecture decisions

4. **Create accessibility testing guide**
   - Manual testing checklist
   - Recommended screen reader combinations
   - Automated testing suggestions (axe-core)

### Acceptance Criteria
- [ ] README documents all keyboard interactions
- [ ] Demo app is fully accessible
- [ ] Testing guidance is provided

---

## Implementation Order

```
Phase 1 ──────────────────────────────► (Split bar keyboard support)
    │
    └──► Phase 2 ─────────────────────► (Panel drag/drop keyboard)
              │
              ├──► Phase 3 ───────────► (Announcements)
              │
              └──► Phase 4 ───────────► (ARIA props)
                       │
                       └──► Phase 5 ──► (Focus management)
                                │
                                └──► Phase 6 (Documentation)
```

Phases 1 and 2 are foundational. Phases 3-5 can be worked in parallel after Phase 2.

---

## API Changes Summary

### New/Modified Exports from `useDockLayout`

```typescript
interface UseDockLayoutReturn {
  // Existing
  layoutRects: LayoutRect[];
  addPanel: (id: string) => void;
  removePanel: (id: string) => void;
  getRectProps: (rect: LayoutRect) => RectProps;
  getDragHandleProps: (rect: LayoutRect) => DragHandleProps;
  dropIndicatorProps: DropIndicatorProps | null;

  // New in Phase 1
  // getRectProps enhanced with keyboard handlers and ARIA for split bars

  // New in Phase 2
  movingPanelId: string | null;
  startKeyboardMove: (panelId: string) => void;
  cancelKeyboardMove: () => void;
  currentDropTarget: DropTarget | null;
  cycleDropTarget: (direction: 'next' | 'prev') => void;
  confirmDrop: () => void;

  // New in Phase 3
  announcement: string | null;
  getAnnouncementProps: () => AnnouncementProps;

  // New in Phase 4
  getPanelA11yProps: (rect: LayoutRect, label?: string) => PanelA11yProps;
  getSplitBarA11yProps: (rect: LayoutRect) => SplitBarA11yProps;

  // New in Phase 5
  focusedPanelId: string | null;
  setFocusedPanel: (id: string | null) => void;
}
```

### New Types

```typescript
interface PanelA11yProps {
  role: 'region';
  'aria-label': string;
  tabIndex: number;
}

interface SplitBarA11yProps {
  role: 'separator';
  'aria-orientation': 'horizontal' | 'vertical';
  'aria-valuenow': number;
  'aria-valuemin': number;
  'aria-valuemax': number;
  'aria-label': string;
  tabIndex: number;
}

interface AnnouncementProps {
  role: 'status';
  'aria-live': 'polite';
  'aria-atomic': true;
  children: string | null;
}

interface DropTarget {
  targetId: string;
  direction: 'top' | 'bottom' | 'left' | 'right';
}
```

---

## Testing Strategy

### Manual Testing
- [ ] Navigate all interactive elements with Tab
- [ ] Operate all controls with keyboard only
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with NVDA (Windows)
- [ ] Test with high contrast mode
- [ ] Test with 200% zoom

### Automated Testing
- [ ] Add axe-core to test suite
- [ ] Test keyboard event handlers
- [ ] Test ARIA attribute generation
- [ ] Test focus management logic

---

## Success Metrics

1. **Keyboard Operability**: 100% of features accessible via keyboard
2. **Screen Reader Compatibility**: Works with VoiceOver and NVDA
3. **WCAG 2.1 AA**: Pass automated accessibility audit
4. **No Focus Traps**: Focus can always escape any component
5. **Meaningful Announcements**: All operations announced appropriately
