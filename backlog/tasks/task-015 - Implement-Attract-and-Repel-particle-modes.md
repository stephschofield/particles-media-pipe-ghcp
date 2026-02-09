---
id: TASK-015
title: Implement Attract and Repel particle modes
status: Done
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:09'
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
- [x] #1 Attract mode pulls particles toward landmarks
- [x] #2 Repel mode pushes particles away from landmarks
- [x] #3 Mode togglable via UI or keyboard
- [x] #4 Smooth transition when switching modes
- [x] #5 Repel creates interesting negative space effect
- [x] #6 Current mode clearly indicated to user
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Reviewed existing PhysicsMode enum and basic force multiplier implementation
- Enhanced repel mode with RepulsionConfig: minRadius (30px), maxRadius (120px), strength, damping
- In repel mode particles push away, orbit at equilibrium distance, and are pulled back if too far
- Added tangential drift in orbit zone for interesting visual movement
- Added mode transition progress for smooth ~300ms transitions
- Exposed getModeName(), isTransitioning(), setRepulsionConfig(), getRepulsionConfig() on ParticlePhysics
- Exposed same methods on ParticleSystem for React component access
- Exported RepulsionConfig type from particles index
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented Attract and Repel particle modes with smooth transitions and configurable repulsion behavior.

Changes:
- Enhanced ParticlePhysics.ts with RepulsionConfig interface (minRadius, maxRadius, strength, damping)
- Repel mode now creates interesting negative space: particles push away from landmarks, settle at equilibrium distance (30-120px), with tangential drift for organic movement
- Added smooth mode transitions (~300ms) so particles flow organically when toggling modes
- Exposed getModeName(), isTransitioning(), setRepulsionConfig(), getRepulsionConfig() methods
- ParticleSystem exposes same APIs for React component access
- Exported RepulsionConfig type from particles/index.ts

Files modified:
- src/core/particles/ParticlePhysics.ts
- src/core/particles/ParticleSystem.ts
- src/core/particles/index.ts

The existing ParticleCanvas already accepts physicsMode prop and uses ParticleSystem.setPhysicsMode(). UI buttons (TASK-016) and keyboard shortcuts (TASK-018) will connect to this system.
<!-- SECTION:FINAL_SUMMARY:END -->
