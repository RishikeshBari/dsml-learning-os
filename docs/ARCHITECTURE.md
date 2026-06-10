# Architecture

## Product Summary

DS/ML Learning OS is a mobile-first React application for long-term mastery in a 2-year Data Science and Machine Learning program. It is not a generic notes app or task manager. The core loop is:

1. Add studied topics.
2. Generate spaced reviews automatically.
3. Track revision, coding, retrieval, and project progress.
4. Use R/S/G buckets to identify weak topics.
5. Generate focused retrieval practice with Gemini on demand.
6. Surface progress and weak areas through a high-signal dashboard.

## Technical Stack

- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- Backend: Supabase Auth, Postgres, Row Level Security, Edge Functions
- Authentication: Google OAuth through Supabase Auth
- AI: Gemini API, user-owned API key stored in settings
- Email: Supabase Edge Functions with a free-tier provider such as Resend
- Charts: Recharts or Tremor-compatible chart primitives
- PWA: Vite PWA plugin and service worker caching
- Hosting: GitHub Pages for the frontend, Supabase for backend services

## Clean Architecture Layers

The app should use feature-first folders with shared platform services. Each feature owns UI, data hooks, domain logic, and types where possible.

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  components/
    ui/
    layout/
    charts/
  config/
    env.ts
    routes.ts
  features/
    auth/
    dashboard/
    modules/
    topics/
    revisions/
    retrieval/
    gemini/
    reminders/
    projects/
    analytics/
    settings/
  lib/
    supabase/
    dates/
    errors/
    storage/
  styles/
    globals.css
  types/
    database.ts
