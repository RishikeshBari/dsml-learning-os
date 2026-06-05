-- DS/ML Learning OS initial schema
-- Run in the Supabase SQL editor or through the Supabase CLI.

create extension if not exists pgcrypto;

create type public.bucket_status as enum ('R', 'S', 'G');
create type public.review_status as enum ('scheduled', 'complete', 'partial', 'missed');
create type public.retrieval_status as enum ('planned', 'in_progress', 'complete', 'missed');
create type public.project_status as enum ('not_started', 'in_progress', 'completed');
create type public.notification_status as enum ('pending', 'sent', 'failed', 'skipped');
create type public.notification_channel as enum ('email');
create type public.bucket_suggestion_status as enum ('pending', 'accepted', 'rejected');
create type public.prompt_type as enum ('conceptual', 'interview', 'practical', 'coding');
create type public.prompt_source as enum ('system', 'gemini');
create type public.practice_status as enum ('not_started', 'in_progress', 'completed');
create type public.interview_item_type as enum ('conceptual', 'technical', 'coding', 'behavioral');
create type public.readiness_status as enum ('not_started', 'in_progress', 'ready');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email text,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  gemini_api_key text,
  reminder_email_enabled boolean not null default false,
  weekly_retrieval_enabled boolean not null default true,
  due_revision_reminders_enabled boolean not null default true,
  missed_review_reminders_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  label text not null default 'DS/ML Class',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  name text not null,
  date_studied date not null,
  bucket public.bucket_status not null default 'R',
  instructor_notes text,
  last_reviewed_at timestamptz,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, name)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  review_number smallint not null check (review_number between 1 and 5),
  due_date date not null,
  status public.review_status not null default 'scheduled',
  mastery_score smallint check (mastery_score between 0 and 5),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, review_number)
);

create table public.revision_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete set null,
  status public.review_status not null,
  mastery_score smallint not null check (mastery_score between 0 and 5),
  notes text,
  attempted_at timestamptz not null default now()
);

create table public.bucket_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  from_bucket public.bucket_status not null,
  to_bucket public.bucket_status not null,
  reason text not null,
  status public.bucket_suggestion_status not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_bucket <> to_bucket)
);

create table public.retrieval_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scheduled_for date not null,
  duration_minutes integer not null default 45 check (duration_minutes > 0),
  status public.retrieval_status not null default 'planned',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.retrieval_session_topics (
  retrieval_session_id uuid not null references public.retrieval_sessions(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  selection_reason text,
  created_at timestamptz not null default now(),
  primary key (retrieval_session_id, topic_id)
);

create table public.retrieval_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  retrieval_session_id uuid references public.retrieval_sessions(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  prompt_type public.prompt_type not null,
  prompt text not null,
  source public.prompt_source not null default 'system',
  created_at timestamptz not null default now()
);

create table public.retrieval_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  retrieval_prompt_id uuid not null references public.retrieval_prompts(id) on delete cascade,
  response text,
  score smallint check (score between 0 and 5),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coding_practice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  prompt text,
  status public.practice_status not null default 'not_started',
  score smallint check (score between 0 and 5),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  name text not null,
  description text,
  github_link text,
  status public.project_status not null default 'not_started',
  started_at date,
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_topics (
  project_id uuid not null references public.projects(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, topic_id)
);

create table public.mastery_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete cascade,
  revision_score numeric(5, 2) not null default 0,
  coding_score numeric(5, 2) not null default 0,
  retrieval_score numeric(5, 2) not null default 0,
  mastery_score numeric(5, 2) not null default 0,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now(),
  check (revision_score between 0 and 100),
  check (coding_score between 0 and 100),
  check (retrieval_score between 0 and 100),
  check (mastery_score between 0 and 100)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  channel public.notification_channel not null default 'email',
  status public.notification_status not null default 'pending',
  subject text,
  body text,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  question text not null,
  answer_notes text,
  item_type public.interview_item_type not null default 'technical',
  difficulty smallint check (difficulty between 1 and 5),
  source public.prompt_source not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  interview_question_id uuid not null references public.interview_questions(id) on delete cascade,
  score smallint check (score between 0 and 5),
  notes text,
  attempted_at timestamptz not null default now()
);

create table public.resume_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  bullet text,
  status public.readiness_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  live_url text,
  repository_url text,
  status public.readiness_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  interview_readiness numeric(5, 2) not null default 0 check (interview_readiness between 0 and 100),
  resume_readiness numeric(5, 2) not null default 0 check (resume_readiness between 0 and 100),
  portfolio_readiness numeric(5, 2) not null default 0 check (portfolio_readiness between 0 and 100),
  placement_readiness numeric(5, 2) not null default 0 check (placement_readiness between 0 and 100),
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create or replace function public.create_default_reviews()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.reviews (user_id, topic_id, review_number, due_date)
  values
    (new.user_id, new.id, 1, new.date_studied + 1),
    (new.user_id, new.id, 2, new.date_studied + 3),
    (new.user_id, new.id, 3, new.date_studied + 7),
    (new.user_id, new.id, 4, new.date_studied + 14),
    (new.user_id, new.id, 5, new.date_studied + 30);

  return new;
