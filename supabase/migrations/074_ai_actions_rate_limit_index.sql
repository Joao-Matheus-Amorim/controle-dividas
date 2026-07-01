-- Index used by the AI action rate limiter.
-- Query shape: created_by = profile_id and created_at >= now() - 1 minute.
create index if not exists idx_ai_actions_created_by_created_at
on public.ai_actions (created_by, created_at desc);
