---
id: TASK-003
title: Implement camera preview overlay component
status: To Do
assignee: []
created_date: '2026-01-23 07:49'
updated_date: '2026-01-23 07:52'
labels:
  - ui
  - camera
dependencies:
  - TASK-002
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a 256x144 camera preview box positioned at top center of the screen, displaying the mirrored camera feed. This serves as the base for skeleton and mesh overlays.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Camera preview positioned at top center
- [ ] #2 Fixed size of 256x144 pixels
- [ ] #3 Camera feed is mirrored horizontally
- [ ] #4 Preview has subtle border and rounded corners
- [ ] #5 Video stream properly managed with cleanup on unmount
<!-- AC:END -->
