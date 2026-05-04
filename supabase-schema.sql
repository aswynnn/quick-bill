-- ══════════════════════════════════════════════════════════
-- Invoice Studio — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILE ──────────────────────────────────────────────────
-- One profile row per user (using a simple single-user setup;
-- extend with auth.uid() if you add Supabase Auth later)
create table if not exists profile (
  id          uuid primary key default uuid_generate_v4(),
  company     text,
  name        text,
  gstin       text,
  prefix      text default 'INV-',
  email       text,
  phone       text,
  address     text,
  city        text,
  state       text,
  pay_name    text,
  bank        text,
  acc         text,
  ifsc        text,
  upi         text,
  currency    text default 'INR|Rs.',
  tax         numeric default 0,
  sgst        numeric default 6,
  cgst        numeric default 6,
  notes       text,
  terms       text,
  logo_url    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── CLIENTS ──────────────────────────────────────────────────
create table if not exists clients (
  id          uuid primary key default uuid_generate_v4(),
  company     text,
  name        text,
  email       text,
  phone       text,
  address     text,
  city        text,
  state       text,
  gstin       text,
  color       int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── INVOICES ─────────────────────────────────────────────────
create table if not exists invoices (
  id           uuid primary key default uuid_generate_v4(),
  num          text,
  type         text default 'Invoice',
  date         date,
  due          date,
  client_id    uuid references clients(id) on delete set null,
  client_name  text,
  items        jsonb default '[]',
  sgst         numeric default 0,
  cgst         numeric default 0,
  cess         numeric default 0,
  sub          numeric default 0,
  total        numeric default 0,
  status       text default 'draft' check (status in ('draft','pending','paid')),
  notes        text,
  terms        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profile_updated_at  before update on profile  for each row execute function set_updated_at();
create trigger clients_updated_at  before update on clients  for each row execute function set_updated_at();
create trigger invoices_updated_at before update on invoices for each row execute function set_updated_at();

-- ── ROW LEVEL SECURITY (optional, disable for single-user) ───
-- If you're using Supabase Auth, uncomment and customize these:
-- alter table profile  enable row level security;
-- alter table clients  enable row level security;
-- alter table invoices enable row level security;

-- ── STORAGE BUCKET FOR LOGOS ──────────────────────────────────
-- Create a public bucket named "logos" in Storage → New Bucket
-- Or run:
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict do nothing;

-- Allow public read + authenticated upload
create policy "Public logo read"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Authenticated logo upload"
  on storage.objects for insert
  with check (bucket_id = 'logos');

create policy "Authenticated logo update"
  on storage.objects for update
  using (bucket_id = 'logos');

create policy "Authenticated logo delete"
  on storage.objects for delete
  using (bucket_id = 'logos');
