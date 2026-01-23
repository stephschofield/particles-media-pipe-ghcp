---
id: TASK-009
title: Implement particle physics with attraction behavior
status: To Do
assignee: []
created_date: '2026-01-23 07:50'
updated_date: '2026-01-23 07:52'
labels:
  - particles
  - physics
dependencies:
  - TASK-008
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the core particle system with physics simulation. Particles should have position, velocity, and attraction force toward target landmarks. Include smooth interpolation and momentum for organic fluid motion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Particle class with position, velocity, target properties
- [ ] #2 Attraction force calculation toward landmarks
- [ ] #3 Smooth velocity interpolation with damping
- [ ] #4 Particles distribute evenly across visible landmarks
- [ ] #5 Physics runs independently of render at fixed timestep
- [ ] #6 Particles feel organic like flowing liquid
<!-- AC:END -->
