# Maskell Site Joint Layup Sheet — Digital QA App

Mobile-first replacement for the paper "SITE JOINT LAYUP SHEET" (Form F.5.65).
Next.js 14 + TypeScript + Tailwind + Supabase + Resend, deployed to Vercel, installable as a PWA.

## 1. What's built

- **Auth model**: workers don't sign in — they pick their own name from a dropdown (same pattern as the
  Laminator/Supervisor fields) when submitting. **Only the admin area requires a login.** This trades away
  the "no anonymous submission" barrier for speed: anyone with the link can submit a record, but only an
  admin can browse, search, or read back past submissions, personnel, or recipient lists — the app's Row
  Level Security policies enforce this at the database level (insert is public, select is admin-only).
  If you need to lock submission down to known devices/people again later, the natural next step is a
  shared team PIN gate in front of `/new`, short of full individual logins.
- **Wizard** (`/new`): JOB → MATERIALS → SITE → LAYUP → INSPECTION → PHOTOS → REVIEW, one screen
  per section, large touch targets, sticky Next/Back, progress `n / 7`.
- **Offline resilience**: form state is persisted to `localStorage` on every keystroke (Zustand), so a refresh
  or a dead zone on site never loses entered data. Submission uses a client-generated idempotency key so a
  retried submit after a dropped connection can't create a duplicate record.
- **Photos**: camera capture or file upload, client-side compression (~1.5MB / 1920px cap — kept QA-usable),
  thumbnails, retake/delete before submit.
- **Submission**: writes the full record + photos to Supabase from the browser (RLS-scoped to the logged-in
  user), then calls a server route that generates a professional PDF and emails it to the configured
  recipient list.
- **PDF** (`src/lib/pdf.tsx`): a proper QA document (not a screenshot) — Maskell branding, all sections,
  layup step table, inspection table, embedded photos, submission ID, page numbers.
- **Email** (`src/lib/email.ts`): Resend, subject `SITE JOINT COMPLETED — JOB {job} — JOINT {joint}`, summary
  table, PDF attached.
- **Admin area** (`/admin`, role-gated): search/browse records by job/joint/date, open a record with full
  detail + PDF download + photo viewer, manage authorised laminators/supervisors, manage email recipient
  lists (QA / Production / Other).
- **Database**: `supabase/schema.sql` — all tables, indexes, RLS policies, storage buckets + policies, and
  the `next_submission_id()` function that mints collision-free `SJ-2026-000123` IDs.
- **PWA**: `public/manifest.json` + `next-pwa` (service worker generated at build time) so the app installs
  to the home screen on Android and iPhone.

## 2. First-time setup

### Supabase
1. Create a new Supabase project.
2. SQL Editor → paste and run all of `supabase/schema.sql`.
3. Auth → disable public sign-ups (Authentication → Providers → Email → toggle off "Allow new users to
   sign up"). Site workers are provisioned by an admin, not self-registered — matches the "no anonymous
   submission" requirement.
4. Create your own login: Authentication → Users → Add user (email + password). A `profiles` row is
   auto-created by the trigger in the schema.
5. Make yourself admin — in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where id = '<your-auth-user-uuid>';
   ```
6. Add your laminators/supervisors and email recipients either via SQL or, once the app is running, via
   `/admin/personnel` and `/admin/recipients`.

### Resend
1. Create a Resend account, verify your sending domain (or use their test domain while developing).
2. Create an API key.

### Environment variables
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Project Settings > API > service_role — server only
RESEND_API_KEY=
EMAIL_FROM="Maskell QA <qa@yourdomain.co.nz>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Install & run
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` — you'll be redirected to `/login`.

## 3. Deploy to Vercel
1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same environment variables in Vercel → Project Settings → Environment Variables.
4. Deploy. Update `NEXT_PUBLIC_APP_URL` to the production URL.
5. On a phone, open the site in Chrome/Safari → "Add to Home Screen" to install as a PWA.

## 4. Icons
Placeholder icons are in `public/icons/`. Swap in real Maskell-branded 192×192 / 512×512 PNGs (and a
512×512 maskable variant) before going live — same filenames, `manifest.json` doesn't need changes.

## 5. Notes / things to verify before relying on this in production

- **RLS is the security boundary** — test it: log in as a non-admin worker and confirm `/admin/*` redirects
  away, and that Supabase queries only ever return that worker's own submissions.
- **Service role key** is used only in `src/lib/supabase/server.ts` (`createServiceSupabase`) and only in
  server-side route handlers (`/api/submissions/finalize`, admin routes go through the RLS-scoped client
  instead) — never import it into a Client Component.
- **Duplicate prevention**: `idempotency_key` is unique on `site_joint_submissions`; `submitSiteJoint()`
  checks for an existing row with the same draft ID before inserting, so retrying a failed submit is safe.
- **Full offline submission** (queueing the actual insert/photo upload while offline, not just the form
  draft) isn't implemented — the current design saves all entered data locally so nothing is lost, and
  clearly surfaces a submit error asking the worker to retry once they have signal. If true background sync
  is needed, that's a follow-up (Background Sync API / a local outbox table) — flag it if that's a hard
  requirement and I'll build it out.
- **Layup step predefined options** in `src/lib/constants.ts` are placeholders based on typical FRP layup
  terminology — replace with your actual site vocabulary (or paste the real F.5.65 form text and I'll match
  it exactly).
- Run through the 10-point test list from the brief (mobile layout, validation, photo capture, DB writes,
  PDF, email, auth, admin, duplicate prevention, poor network) against your real Supabase project before
  rolling out to site crews.

## 6. Project structure
```
src/
  app/
    login/                  sign-in
    new/                    the 7-step wizard
    success/[id]/           post-submit confirmation
    admin/                  role-gated admin area
    api/submissions/finalize/   PDF + email generation (server-only)
    api/admin/*              personnel & recipient CRUD
  components/ui/            large-touch-target form primitives
  components/wizard/        progress bar, sticky nav
  lib/                      supabase clients, pdf, email, types, constants
  store/                    Zustand wizard state (localStorage-persisted)
supabase/
  schema.sql                tables, RLS, storage, submission ID function
```
