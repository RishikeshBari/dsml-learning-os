# Phase 6: Gemini Integration

## Status

Implemented and partially verified. Local key management and the no-key retrieval path are verified; successful Gemini generation requires a real API key.

## Recommendation

Use a free-first, user-owned Gemini API key from Google AI Studio. The app stores the key only in the current browser and calls Gemini only after a user action.

## Scope

- Settings page available at `/settings`.
- Gemini API key save, test, and clear controls.
- Browser-local key storage.
- REST client for `gemini-3.5-flash`.
- Retrieval page Gemini prompt generation.
- Gemini prompts are stored in `retrieval_prompts` with `source = 'gemini'`.
- Generated prompt types cover conceptual, interview, practical, and coding practice.
- Duplicate Gemini prompt types are skipped per topic/session.
- No Supabase Edge Function or paid cloud billing is required.

## Ready-To-Use Test

1. Create a free Gemini API key in Google AI Studio.
2. Open `/settings`.
3. Save the API key.
4. Run the Gemini test.
5. Open `/retrieval`.
6. Select or create a retrieval session.
7. Click Gemini prompts.
8. Confirm Gemini prompts appear with the Gemini badge.

## Notes

- The API key remains in browser local storage.
- The deterministic system prompts from Phase 5 still work without Gemini.
- Full success testing requires a real Gemini API key.
