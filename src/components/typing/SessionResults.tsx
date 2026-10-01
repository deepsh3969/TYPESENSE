import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Award, RotateCcw, Sparkles, TrendingUp, Zap } from 'lucide-react'
import type { TypingSession } from '@/types/typing'
import type { SessionOutcome } from '@/stores/userStore'
import type { LearningPlan } from '@/types/analytics'
import { Button, Card, Pill, StatCard } from '@/components/ui'
import { TimelineChart } from '@/components/charts'
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
      {/* header + rewards */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">
            {Math.round(m.elapsedMs / 1000)}s · {m.correctChars} correct characters
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {outcome && (
            <Pill className="bg-primary/10 text-primary">
              <Zap className="size-3.5" /> +{outcome.xp} XP
            </Pill>
          )}
          {outcome?.levelUp && (
            <Pill className="bg-accent/15 text-accent">
              <Sparkles className="size-3.5" /> Level {outcome.levelUp.to}
            </Pill>
          )}
          {outcome && outcome.streak > 1 && (
            <Pill className="bg-warning/15 text-warning">Streak {outcome.streak} days</Pill>
          )}
        </div>
      </div>

      {outcome && outcome.unlocked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
          <Award className="size-4 text-accent" aria-hidden />
          <span className="text-sm font-semibold text-ink">Achievements unlocked:</span>
          {outcome.unlocked.map((id) => (
            <Pill key={id} className="bg-accent/15 text-accent">
              {ACHIEVEMENT_MAP[id]?.title ?? id}
            </Pill>
          ))}
        </div>
      )}

      {/* headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="WPM" value={m.wpm} tone="primary" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Accuracy" value={m.accuracy.toFixed(1)} unit="%" tone="success" />
        <StatCard label="Net WPM" value={m.netWpm} />
        <StatCard label="Rhythm" value={m.consistency} unit="%" tone="accent" />
        <StatCard label="Errors" value={m.errors} tone={m.errors > 4 ? 'warning' : 'primary'} />
        <StatCard label="Corrections" value={`${m.correctionRate}%`} hint={`${m.corrections} fixed`} />
      </div>

      {/* timeline */}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Speed timeline</h3>
          <span className="text-xs text-ink-faint">avg {m.avgKeyDelayMs}ms per key</span>
        </div>
        <TimelineChart samples={session.timeline} fallbackWpm={m.wpm} />
      </Card>

      {/* problem keys from this session */}
      {keys.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-ink">Weakest keys this session</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {keys.map((k) => (
              <span
                key={k.key}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-bold',
                  k.score < 88
                    ? 'border-danger/40 bg-danger/10 text-danger'
                    : 'border-warning/40 bg-warning/10 text-warning',
                )}
              >
                <kbd className="rounded border border-current/30 px-1.5 font-mono text-xs uppercase">
                  {k.key === 'space' ? '␣' : k.key}
                </kbd>
                {Math.round(k.accuracy * 100)}%
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* learning plan nudge */}
      {plan && plan.focus.length > 0 && onPlanAction && (
        <Card className="border-primary/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-ink">Next up — {plan.headline}</h3>
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
