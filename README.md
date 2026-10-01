# TypeSense

A production-quality typing-speed test and personalised typing-learning web app.

**TYPE → ANALYZE → IDENTIFY WEAKNESSES → PRACTICE → RETEST → IMPROVE**

Every finished session is analysed per keystroke: which keys fail, which letter
combinations trip you up, which words you fumble, where your rhythm breaks.
That analysis drives targeted practice drills, a lesson curriculum and a
learning plan, so the next session is built around *your* weaknesses — not a
generic word list.

## Features

- **Typing test** — words / time / custom-text modes with live WPM, accuracy,
  consistency and key-delay charts
- **Error analysis** — every keystroke classified (transposition, extra, missing,
  wrong-key, …) with per-session mistake breakdown
- **Problem keys & weak words** — heat-mapped on-screen keyboard, weak-word and
  combination detection
- **Personalized practice** — adaptive drills generated from *your* mistakes
- **Lessons** — progressive curriculum with stage gating on WPM + accuracy
- **Progress tracking** — trends, streaks, daily goals, XP levels and achievements
- **Authentication** — Supabase cloud accounts (email + optional Google) or a
  local device account; guest mode always works
- **Cloud sync** — sessions, profile and lesson results sync when signed in
  (RLS owner-only); local-first otherwise

## Tech Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | React 19 + TypeScript 6 (strict)                   |
| Build      | Vite 8                                             |
| Routing    | react-router-dom 7 (SPA, lazy routes)              |
| State      | Zustand 5 (persisted to localStorage)              |
| Styling    | Tailwind CSS 4 + custom design tokens              |
| Charts     | Recharts 3 (+ dependency-free SVG sparkline)       |
| Auth/Cloud | Supabase (`@supabase/supabase-js`, anon key, RLS)  |
| Testing    | Vitest 5 + Testing Library (130 tests)             |

## Screenshots

No screenshots are committed yet. Run `npm run dev` and visit
`http://localhost:5173` — or the deployed URL once published — to see the
landing page, typing test, mistake lab and progress views.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script               | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Vite dev server with HMR              |
| `npm run build`      | Type-check + production build         |
| `npm run preview`    | Serve the production build locally    |
| `npm test`           | Run the Vitest suite once             |
| `npm run test:watch` | Vitest in watch mode                  |
| `npm run test:coverage` | Coverage report (v8, core modules)  |
| `npm run typecheck`  | `tsc --noEmit` (strict mode)          |

No environment variables are required — the app runs fully locally by default
(sessions, progress, achievements and settings are persisted to `localStorage`).

## Environment variables

Copy `.env.example` to `.env.local` and fill in values only if you want
cloud sync:

```bash
VITE_SUPABASE_URL=            # Supabase project URL
VITE_SUPABASE_ANON_KEY=       # anon/public key (RLS protects user data)
VITE_ENABLE_GOOGLE_AUTH=false # optional Google OAuth button
```

When these are absent, **every Supabase code path is inert**: the SDK chunk is
never even downloaded. Accounts still work — `/login` and `/signup` create a
**local device account** (password stored only as a PBKDF2-SHA256 hash, session
lives in `sessionStorage`) — while cloud sync stays opt-in. Guest mode remains
the default; no sign-up is ever forced.

## Metric formulas

Single source of truth: [`src/typing/metrics.ts`](src/typing/metrics.ts).
Accuracy utility (the ONLY ×100): [`src/lib/accuracy.ts`](src/lib/accuracy.ts).

```
elapsedMin = max(elapsedMs, 1000) / 60000           (clamped, avoids ∞)

Gross WPM = (allPrintableKeystrokes / 5) / elapsedMin
WPM       = (correctCharacters    / 5) / elapsedMin   ← headline
Net WPM   = max(0, Gross WPM − uncorrectedErrors / elapsedMin)
CPM       = Gross WPM × 5

Accuracy       = correctKeystrokes / allPrintableKeystrokes   (first-attempt)
FinalAcc       = correctSlots / filledSlots                   (buffer match)
CorrectionRate = corrections / (corrections + uncorrectedErrors)
Consistency    = clamp(1 − stdev(keyDelays)/mean(keyDelays), 0, 1)
```

**Accuracy representation:** every accuracy / error-rate / correction-rate is a
**ratio 0–1** internally and in storage (localStorage + Supabase) — `1` means
100%. The single conversion to a percentage happens at display time through
`accuracyToPercent()` / `formatAccuracy()` in `src/lib/accuracy.ts`; components
never write `accuracy * 100`. Consistency (and lesson `goalAccuracy`) are the
separate exceptions stored as 0–100 percentages. See
`supabase/migrations/0002_accuracy_contract.sql` for the DB contract.

Error classification priority (`src/typing/classify.ts`, first match wins):

`transposition → capitalization → extra → space → missing → punctuation → number → repeated-word → wrong-key`
(`slow` is tracked separately and never counts as an error.)

## Architecture

