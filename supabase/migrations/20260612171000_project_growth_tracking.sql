create type public.project_phase_status as enum (
  'not_started',
  'in_progress',
  'completed'
);

create type public.project_phase_priority as enum (
  'low',
  'medium',
  'high'
);

alter table public.projects
  add column progress_percentage smallint not null default 0
    check (progress_percentage between 0 and 100),
  add column demo_url text,
  add column next_action text,
  add column notes text,
  add column notes_updated_at timestamptz,
  add column last_worked_on date;

update public.projects
set progress_percentage = case status
  when 'completed' then 100
  when 'in_progress' then 50
  else 0
end;

create table public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status public.project_phase_status not null default 'not_started',
  priority public.project_phase_priority not null default 'medium',
  order_index integer not null default 0 check (order_index >= 0),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_work_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,
  time_spent_minutes integer not null
    check (time_spent_minutes > 0 and time_spent_minutes <= 10080),
  work_summary text not null check (char_length(trim(work_summary)) > 0),
  blockers text,
  next_step text,
  progress_snapshot smallint not null default 0
    check (progress_snapshot between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  progress_percentage smallint not null
    check (progress_percentage between 0 and 100),
  source text not null
    check (source in ('phase', 'work_log', 'manual', 'migration')),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.project_progress_snapshots (
  project_id,
  user_id,
  progress_percentage,
  source,
  recorded_at
)
select
  id,
  user_id,
  progress_percentage,
  'migration',
  created_at
from public.projects;

create index idx_project_phases_project_order
on public.project_phases(project_id, order_index, created_at);

create index idx_project_phases_user_status
on public.project_phases(user_id, status);

create index idx_project_work_logs_project_date
on public.project_work_logs(project_id, log_date desc, created_at desc);

create index idx_project_work_logs_user_date
on public.project_work_logs(user_id, log_date desc);

create index idx_project_progress_snapshots_project_recorded
on public.project_progress_snapshots(project_id, recorded_at);

create index idx_projects_user_last_worked
on public.projects(user_id, last_worked_on desc nulls last);

alter table public.project_phases enable row level security;
alter table public.project_work_logs enable row level security;
alter table public.project_progress_snapshots enable row level security;

create policy "Users view own project phases"
on public.project_phases
for select
using (user_id = (select auth.uid()));

create policy "Users create phases for own projects"
on public.project_phases
for insert
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

create policy "Users update own project phases"
on public.project_phases
for update
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
);

create policy "Users delete own project phases"
on public.project_phases
for delete
using (user_id = (select auth.uid()));

create policy "Users view own project work logs"
on public.project_work_logs
for select
using (user_id = (select auth.uid()));

create policy "Users create logs for own projects"
on public.project_work_logs
for insert
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
  and (
    phase_id is null
    or exists (
      select 1
      from public.project_phases pp
      where pp.id = phase_id
        and pp.project_id = project_id
        and pp.user_id = (select auth.uid())
    )
  )
);

create policy "Users update own project work logs"
on public.project_work_logs
for update
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.user_id = (select auth.uid())
  )
  and (
    phase_id is null
    or exists (
      select 1
      from public.project_phases pp
      where pp.id = phase_id
        and pp.project_id = project_id
        and pp.user_id = (select auth.uid())
    )
  )
);

create policy "Users delete own project work logs"
on public.project_work_logs
for delete
using (user_id = (select auth.uid()));

create policy "Users view own project progress snapshots"
on public.project_progress_snapshots
for select
using (user_id = (select auth.uid()));

grant select, insert, update, delete
on public.project_phases, public.project_work_logs
to authenticated;

grant select
on public.project_progress_snapshots
to authenticated;

grant usage
on type public.project_phase_status, public.project_phase_priority
to authenticated;

create trigger project_phases_set_updated_at
before update on public.project_phases
for each row execute function public.set_updated_at();

create trigger project_work_logs_set_updated_at
before update on public.project_work_logs
for each row execute function public.set_updated_at();

create or replace function private.project_manual_progress(
  p_status public.project_status
)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'completed' then 100
    when 'deployed' then 90
    when 'testing' then 80
    when 'blocked' then 50
    when 'in_progress' then 50
    when 'planning' then 20
    else 0
  end::smallint;
$$;

