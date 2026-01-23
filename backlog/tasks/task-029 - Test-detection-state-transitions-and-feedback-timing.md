---
id: TASK-029
title: Test detection state transitions and feedback timing
status: To Do
assignee: []
created_date: '2026-01-23 15:32'
labels:
  - testing
  - ui
  - feedback
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verify that status indicator updates correctly as hands and face enter/leave detection
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Status shows 'Show hands �' when no hands detected
- [ ] #2 Status updates to '1 hand' when one hand appears
- [ ] #3 Status updates to '2 hands' when both hands detected
- [ ] #4 Status shows '2 hands + face' when face is also detected
- [ ] #5 State changes occur within 1 second of hand/face entering frame
<!-- AC:END -->