end;
$$;

create trigger topics_create_default_reviews
after insert on public.topics
for each row execute function public.create_default_reviews();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_settings (user_id, email)
  values (new.id, new.email);

  insert into public.class_schedule (user_id, weekday, start_time, end_time, label)
  values
    (new.id, 1, '21:00', '23:00', 'DS/ML Class'),
    (new.id, 3, '21:00', '23:00', 'DS/ML Class'),
    (new.id, 5, '21:00', '23:00', 'DS/ML Class');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.log_revision_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('complete', 'partial', 'missed') and new.mastery_score is not null then
    insert into public.revision_attempts (
      user_id,
      topic_id,
      review_id,
      status,
      mastery_score,
      attempted_at
    )
    values (
      new.user_id,
      new.topic_id,
      new.id,
      new.status,
      new.mastery_score,
      coalesce(new.completed_at, now())
    );

    update public.topics
    set last_reviewed_at = coalesce(new.completed_at, now())
    where id = new.topic_id;
  end if;

  return new;
end;
$$;

create trigger reviews_log_revision_attempt
after update of status, mastery_score on public.reviews
for each row
when (old.status is distinct from new.status or old.mastery_score is distinct from new.mastery_score)
execute function public.log_revision_attempt();

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger user_settings_set_updated_at before update on public.user_settings for each row execute function public.set_updated_at();
create trigger class_schedule_set_updated_at before update on public.class_schedule for each row execute function public.set_updated_at();
create trigger modules_set_updated_at before update on public.modules for each row execute function public.set_updated_at();
create trigger topics_set_updated_at before update on public.topics for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews for each row execute function public.set_updated_at();
create trigger bucket_suggestions_set_updated_at before update on public.bucket_suggestions for each row execute function public.set_updated_at();
create trigger retrieval_sessions_set_updated_at before update on public.retrieval_sessions for each row execute function public.set_updated_at();
create trigger retrieval_responses_set_updated_at before update on public.retrieval_responses for each row execute function public.set_updated_at();
create trigger coding_practice_set_updated_at before update on public.coding_practice for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications for each row execute function public.set_updated_at();
create trigger interview_questions_set_updated_at before update on public.interview_questions for each row execute function public.set_updated_at();
create trigger resume_items_set_updated_at before update on public.resume_items for each row execute function public.set_updated_at();
create trigger portfolio_items_set_updated_at before update on public.portfolio_items for each row execute function public.set_updated_at();

create index idx_class_schedule_user_weekday on public.class_schedule(user_id, weekday) where is_active = true;
create index idx_modules_user_archived on public.modules(user_id, is_archived);
create index idx_topics_user_bucket on public.topics(user_id, bucket) where is_archived = false;
create index idx_topics_user_module on public.topics(user_id, module_id) where is_archived = false;
create index idx_reviews_user_due_status on public.reviews(user_id, due_date, status);
create index idx_revision_attempts_user_topic_attempted on public.revision_attempts(user_id, topic_id, attempted_at desc);
create index idx_bucket_suggestions_user_status on public.bucket_suggestions(user_id, status);
create index idx_retrieval_sessions_user_scheduled on public.retrieval_sessions(user_id, scheduled_for);
create index idx_retrieval_prompts_user_session on public.retrieval_prompts(user_id, retrieval_session_id);
create index idx_coding_practice_user_topic on public.coding_practice(user_id, topic_id);
create index idx_projects_user_status on public.projects(user_id, status);
create index idx_mastery_snapshots_user_date on public.mastery_snapshots(user_id, snapshot_date desc);
create index idx_notifications_user_scheduled_status on public.notifications(user_id, scheduled_for, status);
create index idx_interview_questions_user_topic on public.interview_questions(user_id, topic_id);
create index idx_readiness_snapshots_user_date on public.readiness_snapshots(user_id, snapshot_date desc);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.class_schedule enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.reviews enable row level security;
alter table public.revision_attempts enable row level security;
alter table public.bucket_suggestions enable row level security;
alter table public.retrieval_sessions enable row level security;
alter table public.retrieval_session_topics enable row level security;
alter table public.retrieval_prompts enable row level security;
alter table public.retrieval_responses enable row level security;
alter table public.coding_practice enable row level security;
alter table public.projects enable row level security;
alter table public.project_topics enable row level security;
alter table public.mastery_snapshots enable row level security;
alter table public.notifications enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_attempts enable row level security;
alter table public.resume_items enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.readiness_snapshots enable row level security;