create or replace function private.set_project_manual_progress()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.project_phases pp
    where pp.project_id = new.id
  ) then
    new.progress_percentage := private.project_manual_progress(new.status);
  end if;

  if new.status = 'completed' then
    new.completed_at := coalesce(new.completed_at, current_date);
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    new.completed_at := null;
  end if;

  if new.status in (
    'planning',
    'in_progress',
    'blocked',
    'testing',
    'deployed',
    'completed'
  ) then
    new.started_at := coalesce(new.started_at, current_date);
  end if;

  return new;
end;
$$;

create trigger projects_set_manual_progress
before insert or update of status on public.projects
for each row execute function private.set_project_manual_progress();

create or replace function private.recalculate_project_progress(
  p_project_id uuid,
  p_source text default 'phase'
)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_completed integer;
  v_previous smallint;
  v_progress smallint;
  v_total integer;
  v_user_id uuid;
begin
  select p.user_id, p.progress_percentage
  into v_user_id, v_previous
  from public.projects p
  where p.id = p_project_id;

  if v_user_id is null then
    return;
  end if;

  select
    count(*),
    count(*) filter (where pp.status = 'completed')
  into v_total, v_completed
  from public.project_phases pp
  where pp.project_id = p_project_id;

  if v_total = 0 then
    select private.project_manual_progress(p.status)
    into v_progress
    from public.projects p
    where p.id = p_project_id;
  else
    v_progress := round((v_completed::numeric / v_total) * 100)::smallint;
  end if;

  update public.projects
  set
    progress_percentage = v_progress,
    status = case
      when v_total > 0 and v_completed = v_total then 'completed'
      else status
    end,
    completed_at = case
      when v_total > 0 and v_completed = v_total
        then coalesce(completed_at, current_date)
      else completed_at
    end
  where id = p_project_id;

  if v_previous is distinct from v_progress then
    insert into public.project_progress_snapshots (
      project_id,
      user_id,
      progress_percentage,
      source
    )
    values (
      p_project_id,
      v_user_id,
      v_progress,
      p_source
    );
  end if;
end;
$$;

create or replace function private.refresh_project_from_phase()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform private.recalculate_project_progress(old.project_id, 'phase');
    return old;
  end if;

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform private.recalculate_project_progress(old.project_id, 'phase');
  end if;

  perform private.recalculate_project_progress(new.project_id, 'phase');
  return new;
end;
$$;

create trigger project_phases_refresh_project
after insert or update or delete on public.project_phases
for each row execute function private.refresh_project_from_phase();

create or replace function private.prepare_project_work_log()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  select p.progress_percentage
  into new.progress_snapshot
  from public.projects p
  where p.id = new.project_id;

  return new;
end;
$$;

create trigger project_work_logs_prepare
before insert or update of project_id on public.project_work_logs
for each row execute function private.prepare_project_work_log();

create or replace function private.refresh_project_from_work_log()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_project_id uuid;
  v_user_id uuid;
  v_progress smallint;
begin
  v_project_id := case when tg_op = 'DELETE' then old.project_id else new.project_id end;

  update public.projects p
  set last_worked_on = (
    select max(pwl.log_date)
    from public.project_work_logs pwl
    where pwl.project_id = v_project_id
  )
  where p.id = v_project_id;

  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    update public.projects p
    set last_worked_on = (
      select max(pwl.log_date)
      from public.project_work_logs pwl
      where pwl.project_id = old.project_id
    )
    where p.id = old.project_id;
  end if;

  if tg_op <> 'DELETE' then
    select p.user_id, p.progress_percentage
    into v_user_id, v_progress
    from public.projects p
    where p.id = new.project_id;

    insert into public.project_progress_snapshots (
      project_id,
      user_id,
      progress_percentage,
      source
    )
    values (
      new.project_id,
      v_user_id,
      v_progress,
      'work_log'
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger project_work_logs_refresh_project
after insert or update or delete on public.project_work_logs
for each row execute function private.refresh_project_from_work_log();

revoke all on function private.project_manual_progress(public.project_status)
from public, anon, authenticated;

revoke all on function private.set_project_manual_progress()
from public, anon, authenticated;

revoke all on function private.recalculate_project_progress(uuid, text)
from public, anon, authenticated;

revoke all on function private.refresh_project_from_phase()
from public, anon, authenticated;

revoke all on function private.prepare_project_work_log()
from public, anon, authenticated;

revoke all on function private.refresh_project_from_work_log()
from public, anon, authenticated;
