---
id: TASK-014
title: Add particle trails with semi-transparent fade
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:00'
labels:
  - particles
  - effects
dependencies:
  - TASK-009
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement particle trails that show movement history with semi-transparent fading. Trails should create a smooth flowing effect without cluttering the visual or impacting performance.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each particle leaves a trail of previous positions
- [ ] #2 Trail opacity fades from full to transparent
- [ ] #3 Trail length configurable (5-10 positions)
- [ ] #4 Performance maintained at 60fps with trails
- [ ] #5 Trails enhance flowing liquid aesthetic
- [ ] #6 Trail rendering uses efficient technique
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Modify WebGLRenderer to support trail fading instead of full clear
2. Add fullscreen quad shader for drawing semi-transparent black overlay
3. Add trail configuration (enabled, fadeAmount) to renderer
4. Create vertex/fragment shaders for fade quad
5. Update render() to apply fade overlay when trails enabled
6. Add trailOpacity prop to ParticleCanvas component
7. Update Canvas 2D fallback to support trails
8. Test performance at 60fps with trails enabled
<!-- SECTION:PLAN:END -->
