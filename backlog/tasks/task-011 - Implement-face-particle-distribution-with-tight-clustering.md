---
id: TASK-011
title: Implement face particle distribution with tight clustering
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:50'
updated_date: '2026-02-09 06:05'
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
- [x] #1 Face particles clustered at 1-2px spread
- [x] #2 Nose particles pushed forward with depth boost
- [x] #3 Cheekbone particles show prominence
- [x] #4 Eye socket particles recessed for depth
- [x] #5 Dense mesh effect creates recognizable face shape
- [x] #6 468 landmarks properly weighted for distribution
- [x] #7 Face colored pink/magenta (#EC4899)
- [x] #8 Ultra-tight 1-2px clustering across all 468 landmarks
- [x] #9 Nose landmarks pushed forward with depth boost
- [x] #10 Cheekbone landmarks show prominence
- [x] #11 Eye socket landmarks recessed for depth
- [x] #12 4,000-6,000 particles for dense face mesh
- [x] #13 Creates recognizable facial features (eyes, nose, lips visible)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create FaceDistribution.ts with face landmark categories (nose, cheekbones, eyes, lips, contour)
2. Implement depth boost for nose (+Z), cheekbones (+Z slight), eye sockets (-Z recessed)
3. Configure 1-2px tight clustering for all landmarks
4. Allocate ~12 particles per landmark (468 × 12 ≈ 5,616 total)
5. Export from particles/index.ts
6. Integrate with ParticlePool.updateFaceTargets to use new distribution
7. Verify TypeScript compiles cleanly
<!-- SECTION:PLAN:END -->
