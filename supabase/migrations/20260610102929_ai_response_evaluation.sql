alter table public.retrieval_responses
  add column ai_score smallint check (ai_score between 0 and 5),
  add column ai_is_correct boolean,
  add column ai_feedback text,
  add column ai_what_was_good text[],
  add column ai_what_was_missing text[],
  add column ai_corrected_answer text,
  add column ai_confidence text
    check (ai_confidence in ('low', 'medium', 'high')),
  add column ai_next_action text
    check (
      ai_next_action in (
        'revise_again',
        'practice_coding',
        'move_forward',
        'mark_for_sunday_retrieval'
      )
    ),
  add column ai_bucket_suggestion public.bucket_status,
  add column ai_bucket_reason text,
  add column evaluated_at timestamptz,
  add column score_overridden boolean not null default false;

create unique index if not exists idx_retrieval_responses_prompt_unique
on public.retrieval_responses(retrieval_prompt_id);

create unique index if not exists idx_mastery_snapshots_scope_date_unique
on public.mastery_snapshots(user_id, module_id, topic_id, snapshot_date)
nulls not distinct;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.refresh_mastery_for_topic(
  p_user_id uuid,
  p_topic_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_module_id uuid;
  v_revision_score numeric(5, 2);
  v_coding_score numeric(5, 2);
  v_retrieval_score numeric(5, 2);
  v_mastery_score numeric(5, 2);
  v_module_revision numeric(5, 2);
  v_module_coding numeric(5, 2);
  v_module_retrieval numeric(5, 2);
  v_module_mastery numeric(5, 2);
  v_overall_revision numeric(5, 2);
  v_overall_coding numeric(5, 2);
  v_overall_retrieval numeric(5, 2);
  v_overall_mastery numeric(5, 2);
begin
  select t.module_id
  into v_module_id
  from public.topics t
  where t.id = p_topic_id
    and t.user_id = p_user_id;

  if v_module_id is null then
    return;
  end if;

  select coalesce(avg(ra.mastery_score) * 20, 0)
  into v_revision_score
  from public.revision_attempts ra
  where ra.user_id = p_user_id
    and ra.topic_id = p_topic_id;

  select coalesce(avg(cp.score) * 20, 0)
  into v_coding_score
  from public.coding_practice cp
  where cp.user_id = p_user_id
    and cp.topic_id = p_topic_id
    and cp.score is not null;

  select coalesce(
    avg(
      case
        when rr.score_overridden and rr.score is not null then rr.score
        else coalesce(rr.ai_score, rr.score)
      end
    ) * 20,
    0
  )
  into v_retrieval_score
  from public.retrieval_responses rr
  join public.retrieval_prompts rp
    on rp.id = rr.retrieval_prompt_id
  where rr.user_id = p_user_id
    and rp.topic_id = p_topic_id
    and coalesce(rr.ai_score, rr.score) is not null;

  v_mastery_score :=
    (v_revision_score * 0.40)
    + (v_coding_score * 0.40)
    + (v_retrieval_score * 0.20);

  insert into public.mastery_snapshots (
    user_id,
    module_id,
    topic_id,
    revision_score,
    coding_score,
    retrieval_score,
    mastery_score,
    snapshot_date
  )
  values (
    p_user_id,
    v_module_id,
    p_topic_id,
    round(v_revision_score, 2),
    round(v_coding_score, 2),
    round(v_retrieval_score, 2),
    round(v_mastery_score, 2),
    current_date
  )
  on conflict (user_id, module_id, topic_id, snapshot_date)
  do update set
    revision_score = excluded.revision_score,
    coding_score = excluded.coding_score,
    retrieval_score = excluded.retrieval_score,
    mastery_score = excluded.mastery_score,
    created_at = now();

  select
    coalesce(avg(latest.revision_score), 0),
    coalesce(avg(latest.coding_score), 0),
    coalesce(avg(latest.retrieval_score), 0),
    coalesce(avg(latest.mastery_score), 0)
  into
    v_module_revision,
    v_module_coding,
    v_module_retrieval,
    v_module_mastery
  from (
    select distinct on (ms.topic_id)
      ms.revision_score,
      ms.coding_score,
      ms.retrieval_score,
      ms.mastery_score,
      ms.topic_id
    from public.mastery_snapshots ms
    join public.topics t on t.id = ms.topic_id
    where ms.user_id = p_user_id
      and ms.module_id = v_module_id
      and ms.topic_id is not null
      and t.is_archived = false
    order by ms.topic_id, ms.snapshot_date desc, ms.created_at desc
  ) latest;

  insert into public.mastery_snapshots (
    user_id,
    module_id,
    topic_id,
    revision_score,
    coding_score,
    retrieval_score,
    mastery_score,
    snapshot_date
  )
  values (
    p_user_id,
    v_module_id,
    null,
    round(v_module_revision, 2),
    round(v_module_coding, 2),
    round(v_module_retrieval, 2),
    round(v_module_mastery, 2),
    current_date
  )
  on conflict (user_id, module_id, topic_id, snapshot_date)
  do update set
    revision_score = excluded.revision_score,
    coding_score = excluded.coding_score,
    retrieval_score = excluded.retrieval_score,
    mastery_score = excluded.mastery_score,
    created_at = now();

  select
    coalesce(avg(latest.revision_score), 0),
    coalesce(avg(latest.coding_score), 0),
    coalesce(avg(latest.retrieval_score), 0),
    coalesce(avg(latest.mastery_score), 0)
  into
    v_overall_revision,
    v_overall_coding,
    v_overall_retrieval,
    v_overall_mastery
  from (
    select distinct on (ms.topic_id)
      ms.revision_score,
      ms.coding_score,
      ms.retrieval_score,
      ms.mastery_score,
      ms.topic_id
    from public.mastery_snapshots ms
    join public.topics t on t.id = ms.topic_id
    where ms.user_id = p_user_id
      and ms.topic_id is not null
      and t.is_archived = false
    order by ms.topic_id, ms.snapshot_date desc, ms.created_at desc
  ) latest;

  insert into public.mastery_snapshots (
    user_id,
    module_id,
    topic_id,
    revision_score,
    coding_score,
    retrieval_score,
    mastery_score,
    snapshot_date
  )
  values (
    p_user_id,
    null,
    null,
    round(v_overall_revision, 2),
    round(v_overall_coding, 2),
    round(v_overall_retrieval, 2),
    round(v_overall_mastery, 2),
    current_date
  )
  on conflict (user_id, module_id, topic_id, snapshot_date)
  do update set
    revision_score = excluded.revision_score,
    coding_score = excluded.coding_score,
    retrieval_score = excluded.retrieval_score,
    mastery_score = excluded.mastery_score,
    created_at = now();
end;
$$;

create or replace function private.refresh_mastery_from_revision_attempt()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_mastery_for_topic(old.user_id, old.topic_id);
    return old;
  end if;

  perform private.refresh_mastery_for_topic(new.user_id, new.topic_id);
  return new;
end;
$$;

create or replace function private.refresh_mastery_from_coding_practice()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_mastery_for_topic(old.user_id, old.topic_id);
    return old;
  end if;

  perform private.refresh_mastery_for_topic(new.user_id, new.topic_id);
  return new;
end;
$$;

create or replace function private.refresh_mastery_from_retrieval_response()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid;
  v_topic_id uuid;
begin
  if tg_op = 'DELETE' then
    select rp.user_id, rp.topic_id
    into v_user_id, v_topic_id
    from public.retrieval_prompts rp
    where rp.id = old.retrieval_prompt_id;
  else
    select rp.user_id, rp.topic_id
    into v_user_id, v_topic_id
    from public.retrieval_prompts rp
    where rp.id = new.retrieval_prompt_id;
  end if;

  if v_user_id is not null and v_topic_id is not null then
    perform private.refresh_mastery_for_topic(v_user_id, v_topic_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists revision_attempts_refresh_mastery
on public.revision_attempts;
create trigger revision_attempts_refresh_mastery
after insert or update or delete
on public.revision_attempts
for each row execute function private.refresh_mastery_from_revision_attempt();

drop trigger if exists coding_practice_refresh_mastery
on public.coding_practice;
create trigger coding_practice_refresh_mastery
after insert or update or delete
on public.coding_practice
for each row execute function private.refresh_mastery_from_coding_practice();

drop trigger if exists retrieval_responses_refresh_mastery
on public.retrieval_responses;
create trigger retrieval_responses_refresh_mastery
after insert or update or delete
on public.retrieval_responses
for each row execute function private.refresh_mastery_from_retrieval_response();

do $$
declare
  topic_record record;
begin
  for topic_record in
    select distinct activity.user_id, activity.topic_id
    from (
      select ra.user_id, ra.topic_id
      from public.revision_attempts ra
      union
      select cp.user_id, cp.topic_id
      from public.coding_practice cp
      union
      select rr.user_id, rp.topic_id
      from public.retrieval_responses rr
      join public.retrieval_prompts rp
        on rp.id = rr.retrieval_prompt_id
    ) activity
  loop
    perform private.refresh_mastery_for_topic(
      topic_record.user_id,
      topic_record.topic_id
    );
  end loop;
end;
$$;
