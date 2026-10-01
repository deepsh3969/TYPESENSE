import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bug,
  CalendarCheck,
  GraduationCap,
  KeyboardIcon,
  LineChart,
  Moon,
  Sun,
  Target,
  Timer,
  Trophy,
  Waves,
} from 'lucide-react'
import { Card, LinkButton } from '@/components/ui'
import { HeroDemo } from '@/components/landing/HeroDemo'
import { Sparkline } from '@/components/charts/Sparkline'
import type { DailyPoint } from '@/analytics/summarize'
import { useTheme } from '@/hooks/useTheme'
import { useSessionsStore } from '@/stores/sessionsStore'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Real-time metric engine',
    text: 'WPM, accuracy, rhythm consistency and net speed — computed per keystroke with documented formulas, not vibes.',
  },
  {
    icon: Bug,
    title: 'The Mistake Lab',
    text: 'Every error is classified: transpositions, missed spaces, wrong keys, slow hesitations. See exactly what breaks your flow.',
  },
  {
    icon: Target,
    title: 'Problem-key detection',
    text: 'Confidence-weighted scoring finds the keys and bigrams you actually fumble — never raw error counts.',
  },
  {
    icon: GraduationCap,
    title: 'Adaptive lessons',
    text: '25 lessons across 5 levels with unlockable stages that pass only when you hit the accuracy bar.',
  },
  {
    icon: KeyboardIcon,
    title: 'Keyboard heatmaps',
    text: 'Watch keys light up red as you fail them and drill them away in focused practice modes.',
  },
  {
    icon: Trophy,
    title: 'Streaks, XP & goals',
    text: 'Daily practice goals, a visible streak and 20 achievements keep the habit alive between tests.',
  },
]

const STEPS = [
  { n: '01', title: 'Type', text: 'Take a timed test, word sprint or custom run. The engine records every keystroke.' },
  { n: '02', title: 'Analyze', text: 'Errors are classified, keys scored and patterns ranked by confidence.' },
  { n: '03', title: 'Practice', text: 'Targeted drills generated from YOUR mistakes — problem keys, weak words, bigrams.' },
  { n: '04', title: 'Improve', text: 'Retest, measure the delta and unlock the next lesson as weak spots turn green.' },
]

const SAMPLE: DailyPoint[] = Array.from({ length: 14 }, (_, i) => ({
  date: `2026-09-${String(i + 10).padStart(2, '0')}`,
  wpm: Math.round(44 + i * 1.6 + Math.sin(i * 1.4) * 4),
  accuracy: Math.round((93 + i * 0.42 + Math.cos(i) * 1.1) * 10) / 10,
  minutes: 6 + (i % 5) * 3,
  errors: Math.max(1, 9 - Math.floor(i / 2)),
}))

function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="TypeSense home">
      <span
        className={
          size === 'lg'
            ? 'flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30'
            : 'flex size-8 items-center justify-center rounded-lg bg-primary text-white'
        }
      >
        <KeyboardIcon className={size === 'lg' ? 'size-6' : 'size-4'} aria-hidden />
      </span>
      <span className={size === 'lg' ? 'text-xl font-extrabold tracking-tight' : 'text-sm font-extrabold tracking-tight'}>
        TYPE<span className="text-primary">SENSE</span>
      </span>
    </Link>
  )
}

export function Landing() {
  const { setTheme } = useTheme()
  const hasSessions = useSessionsStore((s) => s.sessions.length > 0)
  const isDark = document.documentElement.dataset.theme === 'dark'

  return (
    <div className="min-h-screen bg-bg text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-muted md:flex">
            <a href="#features" className="transition-colors hover:text-ink">Features</a>
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
            <a href="#progress" className="transition-colors hover:text-ink">Progress</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex size-9 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:text-ink"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <LinkButton to={hasSessions ? '/app' : '/app/test'} size="sm" className="hidden sm:inline-flex">
              {hasSessions ? 'Open app' : 'Start typing'} <ArrowRight className="size-3.5" />
            </LinkButton>
          </div>
        </div>
      </header>

      <main id="main">
      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.12),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <LineChart className="size-3.5" aria-hidden />
              Engine-first typing trainer
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Type faster.
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Fix what actually
              </span>
              <br />
              holds you back.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
              TypeSense doesn&apos;t just count your speed. It classifies every mistake, scores every key and
              turns your weaknesses into focused drills — then proves you improved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to="/app/test" size="lg">
                <Timer className="size-4" /> Take a typing test
              </LinkButton>
              <LinkButton to="/app/lessons" size="lg" variant="secondary">
                <GraduationCap className="size-4" /> Explore lessons
              </LinkButton>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                ['25', 'guided lessons'],
                ['10', 'practice modes'],
                ['20', 'achievements'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-extrabold text-ink">{v}</dt>
                  <dd className="text-xs font-medium text-ink-faint">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:pl-6">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">Everything a typist needs, in one loop</h2>
          <p className="mt-3 text-ink-muted">Type → analyze → identify weaknesses → practice → retest → improve.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Card key={f.title} className="card-hover p-5" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-base font-bold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="border-y border-line bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink">The improvement loop</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="text-5xl font-extrabold text-primary/15">{s.n}</span>
                <h3 className="-mt-3 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* progress preview */}
      <section id="progress" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Progress you can actually see</h2>
            <p className="mt-4 text-ink-muted">
              Every session feeds a 7/30/90-day view: speed trend, accuracy, weakest keys and a first-half vs
              second-half delta so improvement is measured, not assumed.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { Icon: LineChart, text: 'WPM & accuracy trend over any range' },
                { Icon: CalendarCheck, text: 'Daily goal + streak tracking' },
                { Icon: Waves, text: 'Rhythm consistency scoring' },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <LinkButton to="/app/progress" variant="outline">
                See the progress view <ArrowRight className="size-3.5" />
              </LinkButton>
            </div>
          </div>
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Sample improvement curve</h3>
              <span className="text-[11px] font-medium text-ink-faint">sample data</span>
            </div>
            <Sparkline data={SAMPLE} />
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-8 text-center sm:p-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Your first test takes 30 seconds
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
            No sign-up required. Everything runs locally in your browser until you choose to connect an account.
          </p>
          <div className="mt-7">
            <LinkButton to="/app/test" size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Start typing now
            </LinkButton>
          </div>
        </div>
      </section>

      </main>

      {/* footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-ink-faint">
            Local-first by default · Works offline · Your data stays in your browser
          </p>
          <nav className="flex gap-4 text-xs font-semibold text-ink-muted">
            <Link to="/app" className="hover:text-ink">App</Link>
            <Link to="/app/lessons" className="hover:text-ink">Lessons</Link>
            <Link to="/app/settings" className="hover:text-ink">Settings</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
