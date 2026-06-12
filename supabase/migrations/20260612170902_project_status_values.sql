alter type public.project_status add value if not exists 'idea';
alter type public.project_status add value if not exists 'planning';
alter type public.project_status add value if not exists 'blocked';
alter type public.project_status add value if not exists 'testing';
alter type public.project_status add value if not exists 'deployed';
alter type public.project_status add value if not exists 'archived';
