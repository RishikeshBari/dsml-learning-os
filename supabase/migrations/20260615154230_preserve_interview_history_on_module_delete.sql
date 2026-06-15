alter table public.interview_modules
  drop constraint interview_modules_learning_module_id_fkey,
  add constraint interview_modules_learning_module_id_fkey
    foreign key (learning_module_id)
    references public.modules(id)
    on delete set null;
