import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Flame,
  GraduationCap,
  Keyboard as KeyboardIcon,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react'
import { Card, LinkButton, StatCard, Pill } from '@/components/ui'
import { TrendChart } from '@/components/charts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { dailySeries } from '@/analytics/summarize'
import { useUserStore } from '@/stores/userStore'
import { useSessionsStore } from '@/stores/sessionsStore'
import { useProgressStore } from '@/stores/progressStore'
import { goalProgress, displayedStreak } from '@/gamification/streaks'
import { levelFromXp } from '@/gamification/levels'
import { recommendedLesson, lessonStatus } from '@/lessons'
import { cn } from '@/lib/utils'
import type { FocusItem } from '@/types/analytics'

const ACTION_LINK: Record<FocusItem['action'], string> = {
  'practice-key': '/app/practice/problem-keys',
  'practice-pattern': '/app/practice/combinations',
  'practice-words': '/app/practice/weak-words',
  'practice-punctuation': '/app/practice/punctuation',
  retest: '/app/test',
}

const ACTION_ICON: Record<FocusItem['icon'], typeof Target> = {
  key: KeyboardIcon,
  words: Target,
  pattern: Zap,
  punct: Target,
  test: Timer,
}

export function Dashboard() {
  const user = useUserStore((s) => s.data)
  const sessions = useSessionsStore((s) => s.sessions)
  const lessonProgress = useProgressStore((s) => s.lessonProgress)
  const { summary, plan } = useAnalytics(7)

  const streak = displayedStreak(user.streak)
  const goalPct = goalProgress(user.dailyGoal)
  const level = levelFromXp(user.profile.xp)
  const rec = recommendedLesson(lessonProgress)
  const daily = useMemo(() => dailySeries(sessions.slice(0, 60), 7), [sessions])

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{greeting}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {user.profile.displayName}
            <span className="ml-2 align-middle text-sm font-bold text-ink-faint">
              Level {level.level} · {level.title}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill className={streak > 0 ? 'bg-warning/10 text-warning' : 'bg-surface-2 text-ink-faint'}>
            <Flame className={cn('size-3.5', streak > 0 && 'text-warning')} /> {streak} day streak
          </Pill>
          <Pill className="bg-primary/10 text-primary">
            {Math.round(user.dailyGoal.minutes)}/{user.dailyGoal.goalMinutes} min today
          </Pill>
        </div>
      </div>

      {sessions.length === 0 && (
        <Card className="relative overflow-hidden border-primary/30 p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(79,70,229,0.14),transparent_60%)]" />
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Zap className="size-3.5" /> 3-minute setup
            </span>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
              Let&apos;s find out how you really type
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Take one test. We&apos;ll classify every mistake, score every key and build your personal
              improvement plan from the result — then you practice only what matters.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <LinkButton to="/app/test">
                <Timer className="size-4" /> Take your first test
              </LinkButton>
              <LinkButton to="/app/lessons" variant="secondary">
                <GraduationCap className="size-4" /> Start at Lesson 1
              </LinkButton>
            </div>
          </div>
        </Card>
      )}

      {/* quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Best speed" value={user.stats.bestWpm} unit="WPM" tone="warning" icon={<Zap className="size-5" />} />
        <StatCard label="Avg accuracy" value={Math.round(user.stats.avgAccuracy * 10) / 10} unit="%" tone="success" icon={<Target className="size-5" />} />
        <StatCard label="Lessons done" value={user.stats.lessonsCompleted} icon={<GraduationCap className="size-5" />} />
        <StatCard label="Tests taken" value={user.stats.testsTaken} tone="accent" icon={<Trophy className="size-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* learning plan */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Today&apos;s focus</p>
              <h2 className="mt-1 text-lg font-extrabold text-ink">
                {plan ? plan.headline : 'Complete a test to unlock your plan'}
              </h2>
            </div>
            <LinkButton to="/app/practice" size="sm" variant="outline">
              All drills <ArrowRight className="size-3.5" />
            </LinkButton>
          </div>

          {plan && plan.focus.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {plan.focus.slice(0, 3).map((f) => {
                const Icon = ACTION_ICON[f.icon] ?? Target
                return (
                  <li key={f.id}>
                    <Link
                      to={ACTION_LINK[f.action]}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-ink group-hover:text-primary">{f.label}</span>
                        <span className="block truncate text-xs text-ink-muted">{f.detail}</span>
                      </span>
                      <span className="text-[11px] font-bold text-ink-faint">{Math.round(f.priority)}%</span>
                      <ArrowRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              Your plan is generated from real sessions — take a test and it appears here.
            </p>
          )}
        </Card>

        {/* daily goal */}
        <Card className="flex flex-col items-center justify-center p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Daily goal</p>
          <div className="relative my-4">
            <div className="size-28 rounded-full border-[10px] border-surface-2" aria-hidden>
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(100, goalPct) * 2.64} 264`}
                />
              </svg>
            </div>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-ink">{Math.round(goalPct)}%</span>
              <span className="text-[11px] text-ink-faint">
                {Math.round(user.dailyGoal.minutes)}/{user.dailyGoal.goalMinutes}m
              </span>
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            {goalPct >= 100
              ? 'Goal smashed. Extra minutes are pure bonus XP.'
              : `${Math.max(1, user.dailyGoal.goalMinutes - Math.round(user.dailyGoal.minutes))} minutes left today`}
          </p>
          <LinkButton to="/app/test" size="sm" className="mt-4">
            Practise now
          </LinkButton>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* weekly trend */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Last 7 days</h2>
            <Link to="/app/progress" className="text-xs font-semibold text-primary hover:underline">
              Full progress →
            </Link>
          </div>
          <TrendChart data={daily} />
        </Card>

        {/* right column */}
        <div className="space-y-4">
          {rec && (
            <Card className="p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <GraduationCap className="size-4 text-primary" aria-hidden />
                Recommended lesson
              </h2>
              <p className="mt-2 font-bold text-ink">{rec.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{rec.objective}</p>
              <LinkButton to={`/app/lessons/${rec.id}`} size="sm" className="mt-3 w-full">
                {lessonStatus(rec, lessonProgress) === 'in-progress' ? 'Continue' : 'Start'} lesson
              </LinkButton>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <KeyboardIcon className="size-4 text-danger" aria-hidden />
                Weakest keys
              </h2>
              <Link to="/app/mistakes" className="text-xs font-semibold text-primary hover:underline">
                Mistake Lab →
              </Link>
            </div>
            {summary.problemKeys.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {summary.problemKeys.slice(0, 8).map((k) => (
                  <Link
                    key={k.key}
                    to="/app/practice/problem-keys"
                    className={cn(
                      'rounded-md border px-2 py-1 font-mono text-xs font-bold uppercase transition-transform hover:scale-105',
                      k.score < 88
                        ? 'border-danger/40 bg-danger/10 text-danger'
                        : 'border-warning/40 bg-warning/10 text-warning',
                    )}
                    title={`${Math.round(k.accuracy * 100)}% accuracy`}
                  >
                    {k.key === 'space' ? '␣' : k.key}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-muted">Not enough data yet — take a test.</p>
            )}
          </Card>

          {sessions.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">Recent tests</h2>
                <Link to="/app/progress" className="text-xs font-semibold text-primary hover:underline">
                  History →
                </Link>
              </div>
              <ul className="mt-2 space-y-1.5">
                {sessions.slice(0, 4).map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">
                      {s.source} · {new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-bold text-ink">
                      {s.metrics.wpm} WPM
                      <span className="ml-1.5 text-ink-faint">{s.metrics.accuracy}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
