---
id: TASK-018
title: Implement keyboard controls for SPACE and V
status: In Progress
assignee:
  - '@copilot'
created_date: '2026-01-23 07:51'
updated_date: '2026-02-09 07:15'
labels:
  - interaction
  - controls
dependencies:
  - TASK-015
  - TASK-003
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add keyboard event handlers for SPACE key to toggle particle mode and V key to toggle camera preview visibility. Ensure controls work globally and don't conflict with other interactions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SPACE key toggles between Attract and Repel
- [ ] #2 V key shows/hides camera preview
- [ ] #3 Keys work regardless of focus state
- [ ] #4 No conflicts with text input fields
- [ ] #5 Key events properly cleaned up on unmount
<!-- AC:END -->
