---
id: TASK-011
title: Implement face particle distribution with tight clustering
status: To Do
assignee: []
created_date: '2026-01-23 07:50'
updated_date: '2026-01-23 08:04'
labels:
  - particles
  - face
dependencies:
  - TASK-009
  - TASK-006
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Configure particle distribution for face with very tight 1-2px clustering for dense mesh effect. Face uses pink/magenta palette (#EC4899). Boost depth on nose (forward), cheekbones (forward), and eye sockets (recessed). 4,000-6,000 particles for recognizable facial structure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Face particles clustered at 1-2px spread
- [ ] #2 Nose particles pushed forward with depth boost
- [ ] #3 Cheekbone particles show prominence
- [ ] #4 Eye socket particles recessed for depth
- [ ] #5 Dense mesh effect creates recognizable face shape
- [ ] #6 468 landmarks properly weighted for distribution
- [ ] #7 Face colored pink/magenta (#EC4899)
- [ ] #8 Ultra-tight 1-2px clustering across all 468 landmarks
- [ ] #9 Nose landmarks pushed forward with depth boost
- [ ] #10 Cheekbone landmarks show prominence
- [ ] #11 Eye socket landmarks recessed for depth
- [ ] #12 4,000-6,000 particles for dense face mesh
- [ ] #13 Creates recognizable facial features (eyes, nose, lips visible)
<!-- AC:END -->
