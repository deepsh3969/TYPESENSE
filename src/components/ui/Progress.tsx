import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'accent'

const toneMap: Record<Tone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
}

export function Progress({
  value,
  tone = 'primary',
  className,
  barClassName,
  label,
}: {
  /** 0..100 */
  value: number
  tone?: Tone
  className?: string
  barClassName?: string
  label?: string
}) {
  const reduced = useReducedMotion()
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
    >
      <motion.div
        className={cn('h-full rounded-full', toneMap[tone], barClassName)}
        initial={reduced ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

/** Ring-style progress for circular indicators (daily goal, lesson progress). */
export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  tone = 'primary',
  children,
  className,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: Tone
  children?: React.ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={toneMap[tone]}
          strokeDasharray={circumference}
          initial={reduced ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * pct) / 100 }}
          transition={{ duration: reduced ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ink">{children}</div>
    </div>
  )
}
