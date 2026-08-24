revoke all on public.blocklist from anon, authenticated;
revoke all on public.fetch_runs from anon, authenticated;
revoke insert, update, delete, truncate, references on public.jobs from anon, authenticated;
revoke insert, update, delete, truncate, references on public.sources from anon, authenticated;
grant select on public.jobs to anon, authenticated;
grant select on public.sources to anon, authenticated;