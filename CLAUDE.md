# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Project: Travel Planning App ("Travelplaning")

A travel planning app for individuals and small groups to plan, organize, and
manage trips (single-destination and multi-stop round trips), flights, tickets
and reservations, popular spots, day-by-day itineraries, expenses, currency
conversion, and collaboration.

## Architecture (decided 2026-06-23)

**Stack:** Next.js (App Router, TypeScript) on Vercel · Firebase Authentication
(Google sign-in) · Neon serverless Postgres via Drizzle ORM · Zod validation.

The data layer is Postgres (not Firestore) because the domain is relational and
aggregation-heavy (trips ↔ stops ↔ members ↔ expenses ↔ itinerary, with
"spend by stop", "budget vs actual", splits, role-based membership); Postgres
models this directly. Authentication uses Firebase (Google sign-in), verified
server-side. Both run on genuinely free tiers with no credit card and keep
authorization and secrets server-side.

### Hard rules
- **Supabase is forbidden.** Do not add Supabase Auth, Database, Storage, Edge
  Functions, the `@supabase/*` SDKs, or Supabase-specific assumptions (e.g. do
  not rely on Supabase RLS as the auth mechanism). Postgres is used directly via
  Neon + Drizzle. (The repo currently contains no Supabase code — keep it that
  way.)
- **Firebase is used for authentication only.** App data stays in Postgres
  (Neon + Drizzle) — do not introduce Firestore, Realtime Database, or Firebase
  Storage as the data store.
- Core MVP features must work on **free tiers with no mandatory paid service and
  no credit card required**.
- Paid APIs/infra may be added **only as optional, opt-in drivers behind a
  provider interface** — never as a hard dependency for core MVP features.
- **No phone authentication** for the MVP unless explicitly approved.

### Chosen services & specifics
- **Hosting:** Vercel Hobby (free). Note: Hobby is **non-commercial**. The stack
  is fully portable (Node + Postgres + Firebase Auth), so moving to Vercel Pro /
  Netlify / Cloudflare / a VPS later needs no re-architecture.
- **Database:** Neon free tier (0.5 GB/project, no credit card), serverless
  driver. `DATABASE_URL` is server-only.
- **ORM/migrations:** Drizzle ORM + drizzle-kit. (Prisma is an acceptable
  alternative, but Drizzle is the default — do not mix both.)
- **Auth:** Firebase Authentication (Google sign-in). The browser signs in with
  Firebase; the server verifies the ID token with the Firebase Admin SDK and
  mints an httpOnly session cookie (read by server components/actions). Firebase
  users are mirrored into the Postgres `users` table keyed by Firebase UID.
  Service-account credentials are server-only; `NEXT_PUBLIC_FIREBASE_*` client
  config are identifiers, not secrets.
- **Local dev:** local Postgres (Docker) or a Neon dev branch; secrets in
  `.env.local`; a Firebase project with Google sign-in enabled plus a service
  account for the Admin SDK.

### Data model (Postgres) — ownership enforced via `trip_members`
- `users` — mirror of the Firebase auth user, keyed by Firebase UID (the FK
  target for ownership/membership).
- `trips` — name, main_destination, start/end dates, home_currency, budget,
  status (planning|booked|active|completed|archived), travel_style
  (budget|standard|premium), notes.
- `trip_members` — (trip_id, user_id, role: owner|editor|viewer). The
  authorization join table.
- `trip_invitations` — invite by email, status (pending|accepted|declined),
  role. In-app accept/decline; no outbound email required for MVP.
- `stops` — city, country, arrival/departure dates, accommodation name/address,
  lat, lng, notes, sort_order. (Keep model map/route-ready.)
- `documents` — tickets/reservations metadata + external_url; type, booking ref,
  dates, location, price, currency, created_by/created_at.
- `itinerary_items` — type (flight|hotel|transport|activity|food|custom),
  start/end, location, lat/lng, optional links to stop/document/saved_spot,
  cost/currency. Detect scheduling conflicts as warnings, not hard blocks.
- `saved_spots` — name, category, address, lat/lng, rating, source, notes,
  recommended_duration.
- `expenses` — date, category, amount, currency, converted_amount,
  exchange_rate_used, payment_method, paid_by, split_with, notes, receipt ref.
  **Store the rate used at creation time; never silently recalculate historic
  expenses when rates change.**
- `exchange_rates` — cached rates with source + timestamp.

### Security & authorization (non-negotiable)
- **All trip-scoped access goes through a server-side data-access layer that
  filters by `trip_members`.** Never trust the client for authorization. Enforce
  roles in mutations: viewer = read-only; editor = edit content but not delete
  the trip / not manage owners; owner = full control.
- **Prevent removing the last owner** of a trip.
- Provider secrets/API keys are **server-only** — never shipped to the browser
  (no `NEXT_PUBLIC_` for secrets).
- Validate all input with **Zod** at the server boundary.
- Treat tickets/bookings as sensitive: **do not log booking references,
  passport/visa details, ticket contents, or other private travel data.**
- If file upload is added: sanitize filenames; avoid storing unnecessary
  personal data.

### Provider abstractions (all external integrations behind interfaces)
Each ships a default free/manual/mock driver so the MVP works with no paid
service. Do not hardcode the UI to a single paid provider.
- **Currency** — default: Frankfurter (`api.frankfurter.dev`, ECB rates, no key)
  + manual rate override + mock driver for dev. Cache rates with
  source + timestamp.
- **Flights** — MVP: build a Google Flights **deep-link handoff** from search
  criteria; user saves details manually. **No scraping**, and do **not** assume
  an official Google Flights API exists. Interface allows future Amadeus/Duffel
  (optional).
- **Places/recommendations** — MVP: manual "save spot" + optional OpenStreetMap
  (Nominatim/Overpass) and Wikivoyage/Wikipedia drivers (free, attribution
  required). No paid Google Places dependency.
- **File/document storage** — Google Drive driver (per-user, `drive.file`
  scope, link-shared) for ticket/booking files: the browser uploads to the
  signed-in user's own Drive on demand (incremental consent; the Drive access
  token is used client-side and never touches the server), and we store the
  Drive file id + shareable link. External URL + metadata remain supported.
  **Never** store large Base64 blobs in Postgres.
- **Email/invitations** — MVP: in-app invite flow (no outbound email). Optional
  driver: a free-tier transactional email provider later.
