# Catalyst

Mobile-first daily log for a charity cat shelter. Volunteers sign in on their
phones and record each visit — food, water, urination, defecation (with Bristol
stool score), weight and free-text notes — in under a minute. Replaces a
pen-and-paper sheet so trends (declining appetite, persistent loose stools,
weight loss) can be spotted before they become vet problems.

This repo is the **MVP**: the daily log entry form. Charts, health alerts,
photo uploads, CSV/PDF exports and offline support are on the roadmap (see
below) but deliberately out of scope here.

## Auth model

Catalyst uses **two shared passwords**, not per-volunteer accounts:

- `SHELTER_VOLUNTEER_PASSWORD` — everyday sign-in for volunteers
- `SHELTER_ADMIN_PASSWORD` — same thing plus access to `/admin/cats`

To keep entries attributable, every log entry requires a **"Logged by"** text
field (name or initials). The form remembers it in `localStorage` so a
volunteer types it once per device. This is intentionally the simplest thing
that works at this stage — we can layer per-user accounts on later if the
shelter grows.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **SQLite** via **Prisma**
- **Auth.js (NextAuth v5)** with a credentials provider that checks two env
  passwords
- **Tailwind CSS** — mobile-first, ≥44 px tap targets, 16 px inputs to prevent
  iOS zoom
- **Zod** for input validation shared between client and server
- **Vitest** for unit tests · **Playwright** for end-to-end (mobile viewport)

## Setup

```bash
npm install
cp .env.example .env              # set AUTH_SECRET + both shelter passwords
npx prisma migrate dev
npm run prisma:seed               # seeds 3 demo cats
npm run dev
```

Default development passwords (`.env`): `volunteer1234` and `admin1234`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run test` | Vitest unit tests (validators) |
| `npm run e2e` | Playwright end-to-end tests (mobile Chromium) |
| `npm run db:reset` | Reset DB + reseed (destructive) |
| `npm run prisma:migrate` | Run a new migration |

## Project layout

```
app/
  login/                  sign-in (single password, client-side signIn)
  page.tsx                dashboard: "Needs visit today" / "Visited today"
  cats/[id]/              cat profile, last 7 days of log entries
  cats/[id]/log/new/      the critical form (one-scroll, one-handed)
  admin/cats/             admin CRUD for cats
  api/auth/[...nextauth]/ Auth.js route handlers
  api/test/reset/         test-only DB reset (disabled in production)
auth.ts                   full Auth.js config (two-password credentials)
auth.config.ts            edge-safe subset used by middleware
middleware.ts             redirects unauthenticated users + guards /admin
lib/
  db.ts                   Prisma singleton
  validators.ts           Zod schemas shared by actions + forms
  actions/                Server Actions: createLogEntry, createCat, archiveCat
prisma/schema.prisma      Cat · LogEntry
tests/validators.test.ts  unit tests for the Zod schemas
e2e/                      Playwright specs covering auth, dashboard, log form,
                          cat profile, admin flows
```

## Data model

- **Cat** — `name · intakeDate · dob? · notes · medicalFlags · archivedAt?`
- **LogEntry** — `catId · loggedByName · recordedAt · foodOffered · waterIntake · urinated · defecated · bristolScore? · weightGrams? · condition · behaviourNotes? · generalNotes?`
  Indexed on `(catId, recordedAt)` for the per-cat view.

The Zod `LogEntryInput` schema enforces: Bristol score **required** when
defecated is true, **forbidden** when false (prevents stale UI state leaking
through); `loggedByName` **required** and trimmed.

## Hosting

Default is SQLite on local disk. For production pick one:

- **Fly.io** + persistent volume for `prisma/dev.db`. Cheapest option.
- **Vercel + Turso** (LibSQL). Works with the existing Prisma schema after a
  provider swap.

Serverless Vercel alone won't persist SQLite between invocations.

## Roadmap (post-MVP, not in this repo)

- **v1.1** Per-cat trend charts (Bristol over time, eating, weight)
- **v1.2** Health alert rules (3 days no food; Bristol 1 or 7 twice running) +
  daily email digest to a designated trustee
- **v1.3** Photo attachments (S3-compatible storage)
- **v1.4** CSV / PDF export for vet visits
- **v1.5** PWA + offline log queue (only if shelter WiFi proves patchy)
- **v2.0** Per-volunteer accounts (optional upgrade if shelter size warrants it)
