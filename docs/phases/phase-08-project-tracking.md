# Phase 8: Project Tracking

## Delivered

- Compact, collapsible project cards
- Statuses from Idea through Archived
- Phase CRUD, priority, due dates, status, and reordering
- Automatic phase-based project progress
- Flexible work-log CRUD with time, blockers, next steps, and linked phases
- Progress snapshots and lightweight charts
- GitHub, demo, module, and topic associations
- Project-specific collapsible Notes & Ideas notebook
- Dashboard and analytics project summaries

## Progress Rules

- With phases: completed phases divided by total phases.
- Without phases: project status supplies a manual fallback percentage.
- Completing all phases marks the project completed.
- Reopening a phase returns an automatically completed project to in progress.
- Phase progress changes, work logs, and manual fallback changes create chart
  snapshots.

## Database

- `projects` now stores progress, demo URL, next action, notes, and last worked
  date.
- `project_phases` stores ordered project phases.
- `project_work_logs` stores flexible progress journal entries.
- `project_progress_snapshots` stores chart-ready progress history.
- All new public tables use RLS and authenticated-role grants.

## Daily Use

1. Create or open a project.
2. Add the phases that match the project.
3. Mark the current phase in progress.
4. Add a work log after a meaningful session.
5. Capture loose thoughts in Notes & Ideas.
6. Review Progress Insights when deciding what to work on next.
