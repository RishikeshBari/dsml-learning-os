create table public.interview_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  readiness_score smallint not null default 0
    check (readiness_score between 0 and 100),
  status text not null default 'not_started'
    check (status in ('not_started', 'weak', 'improving', 'interview_ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.interview_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.interview_modules(id) on delete cascade,
  learning_topic_id uuid references public.topics(id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  weakness_score smallint not null default 50
    check (weakness_score between 0 and 100),
  last_practiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_id, name)
);

alter table public.interview_questions
  add column interview_module_id uuid
    references public.interview_modules(id) on delete cascade,
  add column interview_topic_id uuid
    references public.interview_topics(id) on delete set null,
  add column question_type text
    check (
      question_type is null
      or question_type in (
        'conceptual',
        'coding',
        'scenario_based',
        'debugging',
        'project_based',
        'resume_based',
        'hr_behavioral'
      )
    ),
  add column difficulty_label text
    check (
      difficulty_label is null
      or difficulty_label in ('easy', 'medium', 'hard')
    ),
  add column expected_skills text[] not null default '{}',
  add column code_snippet text,
  add column suggested_time_minutes smallint
    check (
      suggested_time_minutes is null
      or suggested_time_minutes between 1 and 120
    ),
  add column context_source text;

alter table public.interview_attempts
  add column attempt_number integer not null default 1
    check (attempt_number > 0),
  add column user_answer text,
  add column ai_score numeric(4, 2)
    check (ai_score is null or ai_score between 0 and 10),
  add column answer_quality_label text
    check (
      answer_quality_label is null
      or answer_quality_label in (
        'too_vague',
        'too_theoretical',
        'good_but_incomplete',
        'interview_ready',
        'needs_example',
        'needs_code_clarity',
        'conceptually_weak',
        'strong_answer'
      )
    ),
  add column improvement_delta numeric(4, 2),
  add column confidence text
    check (confidence is null or confidence in ('low', 'medium', 'high')),
  add column is_draft boolean not null default false,
  add column evaluated_at timestamptz,
  add column updated_at timestamptz not null default now();

update public.interview_attempts
set
  user_answer = coalesce(user_answer, notes),
  ai_score = coalesce(ai_score, score::numeric * 2),
  evaluated_at = coalesce(evaluated_at, attempted_at)
where user_answer is null
   or ai_score is null
   or evaluated_at is null;

with numbered_attempts as (
  select
    id,
    row_number() over (
      partition by user_id, interview_question_id
      order by attempted_at, id
    ) as next_attempt_number
  from public.interview_attempts
)
update public.interview_attempts ia
set attempt_number = na.next_attempt_number
from numbered_attempts na
where na.id = ia.id;

create unique index interview_attempts_user_question_number_key
on public.interview_attempts(user_id, interview_question_id, attempt_number);

create table public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id uuid not null references public.interview_attempts(id) on delete cascade,
  correct_points text[] not null default '{}',
  missing_points text[] not null default '{}',
  mistakes text[] not null default '{}',
  ideal_answer text,
  interview_friendly_answer text,
  natural_speaking_tip text,
  follow_up_questions text[] not null default '{}',
  improvement_tips text[] not null default '{}',
  example text,
  code_snippet text,
  common_mistakes text[] not null default '{}',
  quick_revision_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id)
);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_type text not null
    check (
      session_type in (
        'normal',
        'weak_drill',
        'mock',
        'project_defense',
        'resume_based',
        'last_7_days'
      )
    ),
  module_id uuid references public.interview_modules(id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed')),
  question_ids uuid[] not null default '{}',
  current_question_index integer not null default 0
    check (current_question_index >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  average_score numeric(4, 2)
    check (average_score is null or average_score between 0 and 10),
  summary text,
  strong_areas text[] not null default '{}',
  weak_areas text[] not null default '{}',
  recommendations text[] not null default '{}',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_revision_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.interview_modules(id) on delete cascade,
  topic_id uuid references public.interview_topics(id) on delete cascade,
  revision_note jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index interview_revision_notes_context_key
on public.interview_revision_notes(
  user_id,
  module_id,
  coalesce(topic_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index idx_interview_modules_user_readiness
on public.interview_modules(user_id, readiness_score);

create index idx_interview_topics_module_weakness
on public.interview_topics(module_id, weakness_score desc);

create index idx_interview_questions_module_created
on public.interview_questions(interview_module_id, created_at desc);

create index idx_interview_questions_interview_topic
on public.interview_questions(interview_topic_id);

create index idx_interview_attempts_user_attempted
on public.interview_attempts(user_id, attempted_at desc);

create index idx_interview_feedback_user_created
on public.interview_feedback(user_id, created_at desc);

create index idx_interview_sessions_user_created
on public.interview_sessions(user_id, created_at desc);

create index idx_interview_revision_notes_user_updated
on public.interview_revision_notes(user_id, updated_at desc);

alter table public.interview_modules enable row level security;
alter table public.interview_topics enable row level security;
alter table public.interview_feedback enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_revision_notes enable row level security;

drop policy if exists "Users manage own interview questions"
on public.interview_questions;

drop policy if exists "Users manage own interview attempts"
on public.interview_attempts;

create policy "Users manage own interview modules"
on public.interview_modules
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users manage own interview topics"
on public.interview_topics
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.interview_modules im
    where im.id = module_id
      and im.user_id = (select auth.uid())
  )
  and (
    learning_topic_id is null
    or exists (
      select 1
      from public.topics t
      where t.id = learning_topic_id
        and t.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own interview questions"
on public.interview_questions
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    topic_id is null
    or exists (
      select 1
      from public.topics t
      where t.id = topic_id
        and t.user_id = (select auth.uid())
    )
  )
  and (
    interview_module_id is null
    or exists (
      select 1
      from public.interview_modules im
      where im.id = interview_module_id
        and im.user_id = (select auth.uid())
    )
  )
  and (
    interview_topic_id is null
    or exists (
      select 1
      from public.interview_topics it
      where it.id = interview_topic_id
        and it.user_id = (select auth.uid())
        and (
          interview_module_id is null
          or it.module_id = interview_module_id
        )
    )
  )
);

create policy "Users manage own interview attempts"
on public.interview_attempts
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.interview_questions iq
    where iq.id = interview_question_id
      and iq.user_id = (select auth.uid())
  )
);

create policy "Users manage own interview feedback"
on public.interview_feedback
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.interview_attempts ia
    where ia.id = attempt_id
      and ia.user_id = (select auth.uid())
  )
);

