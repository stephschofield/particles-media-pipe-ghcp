---
id: TASK-022
title: Implement detection loss handling and transitions
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 08:04'
updated_date: '2026-02-09 07:32'
labels:
  - particles
  - transitions
dependencies:
  - TASK-009
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Handle smooth transitions when hands/face detection is lost or regained. Particles fade out over 200ms when detection lost, hold position briefly on momentary occlusion (<300ms), and lerp to new position over 100ms when re-detected. Prevents jarring pop-in/pop-out.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Particles fade out over 200ms when landmark lost
- [x] #2 Hold last position for <300ms occlusion with 70% opacity
- [x] #3 Lerp to new position over 100ms on re-detection
- [x] #4 No jarring snap-back or pop-in effects
- [x] #5 Smooth particle redistribution when hand count changes
- [x] #6 Idle state after 500ms+ of no detection
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Created DetectionStateManager.ts - state machine for handling detection loss/regain transitions
2. Modified ParticlePool.ts - added alpha multiplier support for smooth fade transitions
3. Modified ParticleSystem.ts - integrated DetectionStateManager for coordinated transitions
4. Modified ParticlePhysics.ts - added drift behavior for fading particles
5. Updated index.ts to export new module
6. Verified zero TypeScript errors
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete:
- Created DetectionStateManager with 5 states: Detected, Occluded, FadingOut, Hidden, FadingIn
- Timing constants: 200ms fadeout, 300ms occlusion threshold, 100ms fadein, 500ms idle threshold, 70% occluded opacity
- ParticlePool now tracks base alpha separately from multiplied alpha for smooth transitions
- ParticlePhysics adds drift behavior for fading particles (gentle noise-based movement instead of freeze)
- ParticleSystem coordinates state updates and applies alpha multipliers per frame
- Smooth easing curves: easeInCubic for fadeout (slow start, fast end), easeOutCubic for fadein (fast start, slow end)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented detection loss handling and smooth transitions for the particle system.

## Changes

**New file: src/core/particles/DetectionStateManager.ts**
- State machine with 5 states: Detected, Occluded, FadingOut, Hidden, FadingIn
- Tracks state per entity (2 hands + face independently)
- Configurable timing: 200ms fadeout, 300ms occlusion threshold, 100ms fadein
- Supports 70% opacity during brief occlusions (<300ms)
- Global idle detection after 500ms of no tracking

**Modified: ParticlePool.ts**
- Added baseAlpha array to track particle alpha before multiplier
- Added handAlphaMultipliers and faceAlphaMultiplier fields
- New methods: applyHandAlphaMultiplier(), applyFaceAlphaMultiplier()
- Updated updateHandTargets() and updateFaceTargets() to accept alphaMultiplier

**Modified: ParticleSystem.ts**
- Integrated DetectionStateManager for coordinated transitions
- Updated updateParticleTargets() to use detection state for alpha and target updates
- Added isIdle() method for external status checking
- Reset now includes detection state manager

**Modified: ParticlePhysics.ts**
- Added detection state awareness for drift behavior
- Fading particles now drift gently with noise instead of freezing
- Reduced attraction force and damping for floating effect during fadeout

**Modified: index.ts**
- Exported DetectionStateManager, DetectionState, and DETECTION_TIMING

## Behavior
- When detection lost: particles hold at 70% opacity for up to 300ms (debounce)
- If still lost after 300ms: fade to 0% over 200ms with gentle drift
- When re-detected: fade in from 0% to 100% over 100ms
- No jarring snap-back; smooth position lerping on re-detection
<!-- SECTION:FINAL_SUMMARY:END -->
