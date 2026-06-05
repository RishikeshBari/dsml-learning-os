# Deployment Guide

This guide is intentionally phase-aware. The project should not be deployed as a finished product until Phase 10, but each phase includes checks that make the final deployment smooth.

## Accounts Needed

- GitHub account
- Supabase account
- Google Cloud account for OAuth
- Google AI Studio account for Gemini API key
- Email provider account for reminders, such as Resend

## Local Development Setup

After Phase 2 scaffolds the app, local setup will use:

```bash
npm install
npm run dev
```

Expected environment variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_BASE_PATH=
```

Do not expose service-role keys in the frontend.

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/migrations/0001_initial_schema.sql`.
4. Confirm tables were created.
5. Confirm Row Level Security is enabled.
6. In Authentication settings, configure site URL and redirect URLs after the app URL is known.

Local redirect URL for Vite:

```text
http://localhost:5173
```

GitHub Pages redirect URL pattern:

```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME
```

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create OAuth client credentials for a web application.
5. Add Supabase callback URL from Supabase Auth provider settings.
6. Copy Google client ID and secret into Supabase Auth Google provider settings.
7. Enable Google provider in Supabase.

## Gemini Setup

1. Create a Gemini API key in Google AI Studio.
2. In the app, go to Settings.
3. Save the API key.
4. Generate questions on demand from Retrieval or Topic detail screens.

For production hardening, move Gemini calls into a Supabase Edge Function so the browser does not directly call Gemini.

## Email Reminder Setup

Recommended first production path:

1. Create a Resend account.
2. Verify a sender domain or use the provider's allowed testing mode.
3. Store the provider API key as a Supabase Edge Function secret.
4. Deploy reminder Edge Functions.
5. Schedule functions with Supabase cron or an external free scheduler.
6. Send a test email.

Required reminder types:

- Due revisions
- Sunday retrieval sessions
- Missed reviews

## GitHub Pages Deployment

Phase 10 should add a workflow similar to:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_APP_BASE_PATH: /YOUR_REPOSITORY_NAME/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Production Readiness Checklist

- Google sign-in works locally.
- Google sign-in works on GitHub Pages URL.
- Supabase RLS blocks cross-user data access.
- Topic creation generates five review events.
- Dashboard works with empty and populated data.
- Mobile layout has no overflow.
- Dark and light themes are readable.
- Gemini handles missing API key, invalid key, and quota errors.
- Email reminders can be tested manually.
- App installs as a PWA on mobile.
- Build output has no TypeScript errors.
- No secret keys are committed.

