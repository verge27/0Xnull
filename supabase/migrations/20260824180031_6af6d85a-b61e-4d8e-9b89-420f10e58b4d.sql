create table public.sources (
  id text primary key,
  name text not null,
  url text not null,
  kind text not null check (kind in ('postings','directory')),
  escrow boolean not null default false,
  enabled boolean not null default true,
  last_ok_at timestamptz,
  last_error text
);

create table public.jobs (
  id text primary key,
  source_id text not null references public.sources(id),
  external_id text not null,
  title text not null,
  body text not null default '',
  url text not null,
  pay_xmr numeric,
  pay_type text not null default 'unknown' check (pay_type in ('hourly','fixed','unknown')),
  tags text[] not null default '{}',
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  dedupe_key text not null,
  hidden boolean not null default false,
  hidden_reason text,
  unique (source_id, external_id)
);
create index jobs_posted_at_idx on public.jobs (posted_at desc nulls last);
create index jobs_dedupe_key_idx on public.jobs (dedupe_key);
create index jobs_tags_idx on public.jobs using gin (tags);

create table public.blocklist (
  pattern text primary key,
  is_regex boolean not null default false,
  reason text
);

create table public.fetch_runs (
  id bigserial primary key,
  source_id text references public.sources(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched int default 0,
  inserted int default 0,
  updated int default 0,
  blocked int default 0,
  error text
);

grant select on public.sources to anon, authenticated;
grant select on public.jobs to anon, authenticated;
grant all on public.sources to service_role;
grant all on public.jobs to service_role;
grant all on public.blocklist to service_role;
grant all on public.fetch_runs to service_role;
grant usage, select on sequence public.fetch_runs_id_seq to service_role;

alter table public.sources enable row level security;
alter table public.jobs enable row level security;
alter table public.blocklist enable row level security;
alter table public.fetch_runs enable row level security;

create policy "Sources are publicly readable"
  on public.sources for select
  to anon, authenticated
  using (true);

create policy "Visible jobs are publicly readable"
  on public.jobs for select
  to anon, authenticated
  using (hidden = false);

insert into public.sources (id, name, url, kind, escrow) values
  ('tg-monerojobs', 'Monero Jobs (Telegram)', 'https://t.me/MoneroJobs', 'postings', false),
  ('monerojobs-com', 'MoneroJobs.com', 'https://www.monerojobs.com/', 'postings', false),
  ('monero-jobs', 'Monero.Jobs', 'https://monero.jobs/', 'postings', true),
  ('freelanceforcoins', 'FreelanceForCoins', 'https://freelanceforcoins.com/freelancers-for/monero', 'directory', false),
  ('monerica-freelancers', 'Monerica freelancers', 'https://monerica.com/freelancers', 'directory', false),
  ('monerica-jobs', 'Monerica jobs', 'https://monerica.com/jobs', 'directory', false);

insert into public.blocklist (pattern, is_regex, reason) values
  ('money mule', false, 'financial crime pattern'),
  ('receive funds on my behalf', false, 'financial crime pattern'),
  ('cash out for me', false, 'financial crime pattern'),
  ('use your bank account', false, 'financial crime pattern'),
  ('verify accounts with your id', false, 'financial crime pattern'),
  ('pass kyc for me', false, 'financial crime pattern'),
  ('open accounts under your name', false, 'financial crime pattern'),
  ('drop address', false, 'financial crime pattern'),
  ('reship', false, 'financial crime pattern'),
  ('carding', false, 'financial crime pattern'),
  ('fullz', false, 'financial crime pattern'),
  ('cvv', false, 'financial crime pattern'),
  ('escort', false, 'financial crime pattern'),
  ('ddos for hire', false, 'financial crime pattern'),
  ('stresser', false, 'financial crime pattern');