create or replace function public.owns_module(module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.modules m
    where m.id = module_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.owns_topic(topic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.topics t
    where t.id = topic_id
      and t.user_id = auth.uid()
  );
$$;

create or replace function public.owns_review(review_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reviews r
    where r.id = review_id
      and r.user_id = auth.uid()
  );
$$;

create or replace function public.owns_retrieval_session(retrieval_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.retrieval_sessions rs
    where rs.id = retrieval_session_id
      and rs.user_id = auth.uid()
  );
$$;

create or replace function public.owns_retrieval_prompt(retrieval_prompt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.retrieval_prompts rp
    where rp.id = retrieval_prompt_id
      and rp.user_id = auth.uid()
  );
$$;

create or replace function public.owns_project(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = auth.uid()
  );
$$;

create or replace function public.owns_interview_question(interview_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.interview_questions iq
    where iq.id = interview_question_id
      and iq.user_id = auth.uid()
  );
$$;

create policy "Users can read own profile" on public.profiles for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Users manage own settings" on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own class schedule" on public.class_schedule for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own modules" on public.modules for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own topics" on public.topics for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_module(module_id));
create policy "Users manage own reviews" on public.reviews for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_topic(topic_id));
create policy "Users manage own revision attempts" on public.revision_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_topic(topic_id) and (review_id is null or public.owns_review(review_id)));
create policy "Users manage own bucket suggestions" on public.bucket_suggestions for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_topic(topic_id));
create policy "Users manage own retrieval sessions" on public.retrieval_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own retrieval prompts" on public.retrieval_prompts for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_topic(topic_id) and (retrieval_session_id is null or public.owns_retrieval_session(retrieval_session_id)));
create policy "Users manage own retrieval responses" on public.retrieval_responses for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_retrieval_prompt(retrieval_prompt_id));
create policy "Users manage own coding practice" on public.coding_practice for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_topic(topic_id));
create policy "Users manage own projects" on public.projects for all using (user_id = auth.uid()) with check (user_id = auth.uid() and (module_id is null or public.owns_module(module_id)));
create policy "Users manage own mastery snapshots" on public.mastery_snapshots for all using (user_id = auth.uid()) with check (user_id = auth.uid() and (module_id is null or public.owns_module(module_id)) and (topic_id is null or public.owns_topic(topic_id)));
create policy "Users manage own notifications" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own interview questions" on public.interview_questions for all using (user_id = auth.uid()) with check (user_id = auth.uid() and (topic_id is null or public.owns_topic(topic_id)));
create policy "Users manage own interview attempts" on public.interview_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.owns_interview_question(interview_question_id));
create policy "Users manage own resume items" on public.resume_items for all using (user_id = auth.uid()) with check (user_id = auth.uid() and (project_id is null or public.owns_project(project_id)));
create policy "Users manage own portfolio items" on public.portfolio_items for all using (user_id = auth.uid()) with check (user_id = auth.uid() and (project_id is null or public.owns_project(project_id)));
create policy "Users manage own readiness snapshots" on public.readiness_snapshots for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage session topics through owned sessions"
on public.retrieval_session_topics
for all
using (
  exists (
    select 1
    from public.retrieval_sessions rs
    where rs.id = retrieval_session_id
      and rs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.retrieval_sessions rs
    join public.topics t on t.id = topic_id
    where rs.id = retrieval_session_id
      and rs.user_id = auth.uid()
      and t.user_id = auth.uid()
  )
);

create policy "Users manage project topics through owned projects"
on public.project_topics
for all
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    join public.topics t on t.id = topic_id
    where p.id = project_id
      and p.user_id = auth.uid()
      and t.user_id = auth.uid()
  )
);

create or replace view public.topic_mastery_latest
with (security_invoker = true) as
select distinct on (ms.user_id, ms.topic_id)
  ms.user_id,
  ms.topic_id,
  ms.module_id,
  ms.revision_score,
  ms.coding_score,
  ms.retrieval_score,
  ms.mastery_score,
  ms.snapshot_date
from public.mastery_snapshots ms
where ms.topic_id is not null
order by ms.user_id, ms.topic_id, ms.snapshot_date desc, ms.created_at desc;

create or replace view public.dashboard_due_reviews
with (security_invoker = true) as
select
  r.id,
  r.user_id,
  r.topic_id,
  t.module_id,
  t.name as topic_name,
  m.name as module_name,
  t.bucket,
  r.review_number,
  r.due_date,
  r.status
from public.reviews r
join public.topics t on t.id = r.topic_id
join public.modules m on m.id = t.module_id
where r.status = 'scheduled'
  and t.is_archived = false
  and m.is_archived = false;
