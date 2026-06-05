# Phase 4: Topic and Revision Engine

## Status

Implemented and verified.

## Scope

- Modules can be created from the Topics page.
- Topics can be created with a module, studied date, bucket, and notes.
- Supabase creates five scheduled reviews from the topic insert trigger.
- Topics can be moved between R/S/G buckets manually.
- Topics can be archived.
- Revisions page shows due and upcoming reviews.
- Due reviews can be marked complete, partial, or missed with a 0-5 score.
- Recent review scores generate pending bucket suggestions.
- Bucket suggestions can be accepted or rejected by the user.

## Routes

- `/` - Today dashboard
- `/topics` - Module and topic management
- `/revisions` - Revision queue and bucket suggestions

## Database Dependencies

Phase 4 uses tables and triggers already defined in the Phase 1 schema:

- `modules`
- `topics`
- `reviews`
- `revision_attempts`
- `bucket_suggestions`
- `topics_create_default_reviews`
- `reviews_log_revision_attempt`

## Ready-To-Use Test

1. Sign in with Google.
2. Open `/topics`.
3. Create a module.
4. Create a topic with yesterday as the studied date.
5. Open `/revisions`.
6. Confirm one due review and four upcoming reviews appear.
7. Complete the due review with a mastery score.
8. Return to `/` and confirm dashboard counts update.

## Notes

- Bucket suggestions require two recent scored reviews for the same topic.
- Future retrieval and analytics phases will reuse the same topic, review, and bucket data.
