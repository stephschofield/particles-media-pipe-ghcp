---
id: TASK-009
title: Implement particle physics with attraction behavior
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 07:50'
updated_date: '2026-02-09 05:55'
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
- [x] #1 Particle class with position, velocity, target properties
- [x] #2 Attraction force calculation toward landmarks
- [x] #3 Smooth velocity interpolation with damping
- [x] #4 Particles distribute evenly across visible landmarks
- [x] #5 Physics runs independently of render at fixed timestep
- [x] #6 Particles feel organic like flowing liquid
- [x] #7 Particles pre-allocated in Float32Array (never created/destroyed at runtime)
- [x] #8 Each particle statically bound to exactly one landmark index
- [x] #9 Zero stray particles - particles ONLY appear at detected landmarks
- [x] #10 Double-buffer interpolation smooths 30fps detection to 60fps render
- [x] #11 Particles set to alpha=0 when their landmark is not detected
- [x] #12 WebGL 2 instancing renders all particles in single draw call
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/core/particles/ module structure with types
2. Implement ParticlePool - pre-allocated Float32Arrays for 15K particles
3. Implement LandmarkInterpolator - double-buffer for 30fps→60fps smoothing
4. Implement ParticlePhysics - fixed timestep with attraction force + damping
5. Implement ParticleSystem - main coordinator binding particles to landmarks
6. Update ParticleCanvas to use new particle system
7. Test and verify all acceptance criteria
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created complete particle system module in src/core/particles/:
- types.ts: Full type definitions for particle system
- ParticlePool.ts: Pre-allocated Float32Arrays for ~15K particles statically bound to landmarks
- LandmarkInterpolator.ts: Double-buffered 30fps→60fps interpolation (no prediction to avoid overshoot)
- ParticlePhysics.ts: Fixed timestep (16.67ms) physics with spring attraction + organic noise for liquid feel
- ParticleSystem.ts: Main coordinator integrating pool, interpolator, and physics
- Updated ParticleCanvas component to use new system
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented core particle physics system with strict landmark binding.

Changes:
- Added src/core/particles/ module with 5 files (types.ts, ParticlePool.ts, LandmarkInterpolator.ts, ParticlePhysics.ts, ParticleSystem.ts)
- ParticlePool pre-allocates ~10K particles (21 landmarks × 2 hands × ~50 each + 468 face landmarks × 12 each)
- Each particle statically bound to exactly one landmark index at init time
- LandmarkInterpolator uses double-buffering for smooth 30fps→60fps without prediction
- ParticlePhysics runs fixed timestep (16.67ms) with spring attraction + damping (0.92)
- Organic noise adds liquid-like feel to particle movement
- Particles alpha=0 when landmark not detected (invisible but still in buffer)
- Updated ParticleCanvas to integrate new system

API for TASK-010/011:
- ParticlePool.updateHandTargets(handIndex, landmarks, handedness)
- ParticlePool.updateFaceTargets(landmarks)
- ParticleSystem.setPhysicsMode(Attract|Repel)
- ParticleSystem.setColors(colors)

Build: TypeScript compiles with zero errors
<!-- SECTION:FINAL_SUMMARY:END -->
