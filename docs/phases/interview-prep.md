# Interview Prep Extension

## Status

Implemented as an extension of the existing DS/ML Learning OS.

## Scope

- Dedicated `/interview-prep` route and main navigation item.
- Dashboard, Modules, Practice, Mock Interview, Resume / Project Questions,
  and History views.
- Canonical interview modules for Python, SQL, Statistics, Machine Learning,
  Deep Learning, Projects, Resume, and HR / Behavioral practice.
- Gemini question generation with structured JSON output.
- Secure answer evaluation through the authenticated `interview-ai` Supabase
  Edge Function.
- Draft answers, repeat attempts, improvement deltas, feedback, ideal answers,
  speaking tips, follow-up questions, and short revision recaps.
- Weak-topic practice, project defense, resume-based questions, mock
  interviews, and a seven-day crash plan.
- Module readiness scoring and compact analytics.
- Row-level security and explicit authenticated grants for every new table.

## Database

Migration:

`supabase/migrations/20260615132942_extend_interview_prep.sql`

New tables:

- `interview_modules`
- `interview_topics`
- `interview_feedback`
- `interview_sessions`
- `interview_revision_notes`

Extended tables:

- `interview_questions`
- `interview_attempts`

## Readiness Formula

Module readiness is clamped to 0-100 and combines:

- 50% answer quality from average AI score
- 20% question coverage, capped after 12 distinct questions
- 10% difficulty attempted
- 10% improvement across re-attempts
- 10% recent practice
- 5% answer confidence
- 5% repeated-strength bonus after three strong latest answers
- Up to 15% weak-topic penalty

The coverage cap and repeated-strength requirement prevent one good answer from
making a module interview-ready.

## Secure Gemini Flow

The frontend calls the authenticated `interview-ai` Edge Function. The function
reads `GEMINI_API_KEY` from Supabase secrets and supports these structured
actions:

- `generate_questions`
- `evaluate_answer`
- `revision_recap`
- `mock_summary`
- `crash_plan`

The Gemini key is never returned to the browser.

## Verification

1. Run `npm run lint`.
2. Run `npm run build`.
3. Apply the Interview Prep migration.
4. Deploy `supabase/functions/interview-ai` with JWT verification enabled.
5. Sign in and open `/interview-prep`.
6. Generate three questions.
7. Save a draft, evaluate it, and confirm feedback persists.
8. Re-attempt the same question and confirm the improvement delta.
9. Generate a revision recap.
10. Run and complete a five-question mock interview.
11. Generate a seven-day plan.
12. Verify the page in light/dark mode and mobile/desktop layouts.

## Assumptions

- The existing Supabase project already has the `GEMINI_API_KEY` secret used by
  `evaluate-response`.
- Resume mode accepts pasted text in this version; it does not upload files.
- Project defense uses the existing project name, description, status, and next
  action as interview context.
- Readiness is advisory and does not automatically alter learning buckets.
