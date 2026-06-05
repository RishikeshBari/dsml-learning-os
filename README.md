# DS/ML Learning OS

A premium personal learning operating system for a 2-year Data Science and Machine Learning program.

This project is being built in phases. The first phase defines the architecture, database model, deployment path, and implementation contracts before the React application is scaffolded.

## Current Phase

Phase 2: Authentication + Supabase setup

Completed so far:

- Product architecture and clean module boundaries
- Supabase/Postgres schema plan
- Initial SQL migration with RLS policies
- React + Vite + TypeScript app scaffold
- Tailwind CSS design-system foundation
- Supabase client and environment contract
- Google OAuth sign-in entry point
- Session persistence and protected dashboard shell
- Profile, settings, and class schedule bootstrap


## Local Development

Install dependencies and start the Vite app:

```bash
npm install
npm run dev
```

Create a local `.env` file before testing auth:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_BASE_PATH=/
```

Run `supabase/migrations/0001_initial_schema.sql` in your Supabase project, then enable Google as an auth provider.

## Phase Roadmap

1. Architecture + database design
2. Authentication + Supabase setup
3. Dashboard UI
4. Topic and revision engine
5. Retrieval engine
6. Gemini integration
7. Email reminders
8. Project tracking
9. Analytics
10. PWA + deployment

## Key Documents

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Design](./docs/DATABASE_DESIGN.md)
- [Phase Roadmap](./docs/PHASE_ROADMAP.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Initial Supabase Migration](./supabase/migrations/0001_initial_schema.sql)

