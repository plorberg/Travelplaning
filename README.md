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
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate SQL migrations from the Drizzle schema |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:push` | Push the schema directly (handy in early dev) |
| `npm run db:studio` | Open Drizzle Studio |

## Status

Foundation scaffold: Google authentication, the full data model, and a
protected dashboard. Feature work — trips CRUD, stops, itinerary, expenses,
currency, flight handoff, saved spots, and collaboration — follows in
subsequent milestones, each behind the provider abstractions described in
`CLAUDE.md`.
