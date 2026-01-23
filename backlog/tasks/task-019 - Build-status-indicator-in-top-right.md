---
id: TASK-019
title: Build status indicator in top right
status: To Do
assignee: []
created_date: '2026-01-23 07:52'
updated_date: '2026-01-23 07:53'
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
Create a status indicator in the top right corner showing current state: loading state during initialization, detection status when tracking, or 'Show your hands' prompt when nothing detected.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Indicator positioned in top right
- [ ] #2 Shows Loading... during MediaPipe init
- [ ] #3 Shows detection status (hands/face count)
- [ ] #4 Shows 'Show your hands' when nothing detected
- [ ] #5 Smooth transitions between states
- [ ] #6 Visual styling matches overall aesthetic
<!-- AC:END -->
