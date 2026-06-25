# Travelplaning

Reiseplanungsapp — plan, organize, and manage trips (single-destination and
multi-stop round trips), flights, tickets and reservations, popular spots,
day-by-day itineraries, expenses, currency conversion, and collaboration.

## Stack

- **Next.js** (App Router, TypeScript) — deploys to Vercel
- **Firebase Authentication** (Google sign-in), verified server-side
- **Neon** serverless Postgres via **Drizzle ORM**
- **Zod** for input validation

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture decision and project rules.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment — copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Neon Postgres connection string (free tier, no card).
   - `NEXT_PUBLIC_FIREBASE_*` — your Firebase web app config (enable Google
     sign-in in the Firebase console).
   - `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` —
     a Firebase service account for server-side token verification.
   - Optional: `CURRENCY_PROVIDER`, `PLACES_PROVIDER`, `WIKIVOYAGE_LANG`,
     `PLACES_CONTACT_EMAIL` (all have free, no-key defaults — see `.env.example`).
3. Create the database schema:
   ```bash
   npm run db:push        # or: npm run db:generate && npm run db:migrate
   ```
4. Run the dev server:
   ```bash
   npm run dev            # http://localhost:3000
   ```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (single-instance guard; `dev:clean` wipes `.next` first) |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate SQL migrations from the Drizzle schema |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:push` | Push the schema directly (handy in early dev) |
| `npm run db:studio` | Open Drizzle Studio |

## Features

Google sign-in · trips (single-destination and multi-stop) · stops · day-by-day
itinerary with conflict warnings · tickets/documents (Google Drive) · expenses
with currency conversion (Frankfurter) · saved spots with OpenStreetMap /
Wikivoyage suggestions · flight search (Google Flights deep-link handoff) · a
Leaflet/OpenStreetMap map · collaboration (members, roles, invitations). The UI
is German. External integrations sit behind provider interfaces with free,
no-key defaults (see `CLAUDE.md`).

## Deploy to Vercel

Next.js is auto-detected — no `vercel.json` needed (build command `next build`,
the default).

1. **Database** — create a Neon project and apply migrations to it once:
   ```bash
   DATABASE_URL="<prod-neon-url>" npm run db:migrate
   ```
   (Vercel's build does **not** run migrations.)
2. **Environment variables** — in the Vercel project settings, add every value
   from `.env.local` (see `.env.example`): `DATABASE_URL`, the Firebase admin
   secrets, and the `NEXT_PUBLIC_FIREBASE_*` client config. `ALLOWED_SERVER_ACTION_ORIGINS`
   is **not** needed in production. Server secrets must never use the
   `NEXT_PUBLIC_` prefix.
3. **Firebase** — in the Firebase console, add the production domain
   (`your-app.vercel.app` and any custom domain) under
   **Authentication → Settings → Authorized domains**, and add it to the
   Google OAuth client's authorized origins (required for Google sign-in and
   the per-user Google Drive uploads).
4. **Deploy** — import the repo in Vercel and deploy. Re-run step&nbsp;1 whenever
   new migrations are added.

> Vercel Hobby is free but **non-commercial**. The stack is portable (Node +
> Postgres + Firebase Auth), so moving to Vercel Pro / Netlify / a VPS later
> needs no re-architecture.
