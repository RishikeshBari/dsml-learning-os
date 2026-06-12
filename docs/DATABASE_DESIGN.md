# Database Design

## Principles

- Supabase Auth owns identity.
- Every user-owned table has `user_id` and RLS.
- Learning records are normalized enough to support analytics.
- AI-generated content is stored only when the user requests it.
- Future job-prep features have reserved tables with practical starter fields.

## Core Enums

- `bucket_status`: `R`, `S`, `G`
- `review_status`: `scheduled`, `complete`, `partial`, `missed`
- `retrieval_status`: `planned`, `in_progress`, `complete`, `missed`
- `project_status`: `not_started`, `in_progress`, `completed`
- `notification_status`: `pending`, `sent`, `failed`, `skipped`
- `interview_item_type`: `conceptual`, `technical`, `coding`, `behavioral`
- `readiness_status`: `not_started`, `in_progress`, `ready`

## Main Tables

### `profiles`

Application profile linked one-to-one with `auth.users`.

Important columns:

- `id`
- `display_name`
- `avatar_url`
- `timezone`
- `created_at`
- `updated_at`

### `user_settings`

Stores app preferences.

Important columns:

- `user_id`
- `email`
- `theme`
- `gemini_api_key`
- `reminder_email_enabled`
- `weekly_retrieval_enabled`
- `created_at`
- `updated_at`

`gemini_api_key` is stored per user for the first version. A later hardening pass can encrypt it with a Supabase Vault-backed Edge Function.

### `class_schedule`

Stores weekly class schedule. Seed Monday, Wednesday, Friday from 9 PM to 11 PM for each user.

Important columns:

- `user_id`
- `weekday`
- `start_time`
- `end_time`
- `label`
- `is_active`

### `modules`

Course modules such as Machine Learning or Statistics.

Important columns:

- `user_id`
- `name`
- `description`
- `sort_order`
- `is_archived`

### `topics`

Individual concepts inside modules.

Important columns:

- `user_id`
- `module_id`
- `name`
- `date_studied`
- `bucket`
- `instructor_notes`
- `last_reviewed_at`
- `created_at`
- `updated_at`

### `reviews`

Scheduled spaced-repetition events.

Important columns:

- `user_id`
- `topic_id`
- `review_number`
- `due_date`
- `status`
- `mastery_score`
- `completed_at`

### `revision_attempts`

Historical review attempts. This preserves every score and status update even if the parent review row changes.

Important columns:

- `user_id`
- `topic_id`
- `review_id`
- `status`
- `mastery_score`
- `notes`
- `attempted_at`

### `bucket_suggestions`

Tracks system-generated bucket movement suggestions. Users accept or reject them.

Important columns:

- `user_id`
- `topic_id`
- `from_bucket`
- `to_bucket`
- `reason`
- `status`
- `decided_at`

### `retrieval_sessions`

Sunday retrieval sessions or manually created sessions.

Important columns:

- `user_id`
- `scheduled_for`
- `duration_minutes`
- `status`
- `completed_at`

### `retrieval_session_topics`

Topics selected for a retrieval session.

Important columns:

- `retrieval_session_id`
- `topic_id`
- `selection_reason`

### `retrieval_prompts`

Questions generated locally or by Gemini.

Important columns:

- `user_id`
- `retrieval_session_id`
- `topic_id`
- `prompt_type`
- `prompt`
- `source`

### `retrieval_responses`

User responses, AI mentor feedback, and optional user-overridden retrieval
scores.

Important columns:

- `user_id`
- `retrieval_prompt_id`
- `response`
- `score`
- `score_overridden`
- `ai_score`
- `ai_is_correct`
- `ai_confidence`
- `ai_feedback`
- `ai_what_was_good`
- `ai_what_was_missing`
- `ai_corrected_answer`
- `ai_next_action`
- `ai_bucket_suggestion`
- `ai_bucket_reason`
- `evaluated_at`
- `completed_at`

AI evaluation is requested only after the answer is saved. The AI score is used
by default, but a manual score override takes precedence. Bucket suggestions
are advisory and never update a topic automatically.

