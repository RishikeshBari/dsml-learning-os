# Phase Roadmap

## Phase 1: Architecture + Database Design

Goal: Define the production foundation before writing the app shell.

Deliverables:

- Architecture document
- Database design document
- Supabase migration
- Deployment/readiness guide
- Phase-by-phase implementation path

Exit criteria:

- Schema supports all required MVP features.
- Future job-prep features have reserved extension points.
- Next phase can configure Supabase without redesigning core tables.

## Phase 2: Authentication + Supabase Setup

Goal: Create the Vite app and connect it to Supabase Auth.

Status: Implemented and verified. Google OAuth is configured in Google Cloud and Supabase, local sign-in succeeds, and database bootstrap rows are created.

Build:

- React + Vite + TypeScript scaffold
- Tailwind CSS setup
- Supabase client
- Environment variable contract
- Google sign-in/sign-up
- Session persistence
- Protected dashboard route
- Profile, settings, and class schedule bootstrap
- Missing-environment fallback for local setup

Ready-to-use steps:

1. Create a Supabase project.
2. Run `supabase/migrations/0001_initial_schema.sql`.
3. Configure Google OAuth in Google Cloud.
4. Add the Google provider in Supabase Auth.
5. Add local `.env` values.
6. Run the app locally and verify sign-in.

## Phase 3: Dashboard UI

Goal: Build the premium Today Dashboard shell and responsive navigation.

Status: Implemented dashboard shell and live Supabase read model. Topic and revision mutations begin in Phase 4.

Build:

- Mobile bottom nav
- Desktop sidebar
- Theme toggle
- Dashboard cards
- Empty states
- Class schedule card
- R/S/G distribution UI
- Progress cards and chart placeholders

Ready-to-use steps:

1. Sign in.
2. Confirm profile loads.
3. Confirm dashboard handles empty data.
4. Confirm light/dark mode.
5. Test phone, tablet, and desktop breakpoints.

## Phase 4: Topic and Revision Engine

Goal: Enable the core mastery loop.

Status: Implemented and verified. Topic creation, review completion, automatic review scheduling, and dashboard updates are working against Supabase.

Build:

- Module CRUD
- Topic creation
- Automatic review generation
- Review list by due date
- Complete/partial/missed actions
- Mastery score 0-5
- Bucket suggestions
- User-controlled bucket changes

Ready-to-use steps:

1. Create a module.
2. Create a topic with date studied.
3. Verify five review dates are created.
4. Complete a review with a mastery score.
5. Confirm dashboard updates.

## Phase 5: Retrieval Engine

Goal: Create Sunday retrieval sessions and response tracking.

Status: Implemented and verified. Retrieval session generation, R/S topic selection, system prompts, response scoring, completion, and dashboard updates are working against Supabase.

Build:

- Retrieval session creation
- R/S-focused topic selection
- Prompt categories
- Retrieval responses
- Retrieval scores
- Completion tracking

Ready-to-use steps:

1. Create topics in R/S buckets.
2. Generate a Sunday retrieval session.
3. Answer prompts.
4. Score responses.
5. Confirm retrieval completion metrics update.

## Phase 6: Gemini Integration

Goal: Generate useful questions and explanations on demand.

Status: Implemented free-first Gemini key management and retrieval prompt generation. Local settings, no-key behavior, direct Gemini connectivity, and structured retrieval prompt generation are verified.

Build:

- Gemini API key setting
- Edge Function or frontend-safe generation strategy
- Prompt templates
- Retrieval prompt generation
- Interview questions
- Coding exercises
- Concept explanations
- Error states and quota-friendly behavior

Ready-to-use steps:

1. Create a Gemini API key.
2. Save it in Settings.
3. Generate prompts for one topic.
4. Confirm generated prompts are stored only after user action.

## Phase 7: Email Reminders

Goal: Send reminders for due revisions, missed reviews, and Sunday retrieval.

Build:

- Reminder preferences
- Email address setting
- Notification queue
- Supabase Edge Functions
- Provider integration, likely Resend
- Scheduled execution
- Delivery logs

Ready-to-use steps:

1. Add reminder email.
2. Enable reminders.
3. Configure provider API key.
4. Deploy Edge Functions.
5. Trigger a test reminder.

## Phase 8: Project Tracking

Goal: Connect projects to employability and mastery.

Status: Core project tracker implemented as a usability improvement. Topic association and mastery contribution remain future enhancements.

Build:

- Project CRUD
- GitHub link field
- Status tracking
- Module association
- Topic associations
- Project completion contribution to mastery

Ready-to-use steps:

1. Create a project.
2. Link it to a module and topics.
3. Move status to completed.
4. Confirm analytics reflects project progress.

## Phase 9: Analytics

Goal: Make progress visible and actionable.

Status: Core analytics page implemented as a usability improvement. Trend charts and deeper monthly analytics remain future enhancements.

Build:

- Weekly progress
- Monthly progress
- Revision completion
- Coding completion
- Retrieval completion
- Weakest modules
- Strongest modules
- R/S/G distribution
- Mastery growth trend
- Learning health score

Ready-to-use steps:

1. Add enough sample learning activity.
2. Review dashboard charts.
3. Confirm analytics match underlying records.
4. Test mobile chart readability.

## Phase 10: PWA + Deployment

Goal: Ship an installable production app on GitHub Pages.

Build:

- PWA manifest
- Service worker caching
- Offline-friendly shell
- GitHub Pages workflow
- Production environment setup
- Supabase production redirect URLs
- Final accessibility and responsive checks

Ready-to-use steps:

1. Set GitHub repository secrets.
2. Configure Supabase production URLs.
3. Build the app.
4. Deploy to GitHub Pages.
5. Install on mobile.
6. Verify auth, data sync, and core flows.
