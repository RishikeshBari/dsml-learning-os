# Phase 2: Authentication + Supabase Setup

## Status

Implemented in code:

- React + Vite + TypeScript scaffold
- Tailwind CSS configuration
- Supabase browser client
- Vite environment variable contract
- Google OAuth sign-in button
- Session persistence through Supabase Auth
- Auth provider and `useAuth` hook
- Protected route guard
- Initial authenticated app shell
- Profile loading hook for the `profiles` table

Still requires your real Supabase project values:

- Supabase project URL
- Supabase anon key
- Google OAuth client ID and secret configured inside Supabase

## Branch Strategy

This project will stay in one repository and one long-lived project branch. Phases are organized through:

- `docs/phases/` for phase-specific setup notes
- `src/features/` for feature modules
- `supabase/migrations/` for database changes

No new branch is needed for every phase.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill in `.env`:

   ```text
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_APP_BASE_PATH=/
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open:

   ```text
   http://127.0.0.1:5173
   ```

Without Supabase environment values, the app intentionally shows a disabled sign-in state.

## Supabase Project Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run:

   ```text
   supabase/migrations/0001_initial_schema.sql
   ```

4. Confirm these tables exist:

   - `profiles`
   - `user_settings`
   - `class_schedule`
   - `modules`
   - `topics`
   - `reviews`

5. Confirm RLS is enabled on user-owned tables.
6. Go to Project Settings, API.
7. Copy:

   - Project URL into `VITE_SUPABASE_URL`
   - Public anon key into `VITE_SUPABASE_ANON_KEY`

## Google OAuth Setup

Supabase's Google provider setup requires Google Cloud credentials and Supabase redirect configuration.

1. In Google Cloud, create or select a project.
2. Configure the OAuth consent screen.
3. Create an OAuth client ID.
4. Choose `Web application`.
5. Add this authorized JavaScript origin for local development:

   ```text
   http://127.0.0.1:5173
   ```

6. Add your production origin later:

   ```text
   https://RishikeshBari.github.io
   ```

7. Add the authorized redirect URI from the Supabase Google provider page. It will look like:

   ```text
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

8. Copy the Google client ID and secret.
9. In Supabase Dashboard, open Authentication, Providers, Google.
10. Enable Google and paste the client ID and secret.

Reference: [Supabase Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Supabase Auth URL Setup

In Supabase Dashboard, open Authentication, URL Configuration.

For local development:

```text
Site URL: http://127.0.0.1:5173
Redirect URLs: http://127.0.0.1:5173/**
```

For GitHub Pages later:

```text
Site URL: https://RishikeshBari.github.io/dsml-learning-os
Redirect URLs: https://RishikeshBari.github.io/dsml-learning-os/**
```

## Verification Checklist

- App builds with `npm run build`.
- App lints with `npm run lint`.
- Dev server responds at `http://127.0.0.1:5173`.
- Missing `.env` values show a disabled sign-in state.
- Google button is enabled after Supabase env values are added.
- Sign-in redirects to Google.
- After sign-in, Supabase returns to the app.
- App loads the user session after refresh.
- `profiles`, `user_settings`, and default `class_schedule` rows are created by the database trigger.

## Notes For Phase 3

Phase 3 can now replace the placeholder authenticated screen with the real dashboard UI. The auth boundary is already in place, so dashboard data hooks can assume an authenticated user.

