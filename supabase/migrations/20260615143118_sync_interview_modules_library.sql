alter table public.interview_modules
  add column learning_module_id uuid
    references public.modules(id) on delete cascade;

with module_matches as (
  select
    im.id as interview_module_id,
    m.id as learning_module_id,
    row_number() over (
      partition by im.id
      order by m.sort_order, m.created_at, m.id
    ) as match_order
  from public.interview_modules im
  join public.modules m
    on m.user_id = im.user_id
    and lower(trim(m.name)) = lower(trim(im.name))
)
update public.interview_modules im
set learning_module_id = module_matches.learning_module_id
from module_matches
where im.id = module_matches.interview_module_id
  and module_matches.match_order = 1
  and im.learning_module_id is null;

create unique index idx_interview_modules_learning_module
on public.interview_modules(user_id, learning_module_id)
where learning_module_id is not null;

create index idx_interview_modules_learning_module_fk
on public.interview_modules(learning_module_id)
where learning_module_id is not null;

drop policy if exists "Users manage own interview modules"
on public.interview_modules;

create policy "Users manage own interview modules"
on public.interview_modules
for all
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    learning_module_id is null
    or exists (
      select 1
      from public.modules m
      where m.id = learning_module_id
        and m.user_id = (select auth.uid())
    )
  )
);
