create index idx_project_work_logs_phase
on public.project_work_logs(phase_id)
where phase_id is not null;

create index idx_project_progress_snapshots_user
on public.project_progress_snapshots(user_id);
