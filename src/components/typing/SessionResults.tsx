import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Award, RotateCcw, Sparkles, TrendingUp, Zap } from 'lucide-react'
import type { TypingSession } from '@/types/typing'
import type { SessionOutcome } from '@/stores/userStore'
import type { LearningPlan } from '@/types/analytics'
import { Button, Card, Pill, StatCard } from '@/components/ui'
import { TimelineChart } from '@/components/charts'
import { accuracyToPercent, formatAccuracy } from '@/lib/accuracy'
import { computeProblemKeys } from '@/analytics/problemKeys'
import { ACHIEVEMENT_MAP } from '@/gamification/achievements'
import { cn } from '@/lib/utils'

export interface SessionResultsProps {
  session: TypingSession
  outcome?: SessionOutcome | null
  plan?: LearningPlan | null
  title?: string
  onRestart: () => void
  restartLabel?: string
  extraActions?: ReactNode
  onPlanAction?: (action: string, target: string) => void
}

export function SessionResults({
  session,
  outcome,
  plan,
  title = 'Session complete',
  onRestart,
  restartLabel = 'Try again',
  extraActions,
  onPlanAction,
}: SessionResultsProps) {
  const m = session.metrics
  const keys = computeProblemKeys([session]).filter((k) => k.attempts >= 4).slice(0, 8)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <p role="status" className="sr-only">
        {title}. {Math.round(m.wpm)} words per minute, {accuracyToPercent(m.accuracy, 1)} percent accuracy,{' '}
        {m.errors} errors.
      </p>
      {/* header + rewards */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="label label-accent mb-2">Session report</p>
          <h2 className="section-title text-ink">{title}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {Math.round(m.elapsedMs / 1000)}s · {m.correctChars} correct characters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {outcome && (
            <Pill className="border border-primary/50 bg-primary/10 text-primary">
              <Zap className="size-3.5" /> +{outcome.xp} XP
            </Pill>
          )}
          {outcome?.levelUp && (
            <Pill className="border border-accent/50 bg-accent/15 text-accent">
              <Sparkles className="size-3.5" /> Level {outcome.levelUp.to}
            </Pill>
          )}
          {outcome && outcome.streak > 1 && (
            <Pill className="border border-warning/50 bg-warning/15 text-warning">Streak {outcome.streak} days</Pill>
          )}
        </div>
      </div>

      {outcome && outcome.unlocked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border border-accent/40 bg-accent/5 p-3">
          <Award className="size-4 text-accent" aria-hidden />
          <span className="label text-ink">Achievements unlocked</span>
          {outcome.unlocked.map((id) => (
            <Pill key={id} className="border border-accent/50 bg-accent/15 text-accent">
              {ACHIEVEMENT_MAP[id]?.title ?? id}
            </Pill>
          ))}
        </div>
      )}

      {/* headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="WPM" value={m.wpm} tone="primary" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Accuracy" value={accuracyToPercent(m.accuracy, 1)} unit="%" tone="success" />
        <StatCard label="Net WPM" value={m.netWpm} />
        <StatCard label="Rhythm" value={m.consistency} unit="%" tone="accent" />
        <StatCard label="Errors" value={m.errors} tone={m.errors > 4 ? 'warning' : 'primary'} />
        <StatCard label="Correction rate" value={formatAccuracy(m.correctionRate, 0)} hint={`${m.corrections} fixed`} />
      </div>

      {/* timeline */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
          <h3 className="label text-ink-muted">Speed timeline</h3>
          <span className="label">avg {m.avgKeyDelayMs}ms per key</span>
        </div>
        <TimelineChart samples={session.timeline} fallbackWpm={m.wpm} />
      </Card>

      {/* problem keys from this session */}
      {keys.length > 0 && (
        <Card className="p-4">
          <h3 className="label text-ink-muted">Weakest keys this session</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {keys.map((k) => (
              <span
                key={k.key}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[3px] border px-2.5 py-1.5 text-sm font-bold',
                  k.score < 88
                    ? 'border-danger/50 bg-danger/10 text-danger'
                    : 'border-warning/50 bg-warning/10 text-warning',
                )}
              >
                <kbd className="rounded-[2px] border border-current/40 px-1.5 font-mono text-xs uppercase">
                  {k.key === 'space' ? '␣' : k.key}
                </kbd>
                {formatAccuracy(k.accuracy, 0)}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* learning plan nudge */}
      {plan && plan.focus.length > 0 && onPlanAction && (
        <Card className="border-primary/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label label-accent">What you should practice</p>
              <h3 className="mt-1 font-display text-base font-bold tracking-tight text-ink uppercase">{plan.headline}</h3>
              <p className="mt-0.5 text-xs text-ink-muted">{plan.focus[0].detail}</p>
            </div>
            <Button size="sm" onClick={() => onPlanAction(plan.focus[0].action, plan.focus[0].target)}>
              Start focus drill
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onRestart} size="lg">
          <RotateCcw className="size-4" /> {restartLabel}
        </Button>
        {extraActions}
      </div>
    </motion.div>
  )
}
