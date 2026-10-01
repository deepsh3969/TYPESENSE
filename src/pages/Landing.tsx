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
            ? 'flex size-11 items-center justify-center bg-primary text-white'
            : 'flex size-8 items-center justify-center bg-primary text-white'
        }
      >
        <KeyboardIcon className={size === 'lg' ? 'size-6' : 'size-4'} aria-hidden />
      </span>
      <span
        className={
          size === 'lg'
            ? 'font-display text-xl font-bold tracking-tight'
            : 'font-display text-sm font-bold tracking-tight'
        }
      >
        TYPE<span className="text-primary">SENSE</span>
      </span>
    </Link>
  )
}

const SHELL = 'mx-auto w-full max-w-[1440px] px-4 sm:px-6 xl:px-10'

export function Landing() {
  const { setTheme } = useTheme()
  const hasSessions = useSessionsStore((s) => s.sessions.length > 0)
  const isDark = document.documentElement.dataset.theme === 'dark'

  return (
    <div className="min-h-screen bg-bg text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className={`${SHELL} flex h-16 items-center justify-between`}>
          <Logo />
          <nav className="hidden items-center gap-7 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase md:flex">
            <a href="#features" className="transition-colors hover:text-primary">Features</a>
            <a href="#how" className="transition-colors hover:text-primary">How it works</a>
            <a href="#progress" className="transition-colors hover:text-primary">Progress</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex size-9 items-center justify-center border border-line text-ink-muted transition-colors hover:text-ink"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <LinkButton to="/login" size="sm" variant="ghost" className="hidden sm:inline-flex">
              Sign in
            </LinkButton>
            <LinkButton to={hasSessions ? '/app' : '/app/test'} size="sm">
              {hasSessions ? 'Open app' : 'Start typing'} <ArrowRight className="size-3.5" />
            </LinkButton>
          </div>
        </div>
      </header>

      <main id="main">
        {/* hero */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="wire-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div
            className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full bg-primary/12 blur-[130px]"
            aria-hidden
          />
          <div className={`${SHELL} relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24`}>
            <div>
              <p className="label label-accent mb-5">Engine-first typing trainer</p>
              <h1 className="hero-title text-ink">
                Type faster.
                <br />
                <span className="text-primary">Fix what actually</span>
                <br />
                holds you back.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
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
                    <dt className="num text-3xl font-bold text-ink">{v}</dt>
                    <dd className="label mt-1">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:pl-6">
              <HeroDemo />
            </div>
          </div>
        </section>

        {/* features — editorial grid, no card monotony */}
        <section id="features" className={`${SHELL} py-16 sm:py-20`}>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
            <div>
              <p className="label label-accent mb-3">Features</p>
              <h2 className="section-title text-ink">Everything a typist needs, in one loop</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
              Type → analyze → identify weaknesses → practice → retest → improve.
            </p>
          </div>
          <div className="mt-px grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article key={f.title} className="group relative bg-bg p-6 transition-colors hover:bg-surface sm:p-8">
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center border border-line bg-surface text-primary transition-colors group-hover:border-primary">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <span className="num text-xs font-bold text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink uppercase">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="border-y border-line bg-surface">
          <div className={`${SHELL} py-16 sm:py-20`}>
            <p className="label label-accent mb-3">Method</p>
            <h2 className="section-title text-ink">The improvement loop</h2>
            <div className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.n} className="bg-surface p-6 sm:p-7">
                  <span className="num block text-6xl leading-none font-bold text-primary/25">{s.n}</span>
                  <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-ink uppercase">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* progress preview */}
        <section id="progress" className={`${SHELL} py-16 sm:py-20`}>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="label label-accent mb-3">Progress</p>
              <h2 className="section-title text-ink">Progress you can actually see</h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
                Every session feeds a 7/30/90-day view: speed trend, accuracy, weakest keys and a first-half vs
                second-half delta so improvement is measured, not assumed.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  { Icon: LineChart, text: 'WPM & accuracy trend over any range' },
                  { Icon: CalendarCheck, text: 'Daily goal + streak tracking' },
                  { Icon: Waves, text: 'Rhythm consistency scoring' },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 border-b border-line pb-3 text-sm font-semibold text-ink">
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden />
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
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <h3 className="label text-ink-muted">Sample improvement curve</h3>
                <span className="label">sample data</span>
              </div>
              <Sparkline data={SAMPLE} />
            </Card>
          </div>
        </section>

        {/* CTA — full-bleed red band */}
        <section className="bg-primary text-white">
          <div className={`${SHELL} flex flex-col items-start justify-between gap-8 py-14 sm:py-16 lg:flex-row lg:items-end`}>
            <div>
              <p className="mb-4 text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase">No sign-up required</p>
              <h2 className="font-display text-4xl leading-[0.95] font-bold tracking-tight uppercase sm:text-5xl lg:text-6xl">
                Your first test
                <br />
                takes 30 seconds
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                Everything runs locally in your browser until you choose to connect an account.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LinkButton
                to="/app/test"
                size="lg"
                className="bg-black text-white hover:bg-black/80"
              >
                Start typing now <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton
                to="/signup"
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:border-white hover:text-white"
              >
                Create account
              </LinkButton>
            </div>
          </div>
        </section>
      </main>

      {/* footer */}
      <footer className="border-t border-line">
        <div className={`${SHELL} flex flex-col items-center justify-between gap-4 py-8 sm:flex-row`}>
          <Logo />
          <p className="label text-center sm:text-left">
            Local-first by default · Works offline · Your data stays in your browser
          </p>
          <nav className="flex gap-5 text-xs font-bold tracking-[0.1em] text-ink-muted uppercase">
            <Link to="/app" className="hover:text-primary">App</Link>
            <Link to="/app/lessons" className="hover:text-primary">Lessons</Link>
            <Link to="/app/settings" className="hover:text-primary">Settings</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
