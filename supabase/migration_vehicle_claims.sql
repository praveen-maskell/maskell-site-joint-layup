-- ============================================================
-- Personal Vehicle Usage Claim feature — reference copy of the
-- migration already applied directly to project uyodnkuqxhirudgtetmy.
-- Safe to run top-to-bottom in one go if it ever needs re-applying.
-- ============================================================

create table if not exists public.site_vehicle_claims (
  id uuid primary key default uuid_generate_v4(),
  submission_id text not null unique,
  idempotency_key text not null unique,

  laminator_id uuid references public.authorised_personnel(id),
  laminator_name text not null,

  work_date date not null,
  start_km numeric(10,1) not null,
  finish_km numeric(10,1) not null,
  total_km numeric(10,1) generated always as (finish_km - start_km) stored,

  start_photo_path text not null,
  finish_photo_path text not null,
  pdf_storage_path text,

  emailed_at timestamptz,

  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),

  constraint finish_after_start check (finish_km >= start_km)
);

create index if not exists idx_vehicle_claims_work_date on public.site_vehicle_claims(work_date desc);

alter table public.site_vehicle_claims enable row level security;

drop policy if exists "vehicle_claims_public_insert" on public.site_vehicle_claims;
create policy "vehicle_claims_public_insert" on public.site_vehicle_claims for insert with check (true);

drop policy if exists "vehicle_claims_admin_select" on public.site_vehicle_claims;
create policy "vehicle_claims_admin_select" on public.site_vehicle_claims for select using (is_admin());

drop policy if exists "vehicle_claims_admin_update" on public.site_vehicle_claims;
create policy "vehicle_claims_admin_update" on public.site_vehicle_claims for update using (is_admin());

-- Storage buckets for odometer photos and generated PDFs (private)
insert into storage.buckets (id, name, public)
  values ('vehicle-claim-photos', 'vehicle-claim-photos', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('vehicle-claim-pdfs', 'vehicle-claim-pdfs', false)
  on conflict (id) do nothing;

drop policy if exists "vehicle_claim_photos_bucket_insert" on storage.objects;
create policy "vehicle_claim_photos_bucket_insert" on storage.objects for insert
  with check (bucket_id = 'vehicle-claim-photos');

drop policy if exists "vehicle_claim_photos_bucket_admin_select" on storage.objects;
create policy "vehicle_claim_photos_bucket_admin_select" on storage.objects for select
  using (bucket_id = 'vehicle-claim-photos' and is_admin());

drop policy if exists "vehicle_claim_pdfs_bucket_admin_select" on storage.objects;
create policy "vehicle_claim_pdfs_bucket_admin_select" on storage.objects for select
  using (bucket_id = 'vehicle-claim-pdfs' and is_admin());

-- Extend the recipient categories to include vehicle claim notifications
alter table public.notification_settings drop constraint if exists notification_settings_category_check;
alter table public.notification_settings add constraint notification_settings_category_check
  check (category in ('qa','production','other','timesheet','vehicle_claim'));

-- So vehicle claims start reaching you immediately without extra setup
insert into public.notification_settings (email, category)
  values ('praveen@maskell.co.nz', 'vehicle_claim')
  on conflict (email, category) do nothing;
