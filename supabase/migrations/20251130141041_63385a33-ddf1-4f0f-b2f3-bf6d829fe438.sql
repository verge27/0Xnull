-- Add USD price column to listings table (stored in localStorage for now)
-- Create exchange rates table to store XMR/USD rate
create table public.exchange_rates (
  id uuid not null default gen_random_uuid() primary key,
  currency_pair text not null unique,
  rate numeric not null,
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.exchange_rates enable row level security;

-- Everyone can read exchange rates
create policy "Exchange rates are viewable by everyone" 
on public.exchange_rates 
for select 
using (true);

-- Only system can update rates (via edge function with service role)
create policy "System can update exchange rates" 
on public.exchange_rates 
for all
using (false);

-- Insert initial XMR/USD rate (will be updated by cron job)
insert into public.exchange_rates (currency_pair, rate)
values ('XMR/USD', 150.00);

-- Enable pg_cron extension for scheduled tasks
create extension if not exists pg_cron with schema extensions;

-- Enable pg_net extension for HTTP requests
create extension if not exists pg_net with schema extensions;