### `coding_practice`

Coding exercises tied to topics and optionally generated from retrieval prompts.

Important columns:

- `user_id`
- `topic_id`
- `title`
- `prompt`
- `status`
- `score`
- `completed_at`

### `projects`

Portfolio or practice projects.

Important columns:

- `user_id`
- `name`
- `description`
- `github_link`
- `demo_url`
- `status`
- `progress_percentage`
- `module_id`
- `next_action`
- `notes`
- `notes_updated_at`
- `last_worked_on`
- `started_at`
- `completed_at`

### `project_topics`

Many-to-many relationship between projects and topics.

### `project_phases`

Ordered, user-defined phases that calculate project progress.

Important columns:

- `project_id`
- `user_id`
- `title`
- `description`
- `status`
- `priority`
- `order_index`
- `due_date`
- `completed_at`

### `project_work_logs`

Flexible project journal entries with time spent, blockers, next steps, an
optional linked phase, and the project progress captured at log time.

### `project_progress_snapshots`

Chart-ready progress history created when phase progress changes, a manual
status changes progress, or a work log is saved.

### `mastery_snapshots`

Stores calculated mastery values over time.

Important columns:

- `user_id`
- `module_id`
- `topic_id`
- `revision_score`
- `coding_score`
- `retrieval_score`
- `mastery_score`

Scores are normalized to percentages. Revision and coding scores use their
0-5 activity averages. Retrieval uses the manual override when present,
otherwise the AI score, with the legacy response score as a fallback.
- `snapshot_date`

### `notifications`

Reminder queue and audit log.

Important columns:

- `user_id`
- `type`
- `channel`
- `status`
- `scheduled_for`
- `sent_at`
- `error_message`

## Future Job-Prep Tables

### `interview_questions`

Reusable question bank for conceptual, technical, coding, and behavioral interview prep.

### `interview_attempts`

Tracks practice attempts, scores, notes, and follow-up needs.

### `resume_items`

Tracks resume bullets, project impact statements, skills, and revision status.

### `portfolio_items`

Tracks public portfolio entries and showcase readiness.

### `readiness_snapshots`

Tracks placement, portfolio, resume, and interview readiness over time.

## Automatic Topic Creation Behavior

When a topic is created:

1. Keep the initial bucket as `R` unless the user chooses otherwise.
2. Create five `reviews`:
   - Review 1: `date_studied + 1 day`
   - Review 2: `date_studied + 3 days`
   - Review 3: `date_studied + 7 days`
   - Review 4: `date_studied + 14 days`
   - Review 5: `date_studied + 30 days`

The initial SQL migration includes a trigger for this behavior.

## Bucket Suggestion Logic

The first version can implement this in the frontend service layer or a database function.

Suggested rules:

- If a topic in `S` has at least two recent scores of 4 or 5, suggest `S -> G`.
- If a topic in `S` or `G` has at least two recent scores of 0, 1, or 2, suggest moving down one bucket.
- If a topic in `R` has at least two recent scores of 3 or higher, suggest `R -> S`.
- Never auto-move buckets without user approval.

## Mastery Formula

Topic mastery:

```text
mastery = (revision_performance * 0.40)
        + (coding_performance * 0.40)
        + (retrieval_performance * 0.20)
```

Module mastery is the average of active topic mastery values in the module.

Overall learning health is the weighted blend of:

- Average module mastery
- Review completion rate
- Retrieval completion rate
- Coding completion rate
- Current R/S/G distribution

The exact formula should remain centralized in the analytics domain layer.

## RLS Strategy

All user-owned tables use:

```sql
user_id = auth.uid()
```

For join tables without a direct `user_id`, policies validate ownership through the parent table.

## Indexing Strategy

Indexes prioritize dashboard and analytics queries:

- `reviews(user_id, due_date, status)`
- `topics(user_id, bucket)`
- `topics(user_id, module_id)`
- `retrieval_sessions(user_id, scheduled_for)`
- `projects(user_id, status)`
- `mastery_snapshots(user_id, snapshot_date)`
- `notifications(user_id, scheduled_for, status)`
