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

With Supabase settings in `.env.local`, everything reads and writes the database. Without them
the dev server still works: listings, bookings and blocked dates are kept in your browser, photo
upload is switched off (paste image links instead), and `/admin/login` offers a **Continue as
local admin (dev only)** button. That button never appears in production builds.

## Backend setup (hosted Supabase project)

1. **Create the project** at [supabase.com](https://supabase.com), region **South Asia (Mumbai)**.
2. **Settings to change in the dashboard** (the local `supabase/config.toml` doesn't apply there):
   - Authentication → Sign In / Providers: turn **off** "Allow new users to sign up". Keep the
     **Email** provider itself enabled: turning it off blocks email sign-in for admins too.
   - Authentication → Multi-Factor: make sure **TOTP (authenticator app)** is enabled.
   - Authentication → URL Configuration: set the Site URL to your website's address.
   - Authentication → Password: minimum length 12.
3. **Apply the schema.** Either paste each file in `supabase/migrations/` into the dashboard's
   **SQL Editor**, oldest first, and press Run; or use the CLI from the project root:
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
7. **Deploy the website** (next section).

## Deploying the website

The site is a set of static files (`npm run build` → `dist/`), so any static host works. The host
needs the whole project, including `partner_frontend/`, to build it.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output folder | `dist` |
| Environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (never the secret key) |

- **Cloudflare Pages** (free plan allows business sites): connect the GitHub repository, or upload
  from your machine with `npm run build` then `npx wrangler pages deploy dist`. Unknown paths are
  served by the app automatically.
- **Netlify**: `netlify.toml` already holds the build settings and the rule that keeps deep links
  like `/stays/pinewood-manor-kasauli` working on refresh.
- **Vercel**: the free Hobby plan doesn't allow commercial use.

After adding your domain, put it in Supabase under Authentication → URL Configuration.

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

`supabase/config.toml` sets `auto_expose_new_tables = false` to match new hosted projects, so
every migration must grant the access it needs (see `20261108140000_explicit_grants.sql`).

After changing the schema, regenerate the TypeScript types the app uses:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

## How bookings work

1. A guest picks dates on a stay page and sees a price worked out by the database
   (`quote_stay`: Friday/Saturday rate, extra-guest fee, cleaning and service fees).
2. **Request to book** saves an **enquiry** through `request_booking` (name and WhatsApp number
   required; at most 5 requests an hour per phone or email), then opens WhatsApp with the
   booking reference (e.g. `IVS-1001`). Enquiries don't hold dates.
3. In the admin **Bookings & Ledger** page you follow up, then move it to **Awaiting payment**
   (dates held) or **Confirmed**. Record what the guest paid and what the owner is paid.
4. The **Availability calendar** shows held and confirmed stays and blocked dates. The
   database refuses bookings or blocks that overlap.

Code map: `src/lib/db.ts` (all database calls; converts rupees ↔ paise), `src/lib/pricing.ts`
(the same price rules for instant estimates and the no-Supabase mode), and the two data contexts
in `src/context/`.

## How the data is protected

- Every table has row level security. Visitors can read **active** stays, their photos and
  published reviews, and call the `quote_stay`, `is_available`, `get_unavailable_ranges` and
  `request_booking` functions. Everything else is admin-only.
- "Admin" means `profiles.role = 'admin'` **and** a session that passed two-step verification.
  Roles can't be changed through the API; use `scripts/create-admin.mjs` or SQL.
- Money is stored as whole paise (`_paise` columns, ₹1 = 100). Prices are calculated by
  `quote_stay` in the database, never trusted from the browser.
- Bookings that hold dates (`awaiting_payment`, `confirmed`) can't overlap each other or an
  availability block; the database rejects it.

## Project status

- **Phase 1 (done):** schema, access rules, photo storage, admin login with two-step
  verification, seed data and tests.
- **Phase 2 (done):** the site reads and writes the database: listings with uploaded photos,
  server-side prices, website booking requests, the bookings ledger and the availability calendar.
- **Next (Phase 3):** Razorpay payment links and policy pages. Favorites are still kept in each
  visitor's browser until guest accounts exist.
