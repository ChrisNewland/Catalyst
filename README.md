# Catalyst

Mobile-first daily log for a charity cat shelter. Volunteers sign in on their
phones and record each visit — food, water, urination, defecation (with Bristol
stool score), weight and free-text notes — in under a minute. Replaces a
pen-and-paper sheet so trends (declining appetite, persistent loose stools,
weight loss) can be spotted before they become vet problems.

This repo is the **MVP**: the daily log entry form. Charts, health alerts,
photo uploads, CSV/PDF exports and offline support are on the roadmap (see
below) but deliberately out of scope here.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **SQLite** via **Prisma**
- **Auth.js (NextAuth v5)** with credentials (email + password, bcrypt)
- **Tailwind CSS** — mobile-first, ≥44 px tap targets, 16 px inputs to prevent
  iOS zoom
- **Zod** for input validation shared between client and server
- **Vitest** for unit tests · **Playwright** for end-to-end (mobile viewport)

## Setup

```bash
npm install
cp .env.example .env              # edit AUTH_SECRET for production
npx prisma migrate dev --name init
npm run prisma:seed               # admin@shelter.test / admin1234
                                  # vol@shelter.test   / volunteer1234
npm run dev
```

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
  login/                  sign-in (client-side signIn)
  page.tsx                dashboard: "Needs visit today" / "Visited today"
  cats/[id]/              cat profile, last 7 days of log entries
  cats/[id]/log/new/      the critical form (one-scroll, one-handed)
  admin/cats/             admin CRUD for cats
  admin/users/            admin: invite volunteers, toggle roles
  api/auth/[...nextauth]/ Auth.js route handlers
  api/test/reset/         test-only DB reset (disabled in production)
auth.ts                   full Auth.js config (credentials + bcrypt + Prisma)
auth.config.ts            edge-safe subset used by middleware
middleware.ts             redirects unauthenticated users + guards /admin
lib/
  db.ts                   Prisma singleton
  validators.ts           Zod schemas shared by actions + forms
  actions/                Server Actions: createLogEntry, createCat, archiveCat, inviteUser, setRole
prisma/schema.prisma      User · Cat · LogEntry
tests/validators.test.ts  17 unit tests for the Zod schemas
e2e/                      16 Playwright specs covering auth, dashboard, log form,
                          cat profile, admin flows
```

## Data model

- **User** — `email · name · hashedPassword · role ("VOLUNTEER" | "ADMIN")`
- **Cat** — `name · intakeDate · dob? · notes · medicalFlags · archivedAt?`
- **LogEntry** — `catId · volunteerId · recordedAt · foodOffered · waterIntake · urinated · defecated · bristolScore? · weightGrams? · condition · behaviourNotes? · generalNotes?`
  Indexed on `(catId, recordedAt)` for the per-cat view.

The Zod `LogEntryInput` schema enforces: Bristol score **required** when
defecated is true, **forbidden** when false (prevents stale UI state leaking
through).

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
