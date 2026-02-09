---
id: TASK-013
title: Implement fist gesture detection for theme cycling
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 06:58'
labels:
  - gestures
  - interaction
dependencies:
  - TASK-004
  - TASK-012
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Detect when user makes a fist gesture using hand landmark positions. When fist is detected and released, cycle to the next color theme. Ensure reliable detection without false positives.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fist gesture detected by finger curl analysis
- [x] #2 Theme cycles on fist release, not on fist make
- [x] #3 Debounce prevents rapid cycling
- [x] #4 Works with either hand
- [x] #5 Visual feedback when fist detected
- [x] #6 No false positives during normal hand movement
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/lib/gestures.ts - Pure fist detection functions
2. Create src/lib/useGestureDetection.ts - React hook with debouncing
3. Integrate hook into CanvasView in page.tsx
4. Add visual feedback for theme change
5. Test with both hands
6. Verify no false positives
<!-- SECTION:PLAN:END -->
