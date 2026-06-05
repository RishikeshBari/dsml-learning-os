# Phase 5: Retrieval Engine

## Status

Implemented and verified.

## Scope

- Retrieval page available at `/retrieval`.
- Sunday retrieval session generation.
- R/S-focused topic selection with green fallback if needed.
- System-generated prompts for conceptual, interview, practical, and coding practice.
- Retrieval response entry.
- 0-5 response scoring.
- Session start, complete, and missed states.
- Dashboard invalidation after retrieval mutations.

## Database Dependencies

Phase 5 uses tables already defined in the Phase 1 schema:

- `retrieval_sessions`
- `retrieval_session_topics`
- `retrieval_prompts`
- `retrieval_responses`
- `topics`
- `modules`

## Ready-To-Use Test

1. Create at least one active topic in R or S.
2. Open `/retrieval`.
3. Generate a Sunday retrieval session.
4. Confirm topics and prompts are created.
5. Save at least one response with a score.
6. Mark the session complete.
7. Confirm the dashboard shows the next retrieval session when applicable.

## Notes

- Gemini generation is intentionally deferred to Phase 6.
- Phase 5 uses deterministic system prompts so the retrieval loop works for free without any paid API key.
