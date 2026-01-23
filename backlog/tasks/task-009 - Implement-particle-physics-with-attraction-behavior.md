---
id: TASK-009
title: Implement particle physics with attraction behavior
status: To Do
assignee: []
created_date: '2026-01-23 07:50'
updated_date: '2026-01-23 08:03'
labels:
  - particles
  - physics
dependencies:
  - TASK-008
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the core particle system with STRICT landmark binding - particles ONLY exist at detected landmarks with zero scatter. Use WebGL 2 instancing for 15K particles in a single draw call. Implement double-buffered interpolation to smooth 30fps MediaPipe detection to 60fps render. Particles are pre-allocated once and bound to specific landmarks - invisible when landmark not detected (alpha=0).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Particle class with position, velocity, target properties
- [ ] #2 Attraction force calculation toward landmarks
- [ ] #3 Smooth velocity interpolation with damping
- [ ] #4 Particles distribute evenly across visible landmarks
- [ ] #5 Physics runs independently of render at fixed timestep
- [ ] #6 Particles feel organic like flowing liquid
- [ ] #7 Particles pre-allocated in Float32Array (never created/destroyed at runtime)
- [ ] #8 Each particle statically bound to exactly one landmark index
- [ ] #9 Zero stray particles - particles ONLY appear at detected landmarks
- [ ] #10 Double-buffer interpolation smooths 30fps detection to 60fps render
- [ ] #11 Particles set to alpha=0 when their landmark is not detected
- [ ] #12 WebGL 2 instancing renders all particles in single draw call
<!-- AC:END -->