```

## Feature Boundaries

### Auth

Owns Google sign-in, session persistence, route guards, and profile bootstrapping. Supabase Auth is the source of identity. The `profiles` table stores application-specific user data.

### Dashboard

Aggregates the current day view:

- Today's tasks
- Due revisions
- Weak areas
- Upcoming class
- Weekly progress
- Completion percentages
- R/S/G bucket distribution
- Monthly trend

Dashboard should consume read models through hooks rather than directly embedding business rules in components.

### Topics

Owns module and topic creation. When a topic is created, the revision feature creates five scheduled reviews at +1, +3, +7, +14, and +30 days.

### Revisions

Owns review due dates, completion states, mastery scoring, and bucket suggestions. Users always approve bucket movement manually.

### Retrieval

Owns Sunday retrieval sessions, topic selection, retrieval prompts, and completion tracking. It can generate default prompts locally and optionally request Gemini-generated prompts on demand.

### Gemini

Owns prompt construction, request throttling, response normalization, and AI
answer evaluation. User-triggered retrieval prompt generation can use the
browser-local key. Saved-answer evaluation runs through an authenticated
Supabase Edge Function so the backend Gemini secret is never exposed to the
frontend.

The evaluation service returns structured JSON, stores feedback beside the
retrieval response, and suggests a score and bucket. Users can override the
score, while bucket movement remains manual.

### Reminders

Owns email settings, reminder preferences, reminder logs, and Edge Function calls. Scheduled emails should be sent by Supabase cron or an external scheduler calling Edge Functions.

### Projects

Owns portfolio project tracking and associations with modules/topics. Completed projects improve mastery signals.

### Analytics

Owns chart-ready aggregates and scoring models:

- Topic mastery
- Module mastery
- Overall learning health
- Weekly/monthly trends
- Weakest and strongest modules

## Data Flow

1. User signs in with Google.
2. Supabase Auth creates a user.
3. A database trigger creates `profiles` and `user_settings`.
4. The frontend loads session state and user settings.
5. User creates modules, topics, reviews, retrieval sessions, projects, and responses.
6. RLS ensures users can read and write only their own records.
7. Views/functions provide dashboard and analytics aggregates.
8. Edge Functions handle Gemini generation and reminder emails when needed.

## State Management Strategy

Use local React state for transient UI state and server-state hooks for Supabase data.

Recommended:

- TanStack Query for server cache, loading states, invalidation, and optimistic updates
- React Context only for auth session, theme, and app shell preferences
- URL state for filters, tabs, and dashboard date range when shareable

Avoid storing canonical learning data in browser-only storage. Supabase remains the source of truth.

## API Design

The frontend should call Supabase directly for CRUD where RLS is enough. Use Edge Functions for operations that require secrets, server-side logic, scheduled jobs, or third-party APIs.

Direct Supabase calls:

- Modules
- Topics
- Reviews
- Revision attempts
- Retrieval sessions and responses
- Projects
- Settings

Edge Functions:

- `evaluate-response`
- `generate-retrieval-prompts`
- `generate-concept-explanation`
- `send-due-review-reminders`
- `send-sunday-retrieval-reminders`
- `send-missed-review-reminders`

## UI Architecture

The first screen after auth should be the Today Dashboard, not a marketing page.

Primary navigation:

- Today
- Topics
- Revisions
- Retrieval
- Projects
- Analytics
- Settings

Mobile layout:

- Bottom navigation for primary sections
- Compact dashboard cards
- Full-screen modal/sheet for topic and project creation

Desktop layout:

- Left sidebar
- Dashboard grid
- Persistent top bar with date, theme toggle, and account menu

## Design System Direction

The visual direction is an Apple + Linear hybrid:

- Clean type hierarchy
- Light and dark modes
- Neutral surfaces
- Restrained gradients
- Elegant cards with small radii
- Dense, scannable dashboard data
- Strong spacing rhythm
- No decorative clutter

Use Tailwind design tokens for colors, spacing, shadows, and radius. Keep reusable primitives in `components/ui`.

## UI Wireframe Descriptions

### Auth Screen

Mobile:

- Centered product mark and app name
- One primary Google sign-in button
- Small privacy/session note
- Theme-aware background

Desktop:

- Centered narrow auth panel
- Subtle product context beside or above the sign-in action

### Today Dashboard

Mobile:

- Header with greeting, current date, and account button
- Horizontal summary row for learning health and review completion
- Stacked cards in priority order: due revisions, weak areas, upcoming class, weekly progress
- Bottom navigation

Tablet:

- Two-column dashboard grid
- Due revisions and weak areas remain first
- Charts become wider but stay compact

Desktop:

- Sidebar navigation
- Top bar with date, theme toggle, and settings/account
- Main grid:
  - Left: today's tasks, due revisions, weak areas
  - Center/right: progress cards, bucket distribution, monthly trend
  - Lower area: upcoming class and suggested retrieval session

### Topics

- Module list with topic counts and average mastery
- Topic table/list grouped by module
- Bucket filter using R/S/G segmented control
- Add topic sheet with module, topic name, date studied, starting bucket, and notes
- Topic detail view with review schedule, attempts, prompts, coding practice, and projects

### Revisions

- Due today list
- Upcoming list
- Missed review list
- Review action panel with complete, partial, missed, mastery score 0-5, and notes
- Bucket suggestion banner when transition rules are met

### Retrieval

- Current Sunday session card
- Topic selection preview
- Prompt groups: conceptual, interview, practical, coding
- Response area with score
- Completion summary

### Projects

- Project status columns or filtered list
- Project form with GitHub link, module, associated topics, and status
- Project detail view showing mastery contribution

### Analytics

- Learning health score
- Weekly/monthly trend charts
- Completion rates
- R/S/G distribution
- Weakest and strongest modules
- Topic mastery table

### Settings

- Profile details
- Theme preference
- Reminder email and toggles
- Gemini API key entry
- Data/account controls

## Component Hierarchy

```text
App
  AppProviders
    AuthProvider
    QueryClientProvider
    ThemeProvider
  Router
    PublicRoute
      AuthPage
    ProtectedRoute
      AppShell
        SidebarNav
        MobileBottomNav
        TopBar
        TodayPage
          DashboardMetricCard
          DueReviewsCard
          WeakAreasCard
          UpcomingClassCard
          WeeklyProgressChart
          BucketDistributionChart
          MonthlyTrendChart
        TopicsPage
          ModuleList
          TopicList
          TopicFormSheet
          TopicDetailPanel
        RevisionsPage
          ReviewQueue
          ReviewActionPanel
          BucketSuggestionBanner
        RetrievalPage
          RetrievalSessionCard
          PromptGroup
          RetrievalResponseEditor
        ProjectsPage
          ProjectList
          ProjectFormSheet
          ProjectTopicPicker
        AnalyticsPage
          LearningHealthCard
          CompletionCharts
          MasteryTrendChart
        SettingsPage
          ProfileSettings
          ReminderSettings
          GeminiSettings
```

## Scalability Notes

- Keep RLS policies simple and user-owned.
- Use database views for analytics read models as calculations grow.
- Keep AI-generated content normalized as prompt items/responses, not unstructured blobs only.
- Add future job-prep tables now with minimal fields so the schema can grow without painful migrations.
- Avoid coupling Gemini logic to retrieval only; future interview and explanation features should reuse the same generation service.
