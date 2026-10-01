import { useId, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  disabled?: boolean
}

/** iOS-style segmented control used for mode / duration pickers. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  size = 'md',
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const autoId = useId()
  const reduced = useReducedMotion()
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface-2 p-1', className)}
    >
      {options.map((option, index) => {
        const selected = index === activeIndex
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:opacity-40',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              selected ? 'text-white' : 'text-ink-muted hover:text-ink',
            )}
          >
            {selected && (
              <motion.span
                className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                layoutId={`${autoId}-thumb`}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
