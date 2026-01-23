---
id: TASK-044
title: Verify depth-based particle scaling with close/far hand movement
status: To Do
assignee: []
created_date: '2026-01-23 15:35'
labels:
  - testing
  - depth
  - particles
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Test that particles scale appropriately based on hand depth (Z-position): 1.8× when close, 0.5× when far
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Moving hand closer to camera makes particles visibly larger
- [ ] #2 Moving hand away from camera makes particles smaller
- [ ] #3 Scaling transition is smooth (not jumpy)
- [ ] #4 Scale factor appears to range from approximately 0.5× to 1.8×
- [ ] #5 Scaling applies to both hands and face particles
<!-- AC:END -->
