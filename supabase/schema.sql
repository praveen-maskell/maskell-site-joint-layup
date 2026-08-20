-- ============================================================
-- Maskell Productions — Site Joint Layup Sheet
-- Schema + RLS. Run in Supabase SQL editor, in order.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- PROFILES  (1:1 with auth.users; role gate for admin area)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'worker' check (role in ('worker','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- AUTHORISED PERSONNEL  (dropdown source — laminators/supervisors)
-- Separate from `profiles` because not every laminator/supervisor
-- necessarily has an app login.
-- ------------------------------------------------------------
create table public.authorised_personnel (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  role text not null check (role in ('laminator','supervisor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index idx_personnel_role_active on public.authorised_personnel(role, active);

-- ------------------------------------------------------------
-- JOBS  (lightweight — upserted the first time a job number is used)
-- ------------------------------------------------------------
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  job_number text not null unique,
  dwg_no text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SITE JOINT SUBMISSIONS  (core record)
-- ------------------------------------------------------------
create table public.site_joint_submissions (
  id uuid primary key default uuid_generate_v4(),
  submission_id text not null unique,        -- human code e.g. SJ-2026-000123
  idempotency_key text not null unique,      -- client-generated draft UUID; blocks dup submits

  job_id uuid references public.jobs(id),
  job_number text not null,
  dwg_no text not null,
  dn text,
  pn text,
  joint_id text not null,
  resin_type text,
  laminate_details text,
  batch_no text,

  -- site conditions
  temperature_c numeric(4,1),
  weather text[] not null default '{}',      -- multi-select
  position_of_work text not null,

  -- flocoat
  flocoat boolean not null default false,
  flocoat_colour text,
  wax_coat_details text,

  -- personnel
  laminator_id uuid references public.authorised_personnel(id),
  supervisor_id uuid references public.authorised_personnel(id),
  submitted_by uuid not null references public.profiles(id),

  status text not null default 'submitted' check (status in ('draft','submitted','void')),
  pdf_storage_path text,
  emailed_at timestamptz,

  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now()
);
create index idx_submissions_job_number on public.site_joint_submissions(job_number);
create index idx_submissions_joint_id on public.site_joint_submissions(joint_id);
create index idx_submissions_submitted_at on public.site_joint_submissions(submitted_at desc);
create index idx_submissions_submitted_by on public.site_joint_submissions(submitted_by);

-- ------------------------------------------------------------
-- MATERIALS  (1:1 with submission)
-- ------------------------------------------------------------
create table public.site_joint_materials (
  submission_id uuid primary key references public.site_joint_submissions(id) on delete cascade,
  resin_weight_kg numeric(6,2) not null check (resin_weight_kg > 0),
  glass_weight_kg numeric(6,2) not null check (glass_weight_kg > 0),
  catalyst_weight_kg numeric(6,2) not null check (catalyst_weight_kg > 0),
  resin_batch_no text,
  glass_batch_no text,
  catalyst_batch_no text
);

-- ------------------------------------------------------------
-- LAYUP STEPS  (1:many, ordered)
-- ------------------------------------------------------------
create table public.site_joint_layup_steps (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.site_joint_submissions(id) on delete cascade,
  step_no int not null,
  step_label text not null,          -- e.g. "Check Joint Preparation", "Tack", "External (1)"
  detail text,                        -- selected predefined option, or "Other: <text>"
  width_mm numeric(6,1),
  initials text not null,
  completed_at timestamptz not null default now(),
  unique (submission_id, step_no)
);
create index idx_layup_steps_submission on public.site_joint_layup_steps(submission_id);

-- ------------------------------------------------------------
-- VISUAL INSPECTION  (1:many — one row per checked item)
-- ------------------------------------------------------------
create table public.site_joint_inspections (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.site_joint_submissions(id) on delete cascade,
  item text not null check (item in ('Chips','Delamination','Blisters','Exposed Fibres','Pinholes','Air Pockets')),
  result text not null check (result in ('OK','DEFECT')),
  details text,
  constraint defect_requires_details check (result = 'OK' or (result = 'DEFECT' and details is not null and length(trim(details)) > 0))
);
create index idx_inspections_submission on public.site_joint_inspections(submission_id);

-- ------------------------------------------------------------
-- PHOTOS  (1:many)
-- ------------------------------------------------------------
create table public.site_joint_photos (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.site_joint_submissions(id) on delete cascade,
  job_number text not null,
  joint_id text not null,
  photo_type text not null check (photo_type in ('Joint Before Work','Completed Joint / Layup','Final Inspection')),
  storage_path text not null,
  taken_at timestamptz not null default now(),
  uploaded_by uuid not null references public.profiles(id)
);
create index idx_photos_submission on public.site_joint_photos(submission_id);

-- ------------------------------------------------------------
-- NOTIFICATION SETTINGS  (admin-configurable recipient lists)
-- ------------------------------------------------------------
create table public.notification_settings (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  category text not null check (category in ('qa','production','other')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (email, category)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.authorised_personnel enable row level security;
alter table public.jobs enable row level security;
alter table public.site_joint_submissions enable row level security;
alter table public.site_joint_materials enable row level security;
alter table public.site_joint_layup_steps enable row level security;
alter table public.site_joint_inspections enable row level security;
alter table public.site_joint_photos enable row level security;
alter table public.notification_settings enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active
  );
$$;

create or replace function public.is_active_worker()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active
  );
$$;

-- profiles: users read their own row; admins read/update all
create policy "profiles_self_select" on public.profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_admin_update" on public.profiles for update using (is_admin());

-- personnel / jobs / notification_settings: any active authenticated worker can read;
-- only admins can write
create policy "personnel_read" on public.authorised_personnel for select using (is_active_worker());
create policy "personnel_admin_write" on public.authorised_personnel for all using (is_admin()) with check (is_admin());

create policy "jobs_read" on public.jobs for select using (is_active_worker());
create policy "jobs_insert" on public.jobs for insert with check (is_active_worker());

create policy "recipients_admin_all" on public.notification_settings for all using (is_admin()) with check (is_admin());

-- submissions: worker can insert their own, and read their own; admins read/update all
create policy "submissions_insert_own" on public.site_joint_submissions
  for insert with check (submitted_by = auth.uid() and is_active_worker());
create policy "submissions_select_own_or_admin" on public.site_joint_submissions
  for select using (submitted_by = auth.uid() or is_admin());
create policy "submissions_admin_update" on public.site_joint_submissions
  for update using (is_admin());

-- child tables: access follows the parent submission
create policy "materials_via_submission" on public.site_joint_materials for all using (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and (s.submitted_by = auth.uid() or is_admin()))
) with check (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);

create policy "layup_via_submission" on public.site_joint_layup_steps for all using (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and (s.submitted_by = auth.uid() or is_admin()))
) with check (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);

create policy "inspections_via_submission" on public.site_joint_inspections for all using (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and (s.submitted_by = auth.uid() or is_admin()))
) with check (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);

create policy "photos_via_submission" on public.site_joint_photos for all using (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and (s.submitted_by = auth.uid() or is_admin()))
) with check (
  exists (select 1 from public.site_joint_submissions s where s.id = submission_id and s.submitted_by = auth.uid())
);

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public) values ('site-joint-photos', 'site-joint-photos', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('site-joint-pdfs', 'site-joint-pdfs', false)
  on conflict (id) do nothing;

create policy "photos_bucket_read" on storage.objects for select using (
  bucket_id = 'site-joint-photos' and (auth.role() = 'authenticated')
);
create policy "photos_bucket_insert" on storage.objects for insert with check (
  bucket_id = 'site-joint-photos' and auth.role() = 'authenticated'
);
create policy "pdfs_bucket_read" on storage.objects for select using (
  bucket_id = 'site-joint-pdfs' and (auth.role() = 'authenticated')
);
-- PDF writes happen server-side only (service role bypasses RLS by design)

-- ============================================================
-- Submission ID generator — SJ-<year>-<6-digit sequence>, collision-free
-- ============================================================
create sequence if not exists public.site_joint_submission_seq;

create or replace function public.next_submission_id()
returns text language plpgsql security definer as $$
declare
  n bigint;
begin
  n := nextval('public.site_joint_submission_seq');
  return 'SJ-' || extract(year from now())::text || '-' || lpad(n::text, 6, '0');
end;
$$;

grant execute on function public.next_submission_id() to authenticated;

-- ============================================================
-- Seed: first admin — replace the UUID after creating your own user
-- ============================================================
-- update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
