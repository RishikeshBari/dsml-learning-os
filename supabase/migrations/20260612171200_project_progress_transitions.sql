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
      when v_total > 0
        and v_completed < v_total
        and status = 'completed'
        then 'in_progress'
      else status
    end,
    completed_at = case
      when v_total > 0 and v_completed = v_total
        then coalesce(completed_at, current_date)
      when v_total > 0
        and v_completed < v_total
        and status = 'completed'
        then null
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

create or replace function private.snapshot_manual_project_progress()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if old.progress_percentage is distinct from new.progress_percentage
    and not exists (
      select 1
      from public.project_phases pp
      where pp.project_id = new.id
    )
  then
    insert into public.project_progress_snapshots (
      project_id,
      user_id,
      progress_percentage,
      source
    )
    values (
      new.id,
      new.user_id,
      new.progress_percentage,
      'manual'
    );
  end if;

  return new;
end;
$$;

create trigger projects_snapshot_manual_progress
after update of status on public.projects
for each row execute function private.snapshot_manual_project_progress();

revoke all on function private.snapshot_manual_project_progress()
from public, anon, authenticated;
