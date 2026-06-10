# Phase 6: Gemini Integration

## Status

Implemented and verified with a user-provided Gemini key. Retrieval prompt
generation and secure saved-answer evaluation are both working.

## Recommendation

Use a free-first Gemini API key from Google AI Studio. Retrieval prompt
generation can use the browser-local key. Response evaluation uses the
`GEMINI_API_KEY` Supabase secret and never sends the key to the frontend.

## Scope

- Settings page available at `/settings`.
- Gemini API key save, test, and clear controls.
- Browser-local key storage.
- REST client for `gemini-2.5-flash`.
- Structured output schema for retrieval prompts.
- Retrieval page Gemini prompt generation.
- Gemini prompts are stored in `retrieval_prompts` with `source = 'gemini'`.
- Generated prompt types cover conceptual, interview, practical, and coding practice.
- Duplicate Gemini prompt types are skipped per topic/session.
- Authenticated `evaluate-response` Supabase Edge Function.
- Gemini structured JSON output for predictable persistence.
- Supportive 0-5 scoring that rewards concise, correct answers.
- Persistent strengths, gaps, corrected answer, confidence, next action, and
  bucket suggestion.
- User score override without automatic bucket movement.
- AI-aware topic, module, and overall mastery snapshots.
- No paid cloud billing is required for the current free-tier setup.

## Ready-To-Use Test

1. Create a free Gemini API key in Google AI Studio.
2. Open `/settings`.
3. Save the API key.
4. Run the Gemini test.
5. Open `/retrieval`.
6. Select or create a retrieval session.
7. Click Gemini prompts.
8. Confirm Gemini prompts appear with the Gemini badge.
9. Save an answer and wait for the AI mentor feedback card.
10. Confirm score override and Use AI score both update mastery.

## Notes

- The API key remains in browser local storage.
- The response-evaluation key is stored only as a Supabase Edge Function secret.
- The deterministic system prompts from Phase 5 still work without Gemini.
- Direct prompt generation and backend evaluation were verified without
  committing the API key.
- A concise, correct KNN answer was verified at 5/5, confirming that answer
  length alone does not reduce the score.
