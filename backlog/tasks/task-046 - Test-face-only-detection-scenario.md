---
id: TASK-046
title: Test face-only detection scenario
status: To Do
assignee: []
created_date: '2026-01-23 15:35'
labels:
  - testing
  - edge-cases
  - detection
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verify system behavior when only face is detected without hands
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Status indicator shows 'Show hands �' when face detected but no hands
- [ ] #2 Particles cluster on face landmarks with tight distribution
- [ ] #3 Face mesh overlay renders in camera preview
- [ ] #4 Mode switching still affects face particles
- [ ] #5 App doesn't show errors or warnings about missing hands
<!-- AC:END -->
