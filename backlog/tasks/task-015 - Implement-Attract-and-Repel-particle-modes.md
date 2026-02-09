---
id: TASK-015
title: Implement Attract and Repel particle modes
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:06'
labels:
  - particles
  - interaction
dependencies:
  - TASK-009
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add two particle behavior modes: Attract mode where particles flow toward detected landmarks, and Repel mode where particles push away from landmarks. Allow toggling between modes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Attract mode pulls particles toward landmarks
- [ ] #2 Repel mode pushes particles away from landmarks
- [ ] #3 Mode togglable via UI or keyboard
- [ ] #4 Smooth transition when switching modes
- [ ] #5 Repel creates interesting negative space effect
- [ ] #6 Current mode clearly indicated to user
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review existing PhysicsMode implementation in ParticlePhysics.ts
2. Enhance repel mode with repulsion radius and distance capping
3. Add smooth boundary behavior so particles orbit at repulsion distance
4. Verify mode state is accessible from React components via exports
5. Test smooth transitions when toggling modes
6. Verify TypeScript compilation passes
<!-- SECTION:PLAN:END -->
