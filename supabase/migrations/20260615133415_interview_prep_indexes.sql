create index idx_interview_topics_learning_topic
on public.interview_topics(learning_topic_id);

create index idx_interview_sessions_module
on public.interview_sessions(module_id);

create index idx_interview_revision_notes_module
on public.interview_revision_notes(module_id);

create index idx_interview_revision_notes_topic
on public.interview_revision_notes(topic_id);
