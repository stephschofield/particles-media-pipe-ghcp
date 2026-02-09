---
id: TASK-012
title: Add 5 color themes with cycling support
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:50'
updated_date: '2026-02-09 06:52'
labels:
  - themes
  - particles
dependencies:
  - TASK-009
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement 5 particle color themes: Rainbow (spectrum colors), Fire (red/orange/yellow), Ocean (blue/teal/white), Galaxy (purple/pink/stars), and Matrix (green digital rain). Support cycling between themes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rainbow theme with full spectrum particles
- [x] #2 Fire theme with red, orange, yellow gradients
- [x] #3 Ocean theme with blue, teal, white colors
- [x] #4 Galaxy theme with purple, pink, starfield effect
- [x] #5 Matrix theme with green digital rain aesthetic
- [x] #6 Themes can be cycled programmatically
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/core/themes.ts with 5 distinct color themes
2. Define ColorTheme interface with leftHand, rightHand, face colors
3. Implement ThemeManager class with current theme tracking and cycling
4. Export getCurrentTheme() and cycleTheme() functions
5. Integrate theme changes with ParticleSystem.setColors()
6. Export from src/core/particles/index.ts
7. Update ParticleCanvas to support theme prop and onThemeChange callback
8. Test for TypeScript errors
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Created src/core/themes.ts with 5 color themes
- Implemented ThemeManager class with subscribe pattern for reactive updates
- Integrated theme colors into ParticleCanvas via themeName prop and themeManager subscription
- All themes apply immediately to particle colors on change
- Zero TypeScript errors verified
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added 5 distinct color themes with cycling support for the particle system.

Changes:
- Created `src/core/themes.ts` with ColorTheme interface and 5 themes (Rainbow, Fire, Ocean, Galaxy, Matrix)
- ThemeManager class tracks current theme with subscribe() for reactive updates
- Added cycleTheme() and getCurrentTheme() convenience functions
- Updated ParticleCanvas with themeName prop and onThemeChange callback
- Theme changes immediately update particle colors via ParticleSystem.setColors()

Exports:
- ThemeName, ColorTheme, THEMES, themeManager, cycleTheme(), getCurrentTheme()

Usage: Call cycleTheme() to rotate through themes, or use themeManager.setTheme(name) to set directly.
<!-- SECTION:FINAL_SUMMARY:END -->
