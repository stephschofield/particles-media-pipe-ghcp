---
id: TASK-019
title: Build status indicator in top right
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:52'
updated_date: '2026-02-09 07:17'
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
- [ ] #1 Indicator positioned in top right
- [ ] #2 Shows Loading... during MediaPipe init
- [ ] #3 Shows detection status (hands/face count)
- [ ] #4 Shows 'Show your hands' when nothing detected
- [ ] #5 Smooth transitions between states
- [ ] #6 Visual styling matches overall aesthetic
- [ ] #7 Shows exact count: '2 hands + face detected' format
- [ ] #8 Updates in real-time as detection changes
- [ ] #9 Green dot indicator when actively detecting
- [ ] #10 Positioned top right with glassmorphism style
- [ ] #11 Shows 'Show your hands' when nothing detected for 2s
- [ ] #12 Smooth text transitions without flicker
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
