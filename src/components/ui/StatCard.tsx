import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon,
  hint,
  tone = 'primary',
  className,
  delay = 0,
}: {
  label: string
  value: ReactNode
  unit?: string
  /** percentage change; positive = good unless `deltaGood` is false */
  delta?: number | null
  deltaGood?: boolean
  deltaLabel?: string
  icon?: ReactNode
  hint?: string
  tone?: 'primary' | 'accent' | 'success' | 'warning'
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }[tone]

  const positive = (delta ?? 0) >= 0

  return (
    <Card className={cn('card-hover relative overflow-hidden p-5', className)}>
      <span className="absolute top-0 left-0 h-full w-[3px] bg-primary/60" aria-hidden />
      <div className="flex items-start justify-between">
        <div>
          <p className="label">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <motion.span
              className="num text-4xl font-bold text-ink"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay }}
            >
              {value}
            </motion.span>
            {unit && <span className="label">{unit}</span>}
          </div>
        </div>
        {icon && <span className={cn('border border-line p-2.5 text-primary', toneClasses)}>{icon}</span>}
      </div>
      {(delta !== undefined && delta !== null) || hint ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {delta !== undefined && delta !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 font-semibold',
                positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
              )}
            >
              {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {positive ? '+' : ''}
              {delta.toFixed(1)}
              {deltaLabel ?? '%'}
            </span>
          )}
          {hint && <span className="text-ink-muted">{hint}</span>}
        </div>
      ) : null}
    </Card>
  )
}