create policy "Users manage own interview sessions"
on public.interview_sessions
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    module_id is null
    or exists (
      select 1
      from public.interview_modules im
      where im.id = module_id
        and im.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own interview revision notes"
on public.interview_revision_notes
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.interview_modules im
    where im.id = module_id
      and im.user_id = (select auth.uid())
  )
  and (
    topic_id is null
    or exists (
      select 1
      from public.interview_topics it
      where it.id = topic_id
        and it.module_id = module_id
        and it.user_id = (select auth.uid())
    )
  )
);

grant select, insert, update, delete
on
  public.interview_modules,
  public.interview_topics,
  public.interview_questions,
  public.interview_attempts,
  public.interview_feedback,
  public.interview_sessions,
  public.interview_revision_notes
to authenticated;

grant select, insert, update, delete
on
  public.interview_modules,
  public.interview_topics,
  public.interview_questions,
  public.interview_attempts,
  public.interview_feedback,
  public.interview_sessions,
  public.interview_revision_notes
to service_role;

revoke all
on
  public.interview_modules,
  public.interview_topics,
  public.interview_questions,
  public.interview_attempts,
  public.interview_feedback,
  public.interview_sessions,
  public.interview_revision_notes
from anon;

create trigger interview_modules_set_updated_at
before update on public.interview_modules
for each row execute function public.set_updated_at();

create trigger interview_topics_set_updated_at
before update on public.interview_topics
for each row execute function public.set_updated_at();

create trigger interview_attempts_set_updated_at
before update on public.interview_attempts
for each row execute function public.set_updated_at();

create trigger interview_feedback_set_updated_at
before update on public.interview_feedback
for each row execute function public.set_updated_at();

create trigger interview_sessions_set_updated_at
before update on public.interview_sessions
for each row execute function public.set_updated_at();

create trigger interview_revision_notes_set_updated_at
before update on public.interview_revision_notes
for each row execute function public.set_updated_at();
