---
id: TASK-034
title: Test theme cycling with fist gesture detection
status: To Do
assignee: []
created_date: '2026-01-23 15:33'
labels:
  - testing
  - gestures
  - themes
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verify that making a fist gesture cycles through all 5 color themes in order
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fist gesture (closed hand) is reliably detected within 0.5 seconds
- [ ] #2 Theme cycles to next theme (1→2→3→4→5→1) on each fist
- [ ] #3 Theme change is visually obvious (particle colors change)
- [ ] #4 Gesture detection doesn't trigger accidentally during normal hand poses
- [ ] #5 All 5 themes are visually distinct from each other
<!-- AC:END -->
