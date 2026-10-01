import { Target, Timer, Zap, Gauge, AlertCircle } from 'lucide-react'
import { accuracyToPercent } from '@/lib/accuracy'
import type { LiveSnapshot } from '@/hooks/useTypingSession'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui'

function fmt(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${`${s}`.padStart(2, '0')}`
}

export interface StatsBarProps {
  live: LiveSnapshot
  /** explicit label for progress (e.g. "12 / 30 words") */
  progressLabel?: string
  className?: string
}

/** Unified editorial metrics strip — one bordered surface, divided cells. */
export function StatsBar({ live, progressLabel, className }: StatsBarProps) {
  const time = live.remainingMs !== null ? fmt(live.remainingMs) : fmt(live.elapsedMs)
  const timeLabel = live.remainingMs !== null ? 'Time left' : 'Time'
  const lowTime = live.remainingMs !== null && live.remainingMs <= 5000 && live.remainingMs > 0

  return (
    <div
      className={cn('grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-5', className)}
      role="status"
      aria-live="off"
    >
      <StatTile label="WPM" value={live.wpm} icon={<Zap className="size-3.5" />} big />
      <StatTile
        label="Accuracy"
        value={live.attempts > 0 ? accuracyToPercent(live.accuracy, 1) : '—'}
        suffix={live.attempts > 0 ? '%' : undefined}
        icon={<Target className="size-3.5" />}
        tone={live.attempts > 0 && live.accuracy < 0.95 ? 'danger' : 'default'}
      />
      <StatTile
        label="Errors"
        value={live.errors}
        icon={<AlertCircle className="size-3.5" />}
        tone={live.errors > 0 ? 'danger' : 'default'}
      />
      <StatTile
        label={timeLabel}
        value={time}
        icon={<Timer className="size-3.5" />}
        tone={lowTime ? 'warning' : 'default'}
      />
      <StatTile
        label="Rhythm"
        value={live.consistency}
        suffix="%"
        icon={<Gauge className="size-3.5" />}
        className="col-span-2 sm:col-span-1"
      />
      {(progressLabel || live.progress > 0) && (
        <div className="col-span-2 bg-surface px-4 py-2.5 sm:col-span-5">
          <Progress value={live.progress} className="h-1" />
          {progressLabel && (
            <p className="mt-1.5 text-center text-[11px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
              {progressLabel}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  suffix,
  icon,
  big,
  tone = 'default',
  className,
}: {
  label: string
  value: string | number
  suffix?: string
  icon?: React.ReactNode
  big?: boolean
  tone?: 'default' | 'danger' | 'warning'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center bg-surface px-3 py-3', className)}>
      <span className="label flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          'num mt-1 leading-none font-bold text-ink',
          big ? 'text-4xl text-primary sm:text-5xl' : 'text-2xl sm:text-3xl',
          tone === 'danger' && 'text-danger',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
        {suffix && <span className="text-base font-semibold text-ink-faint">{suffix}</span>}
      </span>
    </div>
  )
}
