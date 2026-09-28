-- ============================================================
-- Time Sheet feature — run this once in the Supabase SQL Editor
-- for project "maskell-site-joint-layup" (ref uyodnkuqxhirudgtetmy).
-- Safe to run top-to-bottom in one go.
-- ============================================================

create table if not exists public.site_timesheets (
  id uuid primary key default uuid_generate_v4(),
  submission_id text not null unique,
  idempotency_key text not null unique,

  laminator_id uuid references public.authorised_personnel(id),
  laminator_name text not null,

  job_number text not null,
  client text,
  description text not null,

  work_date date not null,
  start_time text not null,
  end_time text not null,
  total_hours numeric(5,2) not null,

  emailed_at timestamptz,

  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now()
);

create index if not exists idx_timesheets_job_number on public.site_timesheets(job_number);
create index if not exists idx_timesheets_work_date on public.site_timesheets(work_date desc);

alter table public.site_timesheets enable row level security;

drop policy if exists "timesheets_public_insert" on public.site_timesheets;
create policy "timesheets_public_insert" on public.site_timesheets for insert with check (true);

drop policy if exists "timesheets_admin_select" on public.site_timesheets;
create policy "timesheets_admin_select" on public.site_timesheets for select using (is_admin());

drop policy if exists "timesheets_admin_update" on public.site_timesheets;
create policy "timesheets_admin_update" on public.site_timesheets for update using (is_admin());

-- Extend the recipient categories to include timesheet notifications
alter table public.notification_settings drop constraint if exists notification_settings_category_check;
alter table public.notification_settings add constraint notification_settings_category_check
  check (category in ('qa','production','other','timesheet'));

-- So timesheets start reaching you immediately without extra setup
insert into public.notification_settings (email, category)
  values ('praveen@maskell.co.nz', 'timesheet')
  on conflict (email, category) do nothing;
