# IvStay

Booking site for hand-picked villas, BnBs and hotels in India, plus an admin console.

- **Website + admin console:** Vite, React 18, TypeScript, Tailwind (`src/`). The public pages are
  imported from `partner_frontend/` (a separate git repository) through the `@/` import alias.
- **Backend:** Supabase (Postgres, login, photo storage). Schema, access rules and tests live in
  `supabase/`.

## Run the site

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint       # type-check
npm run test:db    # database tests in an in-memory Postgres (no Docker needed)
npm run build      # production build in dist/
```

Without Supabase settings the dev server still works: listings are kept in your browser, and
`/admin/login` offers a **Continue as local admin (dev only)** button. That button never appears
in production builds.

## Backend setup (hosted Supabase project)

1. **Create the project** at [supabase.com](https://supabase.com), region **South Asia (Mumbai)**.
2. **Settings to change in the dashboard** (the local `supabase/config.toml` doesn't apply there):
   - Authentication → Sign In / Providers: turn **off** "Allow new users to sign up". Keep the
     **Email** provider itself enabled: turning it off blocks email sign-in for admins too.
   - Authentication → Multi-Factor: make sure **TOTP (authenticator app)** is enabled.
   - Authentication → URL Configuration: set the Site URL to your website's address.
   - Authentication → Password: minimum length 12.
3. **Apply the schema** from the project root:
   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```
4. **Add the keys.** Copy `.env.example` to `.env.local` and fill it in (Project Settings → API).
   Only the publishable key goes in `VITE_` variables; the secret key must never be bundled.
5. **Create the first admin:**
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs you@example.com "Your Name"
   ```
   Then sign in at `/admin/login`. The first sign-in asks you to scan a QR code with an
   authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…). Every later
   sign-in asks for the 6-digit code.
6. **Optional: load the real listings** that were in the partner pages. Paste
   `supabase/seed.sql` into the SQL editor once, then upload their photos:
   ```bash
   node --env-file=.env.local scripts/upload-listing-photos.mjs
   ```
7. **Deploying:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in your host's
   environment variables before building.

## Local Supabase (for development and tests)

Needs Docker Desktop running.

```bash
npx supabase start       # starts Postgres, auth and storage locally, applies migrations + seed
npx supabase status      # shows the local URL and keys for .env.local
npx supabase test db     # same tests as npm run test:db, against the real local stack
npx supabase db reset    # wipes the local database and re-applies everything
npx supabase stop
```

Local auth emails are captured by the Inbucket/Mailpit page that `supabase status` lists.

## How the data is protected

- Every table has row level security. Visitors can read **active** stays, their photos and
  published reviews, and call the `quote_stay`, `is_available` and `get_unavailable_ranges`
  functions. Everything else is admin-only.
- "Admin" means `profiles.role = 'admin'` **and** a session that passed two-step verification.
  Roles can't be changed through the API; use `scripts/create-admin.mjs` or SQL.
- Money is stored as whole paise (`_paise` columns, ₹1 = 100). Prices are calculated by
  `quote_stay` in the database, never trusted from the browser.
- Bookings that hold dates (`awaiting_payment`, `confirmed`) can't overlap each other or an
  availability block; the database rejects it.

## Project status

Phase 1 of the backend plan is done: schema, access rules, photo storage, admin login with
two-step verification, seed data and tests. The site's listings, bookings and calendar still use
browser storage until Phase 2 connects them to the database.