```
src/
├── typing/        engine, text utils, error classification, metric formulas
├── analytics/     problem-key scoring, pattern detection, summaries, learning plan
├── lessons/       curriculum helpers + adaptive practice-text generators
├── gamification/  XP levels, achievements, streaks, daily goals
├── stores/        zustand stores (persisted): user, sessions, progress, ui, auth
├── services/      fire-and-forget Supabase sync (sessions, profile, lessons)
├── hooks/         useTypingSession (engine lifecycle), analytics selectors
├── components/
│   ├── typing/    TypingArea, StatsBar, SessionResults
│   ├── keyboard/  heat-mapped on-screen keyboard
│   ├── charts/    recharts wrappers + dependency-free landing sparkline
│   ├── layout/    Sidebar, TopBar, MobileNav
│   └── ui/        design-system primitives (Button, Card, Dialog, Toast, …)
├── pages/         one real page per route (no placeholders)
├── data/          word lists, passages, keyboard layout, lesson curriculum
└── lib/           nav config, supabase client, utils
```

Key decisions:

- **Local-first.** Zustand + `localStorage` is the source of truth. Supabase
  merges on top when configured (local wins on id conflicts).
- **Strict TypeScript 6** — `strict`, `verbatimModuleSyntax`, `noUnusedLocals`,
  `noUnusedParameters`, `erasableSyntaxOnly`, no enums, `import type` everywhere.
- **Engine is headless.** `src/typing/engine.ts` is pure and covered by 23 unit
  tests; React only renders its snapshot (`useTypingSession` drives it).
- **Route-level code splitting.** All app pages are `React.lazy`; recharts and
  the Supabase SDK live in async chunks. Entry bundle: ~161 kB gzip.
- **Reduced motion** is respected globally (CSS media query + framer-motion).

## Supabase (optional cloud sync)

1. Create a Supabase project.
2. Run the migration in the SQL editor (or `supabase db push`):
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
     — `profiles`, `sessions`, `lesson_progress`, `user_achievements`,
     `user_settings` with **RLS enabled on every table** (owner-only) and a
     `handle_new_user()` trigger that seeds the profile row.
3. Copy the URL + anon key into `.env.local`.
4. Enable the **Email** provider with password sign-in (a magic-link fallback
   and optional Google button are also offered). Set
   `VITE_ENABLE_GOOGLE_AUTH=true` to show the Google button.

Signing in pulls remote sessions/lessons into the local store; every finished
session, profile change and lesson result is upserted (fire-and-forget — sync
failures never block play).

> Only the anon key ships to the browser. Never put the service-role key in
> frontend code.

## Deploying to Vercel

The app is a Vite SPA with client-side routing — [`vercel.json`](vercel.json)
provides the rewrite to `index.html`.

1. Import the repo in Vercel (framework preset: **Vite**).
2. Build command: `npm run build` · Output directory: `dist`.
3. (Optional) add the Supabase env vars under *Project → Settings → Env Vars*.

## GitHub Setup

The repo uses branch `main`. To publish it:

```bash
git remote add origin https://github.com/<your-user>/<repo>.git
git push -u origin main
```

`.gitignore` excludes `.env*` (only `.env.example` is tracked), `node_modules`,
`dist`, `coverage` and `.vercel` — no secrets can be pushed by accident.

## Testing

```bash
npm test
```

130 tests across 11 files:

- `src/typing/*.test.ts` — engine (23), metric formulas (12), error classes (12)
- `src/lib/accuracy.test.ts` — accuracy contract: unit + property + legacy regression (15)
- `src/analytics/*.test.ts` — problem keys, patterns, summaries, plan (16)
- `src/lessons/lessons.test.ts` — unlock chain, stage evaluation, generators (14)
- `src/gamification/*.test.ts` — XP levels (8), streaks/goals/achievements (18)
- `src/test/app.smoke.test.tsx` — renders every route incl. lazy chunks (6)
- `src/test/auth.pages.test.tsx` — login/signup forms + client-side validation (4)
- `src/test/error-boundary.test.tsx` — crash recovery fallback (2)

`npm run test:coverage` reports ~86% statements / ~90% lines on the core
modules (`typing`, `analytics`, `lessons`, `gamification`).

## Security

- **No secrets in the repo.** `.env*` is git-ignored; only `.env.example`
  (variable names, no values) is committed. Git history was audited — no keys,
  tokens or credentials have ever been committed.
- **Supabase anon key only.** The frontend uses the public anon key; the
  service-role key must never appear in browser code (it doesn't).
- **RLS everywhere.** All five tables (`profiles`, `sessions`,
  `lesson_progress`, `user_achievements`, `user_settings`) have row-level
  security with owner-only policies (`auth.uid() = …`) — users can only ever
  read/write their own typing history.
- **Local accounts** store passwords only as PBKDF2-SHA256 hashes.
- **No `localhost` URLs** in production code paths; everything configures via
  `import.meta.env.VITE_*`.

## Future Improvements

- Multi-user leaderboards / shared lessons (would need server-side API)
- Offline-first background sync queue with conflict UI
- Screenshot automation for the README
- PWA install + service-worker offline mode
- More lesson content (coding symbols, numeric keypad track)

## License

MIT
