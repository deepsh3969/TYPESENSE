import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'accent'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-muted border-line',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  danger: 'bg-danger/10 text-danger border-danger/25',
  accent: 'bg-accent/10 text-accent border-accent/25',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px] border px-2.5 py-0.5 text-[11px] font-bold tracking-[0.06em] uppercase',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[3px] border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
