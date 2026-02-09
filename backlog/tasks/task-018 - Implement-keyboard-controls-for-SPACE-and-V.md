---
id: TASK-018
title: Implement keyboard controls for SPACE and V
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:16'
labels:
  - interaction
  - controls
dependencies:
  - TASK-015
  - TASK-003
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add keyboard event handlers for SPACE key to toggle particle mode and V key to toggle camera preview visibility. Ensure controls work globally and don't conflict with other interactions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SPACE key toggles between Attract and Repel
- [x] #2 V key shows/hides camera preview
- [x] #3 Keys work regardless of focus state
- [x] #4 No conflicts with text input fields
- [x] #5 Key events properly cleaned up on unmount
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create useKeyboardControls hook in src/lib
2. Add window-level keydown event listener with useEffect
3. SPACE key toggles physics mode (attract/repel)
4. V key cycles theme using cycleTheme from themes.ts
5. Prevent default on SPACE to avoid page scroll
6. Skip events when in text input fields
7. Clean up listener on unmount
8. Integrate hook in page.tsx CanvasView
<!-- SECTION:PLAN:END -->
