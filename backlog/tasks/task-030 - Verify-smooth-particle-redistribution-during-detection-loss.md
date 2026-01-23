---
id: TASK-030
title: Verify smooth particle redistribution during detection loss
status: To Do
assignee: []
created_date: '2026-01-23 15:33'
labels:
  - testing
  - transitions
  - particles
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Test that particles transition gracefully when hands or face are lost from tracking
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Particles fade out smoothly over 0.5-1 second when hand leaves frame
- [ ] #2 No abrupt disappearance or teleportation of particles
- [ ] #3 Remaining particles (e.g., on face) stay stable during hand loss
- [ ] #4 Particles reappear smoothly when hand re-enters frame
- [ ] #5 No performance stutter during transition
<!-- AC:END -->
