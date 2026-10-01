# TypeSense — Architecture

## Product loop

```
TYPE → ANALYZE → IDENTIFY WEAKNESSES → PRACTICE → RETEST → IMPROVE
```

Every layer of the codebase maps to one step of that loop.

| Loop step | Code location |
| --- | --- |
| TYPE | `src/typing/` (engine, input handling, timers) |
| ANALYZE | `src/analytics/` (metrics, error categorisation) |
| IDENTIFY WEAKNESSES | `src/analytics/problemKeys.ts`, `src/analytics/patterns.ts` |
| PRACTICE | `src/analytics/learningPlan.ts` → `src/lessons/` generators → Practice pages |
| RETEST | Typing Test page (same engine, different text) |
| IMPROVE | `src/pages/Progress.tsx` (before/after comparisons), `src/gamification/` |

## Layers

```
pages/        Route-level screens (composition only)
  └─ components/   Reusable UI: ui/ (primitives), layout/, charts/, keyboard/, typing/
       └─ stores/   Zustand stores — client state + selector-based subscriptions
            └─ services/  Persistence: local adapter (default) + Supabase adapter (when configured)
                 └─ typing/ analytics/ lessons/ gamification/  Pure, framework-free engines
                      └─ data/ types/ utils/  Seed content, shared types, pure helpers
```

**Rule:** engines (`typing/`, `analytics/`, `lessons/`, `gamification/`) are pure TypeScript with
no React and no I/O. They are unit-tested directly (`npm run test`). Everything else composes them.

## State

- **Zustand** with `persist` middleware. One store per domain: `typingStore`, `userStore`,
  `analyticsStore`, `uiStore`. UI state never touches the network.
- Keystroke handling deliberately avoids React: the typing engine mutates refs and only pushes
  throttled snapshots into React state (~60ms) so 200+ WPM input never drops frames.

## Persistence

`src/services/storage/` exposes a single `Repository` interface with two implementations:

- `localRepository` — `localStorage`, always available (guest mode).
- `supabaseRepository` — used automatically when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  are set and the user is signed in.

No fake data: when Supabase is unconfigured the app runs fully in local mode and the Settings /
Auth screens state exactly where data lives.

## Environment variables

| Var | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (RLS-protected) |
| `VITE_ENABLE_GOOGLE_AUTH` | Shows Google OAuth button when `true` |

Service-role key is never used in the frontend. RLS policies in `supabase/migrations` scope every
row to `auth.uid()`.

## Testing

Vitest + Testing Library. `src/typing/*.test.ts` and `src/analytics/*.test.ts` cover WPM maths,
accuracy, backspace/correction behaviour, timer expiry, error categorisation, problem-key ranking
and practice generation.
