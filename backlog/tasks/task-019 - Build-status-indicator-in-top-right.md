---
id: TASK-019
title: Build status indicator in top right
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 07:52'
updated_date: '2026-02-09 07:21'
labels:
  - ui
  - feedback
dependencies:
  - TASK-004
  - TASK-006
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a dynamic status indicator in the top right corner showing real-time detection state: '2 hands + face detected', '1 hand + face detected', '2 hands detected', '1 hand detected', or 'Show your hands' prompt. Include green dot indicator for active detection.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Indicator positioned in top right
- [x] #2 Shows Loading... during MediaPipe init
- [x] #3 Shows detection status (hands/face count)
- [x] #4 Shows 'Show your hands' when nothing detected
- [x] #5 Smooth transitions between states
- [x] #6 Visual styling matches overall aesthetic
- [x] #7 Shows exact count: '2 hands + face detected' format
- [x] #8 Updates in real-time as detection changes
- [x] #9 Green dot indicator when actively detecting
- [x] #10 Positioned top right with glassmorphism style
- [x] #11 Shows 'Show your hands' when nothing detected for 2s
- [x] #12 Smooth text transitions without flicker
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create StatusIndicator.tsx component in src/components
2. Extract status indicator logic from page.tsx
3. Accept trackingResult, isLoading, error as props
4. Add 2s delay before showing "Show your hands" message
5. Add smooth transitions for text changes
6. Green dot for active detection, yellow for partial, gray for none
7. Export from components index
8. Replace inline status indicator in page.tsx
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created StatusIndicator.tsx component with:
- Top-right positioning with glassmorphism styling
- Detection state tracking (loading, detecting, partial, none)
- Green dot for full detection (2 hands or hand+face)
- Yellow dot for partial detection (1 hand only)
- Gray when nothing detected
- 2-second delay before showing "Show your hands" prompt
- Smooth CSS transitions for colors
- Exported from components index
- Replaced inline status indicator in page.tsx
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Built StatusIndicator component for real-time detection feedback.

Changes:
- Created src/components/StatusIndicator.tsx
- Top-right positioning with glassmorphism (backdrop-blur, semi-transparent bg)
- Shows detection status: "Loading...", "X hands + face detected", "Show your hands"
- Color-coded indicator dot:
  - Green (#22C55E): Active detection (2 hands, or any hands+face)
  - Yellow (#EAB308): Partial detection (1 hand only, no face)
  - Gray (#71717A): No detection or loading
- 2-second delay before showing "Show your hands" prompt
- Smooth transitions (300ms) for text and color changes
- Uses useMemo for computed values, avoids unnecessary re-renders
- Exported from components/index.ts
- Replaced inline status indicator in page.tsx with component
- Removed unused getStatusText function and isDetecting variable from page.tsx

Accessibility: role="status" with aria-live="polite" for screen readers.
Zero TypeScript errors.
<!-- SECTION:FINAL_SUMMARY:END -->
