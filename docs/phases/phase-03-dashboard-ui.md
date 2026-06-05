# Phase 3: Dashboard UI

## Goal

Build the first real authenticated experience: a responsive Today Dashboard that works on mobile, tablet, and desktop while the deeper topic/revision engines are still pending.

## Implemented

- Desktop sidebar with the full project navigation surface
- Mobile bottom navigation
- Sticky dashboard header with current date, account, sign out, and theme toggle
- Light/dark theme provider with persisted preference
- Live Supabase dashboard read model
- Learning health, modules, due reviews, weak areas, and weekly review cards
- R/S/G distribution UI
- Due revisions, upcoming class, weekly progress, retrieval, and projects panels
- Empty states for accounts with no topics, reviews, retrieval sessions, or projects

## Data Sources

The dashboard reads from the existing Phase 1 schema:

- `modules`
- `topics`
- `reviews`
- `class_schedule`
- `retrieval_sessions`
- `projects`
- `mastery_snapshots`

Phase 3 does not create or mutate learning data. CRUD and domain actions remain reserved for Phase 4 onward.

## Verification Checklist

1. Sign in with Google.
2. Confirm the dashboard loads the authenticated profile.
3. Confirm empty states render without broken layouts.
4. Toggle light/dark mode.
5. Check desktop and mobile layouts in the browser.
6. Run `npm run lint`.
7. Run `npm run build`.

## Notes For Phase 4

The dashboard is now ready to consume real topics and reviews. Phase 4 should add module/topic creation and automatic review generation, then invalidate the dashboard query after mutations.
