---
id: TASK-041
title: Verify reduced motion accessibility preference
status: To Do
assignee: []
created_date: '2026-01-23 15:34'
labels:
  - testing
  - accessibility
  - a11y
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Test that particle animations respect prefers-reduced-motion media query
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Enabling reduced motion in OS settings reduces particle movement
- [ ] #2 Particles still appear but with minimal or no animation
- [ ] #3 Theme transitions are instant (no fade/animation)
- [ ] #4 Hand tracking still works but particles don't fly around rapidly
- [ ] #5 User can still interact with all features
<!-- AC:END -->
