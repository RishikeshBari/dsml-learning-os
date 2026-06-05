-- Harden RLS policies and add FK indexes surfaced by Supabase advisors.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.create_default_reviews() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_revision_attempt() from public, anon, authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users manage own settings" on public.user_settings;
drop policy if exists "Users manage own class schedule" on public.class_schedule;
drop policy if exists "Users manage own modules" on public.modules;
drop policy if exists "Users manage own topics" on public.topics;
drop policy if exists "Users manage own reviews" on public.reviews;
drop policy if exists "Users manage own revision attempts" on public.revision_attempts;
drop policy if exists "Users manage own bucket suggestions" on public.bucket_suggestions;
drop policy if exists "Users manage own retrieval sessions" on public.retrieval_sessions;
drop policy if exists "Users manage own retrieval prompts" on public.retrieval_prompts;
drop policy if exists "Users manage own retrieval responses" on public.retrieval_responses;
drop policy if exists "Users manage own coding practice" on public.coding_practice;
drop policy if exists "Users manage own projects" on public.projects;
drop policy if exists "Users manage own mastery snapshots" on public.mastery_snapshots;
drop policy if exists "Users manage own notifications" on public.notifications;
drop policy if exists "Users manage own interview questions" on public.interview_questions;
drop policy if exists "Users manage own interview attempts" on public.interview_attempts;
drop policy if exists "Users manage own resume items" on public.resume_items;
drop policy if exists "Users manage own portfolio items" on public.portfolio_items;
drop policy if exists "Users manage own readiness snapshots" on public.readiness_snapshots;
drop policy if exists "Users manage session topics through owned sessions" on public.retrieval_session_topics;
drop policy if exists "Users manage project topics through owned projects" on public.project_topics;

drop function if exists public.owns_interview_question(uuid);
drop function if exists public.owns_module(uuid);
drop function if exists public.owns_project(uuid);
drop function if exists public.owns_retrieval_prompt(uuid);
drop function if exists public.owns_retrieval_session(uuid);
drop function if exists public.owns_review(uuid);
drop function if exists public.owns_topic(uuid);

create policy "Users can read own profile"
on public.profiles
for select
using (id = (select auth.uid()));

create policy "Users can update own profile"
on public.profiles
for update
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users manage own settings"
on public.user_settings
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users manage own class schedule"
on public.class_schedule
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users manage own modules"
on public.modules
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users manage own topics"
on public.topics
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.modules m
    where m.id = module_id
      and m.user_id = (select auth.uid())
  )
);

create policy "Users manage own reviews"
on public.reviews
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.topics t
    where t.id = topic_id
      and t.user_id = (select auth.uid())
  )
);

create policy "Users manage own revision attempts"
on public.revision_attempts
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.topics t
    where t.id = topic_id
      and t.user_id = (select auth.uid())
  )
  and (
    review_id is null
    or exists (
      select 1
      from public.reviews r
      where r.id = review_id
        and r.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own bucket suggestions"
on public.bucket_suggestions
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.topics t
    where t.id = topic_id
      and t.user_id = (select auth.uid())
  )
);

create policy "Users manage own retrieval sessions"
on public.retrieval_sessions
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users manage own retrieval prompts"
on public.retrieval_prompts
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.topics t
    where t.id = topic_id
      and t.user_id = (select auth.uid())
  )
  and (
    retrieval_session_id is null
    or exists (
      select 1
      from public.retrieval_sessions rs
      where rs.id = retrieval_session_id
        and rs.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own retrieval responses"
on public.retrieval_responses
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.retrieval_prompts rp
    where rp.id = retrieval_prompt_id
      and rp.user_id = (select auth.uid())
  )
);

create policy "Users manage own coding practice"
on public.coding_practice
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.topics t
    where t.id = topic_id
      and t.user_id = (select auth.uid())
  )
);

create policy "Users manage own projects"
on public.projects
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    module_id is null
    or exists (
      select 1
      from public.modules m
      where m.id = module_id
        and m.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own mastery snapshots"
on public.mastery_snapshots
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    module_id is null
    or exists (
      select 1
      from public.modules m
      where m.id = module_id
        and m.user_id = (select auth.uid())
    )
  )
  and (
    topic_id is null
    or exists (
      select 1
      from public.topics t
      where t.id = topic_id
        and t.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own notifications"
on public.notifications
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

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

create policy "Users manage own resume items"
on public.resume_items
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own portfolio items"
on public.portfolio_items
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    project_id is null
    or exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.user_id = (select auth.uid())
    )
  )
);

create policy "Users manage own readiness snapshots"
on public.readiness_snapshots
for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users manage session topics through owned sessions"
on public.retrieval_session_topics
for all
using (
  exists (
    select 1
    from public.retrieval_sessions rs
    where rs.id = retrieval_session_id
      and rs.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.retrieval_sessions rs
    join public.topics t on t.id = topic_id
    where rs.id = retrieval_session_id
      and rs.user_id = (select auth.uid())
      and t.user_id = (select auth.uid())
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
      and p.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    join public.topics t on t.id = topic_id
    where p.id = project_id
      and p.user_id = (select auth.uid())
      and t.user_id = (select auth.uid())
  )
);

create index if not exists idx_bucket_suggestions_topic_id on public.bucket_suggestions(topic_id);
create index if not exists idx_coding_practice_topic_id on public.coding_practice(topic_id);
create index if not exists idx_interview_attempts_question_id on public.interview_attempts(interview_question_id);
create index if not exists idx_interview_attempts_user_id on public.interview_attempts(user_id);
create index if not exists idx_interview_questions_topic_id on public.interview_questions(topic_id);
create index if not exists idx_mastery_snapshots_module_id on public.mastery_snapshots(module_id);
create index if not exists idx_mastery_snapshots_topic_id on public.mastery_snapshots(topic_id);
create index if not exists idx_portfolio_items_project_id on public.portfolio_items(project_id);
create index if not exists idx_portfolio_items_user_id on public.portfolio_items(user_id);
create index if not exists idx_project_topics_topic_id on public.project_topics(topic_id);
create index if not exists idx_projects_module_id on public.projects(module_id);
create index if not exists idx_resume_items_project_id on public.resume_items(project_id);
create index if not exists idx_resume_items_user_id on public.resume_items(user_id);
create index if not exists idx_retrieval_prompts_session_id on public.retrieval_prompts(retrieval_session_id);
create index if not exists idx_retrieval_prompts_topic_id on public.retrieval_prompts(topic_id);
create index if not exists idx_retrieval_responses_prompt_id on public.retrieval_responses(retrieval_prompt_id);
create index if not exists idx_retrieval_responses_user_id on public.retrieval_responses(user_id);
create index if not exists idx_retrieval_session_topics_topic_id on public.retrieval_session_topics(topic_id);
create index if not exists idx_revision_attempts_review_id on public.revision_attempts(review_id);
create index if not exists idx_revision_attempts_topic_id on public.revision_attempts(topic_id);

