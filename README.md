# TypeSense

A production-quality typing-speed test and personalised typing-learning web app.

**TYPE → ANALYZE → IDENTIFY WEAKNESSES → PRACTICE → RETEST → IMPROVE**

Every finished session is analysed per keystroke: which keys fail, which letter
combinations trip you up, which words you fumble, where your rhythm breaks.
That analysis drives targeted practice drills, a lesson curriculum and a
learning plan, so the next session is built around *your* weaknesses — not a
generic word list.

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

```
elapsedMin = max(elapsedMs, 1000) / 60000           (clamped, avoids ∞)

Gross WPM = (allPrintableKeystrokes / 5) / elapsedMin
WPM       = (correctCharacters    / 5) / elapsedMin   ← headline
Net WPM   = max(0, Gross WPM − uncorrectedErrors / elapsedMin)
CPM       = Gross WPM × 5

Accuracy       = correctKeystrokes / allPrintableKeystrokes × 100   (first-attempt)
FinalAcc       = correctSlots / filledSlots × 100                   (buffer match)
CorrectionRate = corrections / (corrections + uncorrectedErrors) × 100
Consistency    = clamp(1 − stdev(keyDelays)/mean(keyDelays), 0, 1)
```

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

## Testing

```bash
npm test
```

114 tests across 10 files:

- `src/typing/*.test.ts` — engine (23), metric formulas (12), error classes (12)
- `src/analytics/*.test.ts` — problem keys, patterns, summaries, plan (16)
- `src/lessons/lessons.test.ts` — unlock chain, stage evaluation, generators (14)
- `src/gamification/*.test.ts` — XP levels (8), streaks/goals/achievements (17)
- `src/test/app.smoke.test.tsx` — renders every route incl. lazy chunks (6)
- `src/test/auth.pages.test.tsx` — login/signup forms + client-side validation (4)
- `src/test/error-boundary.test.tsx` — crash recovery fallback (2)

`npm run test:coverage` reports ~86% statements / ~90% lines on the core
modules (`typing`, `analytics`, `lessons`, `gamification`).

## License

MIT
